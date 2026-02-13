"""
Experiment Runner — Compare DeepAR vs Baselines.

Temporal split:
    Train:  1950 — 2001 (52 years, ~70%)
    Valid:  2002 — 2008 (7 years,  ~10%)
    Test:   2009 — 2023 (15 years, ~20%)

Experiments:
    1. DeepAR vs Single LSTM:
       Both tested on 1 country (Vietnam) — fair single-series comparison.
       Single LSTM trains ONLY on Vietnam's data.
       DeepAR trains on ALL countries, tested on Vietnam.

    2. DeepAR vs Multi LSTM:
       Both trained on all countries, tested on full test set.
       Shows the value of autoregressive + Gaussian design.

Usage:
    cd challenge_6
    python -m ai_service.ai.experiments.run_experiment
"""

import sys
import time
import logging
import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader, TensorDataset
from pathlib import Path
from tabulate import tabulate

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from ai_service.ai.src.config import Config
from ai_service.ai.src.data.preprocessor import DataPreprocessor
from ai_service.ai.src.data.dataset import DeepARDataset
from ai_service.ai.src.models.deepar import DeepARModel
from ai_service.ai.src.training.trainer import Trainer
from ai_service.ai.src.training.losses import gaussian_nll_loss
from ai_service.ai.src.inference.predictor import DeepARPredictor
from ai_service.ai.src.utils.scaler import MeanScaler
from ai_service.ai.src.utils.metrics import compute_all_metrics

from .baselines.single_lstm import SingleLSTM
from .baselines.multi_lstm import MultiLSTM

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s │ %(levelname)-7s │ %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

# ── Temporal split boundaries ───────────────────────────────────
TRAIN_END = 2001
VAL_END = 2008
TEST_START = 2009
TEST_COUNTRY = 'Vietnam'   # Country for single-series comparison
CHECKPOINT_DIR = 'ai_service/ai/checkpoints/experiments'


def prepare_data(config: Config):
    """Load and prepare data splits."""
    preprocessor = DataPreprocessor(config.data.csv_path, config.data.non_countries)
    df = preprocessor.load_and_clean()
    preprocessor.build_country_mapping(df)

    country_populations, country_years = preprocessor.get_arrays(df)

    # Fit scaler on TRAIN data only (no data leakage)
    train_populations = {}
    for country, pops in country_populations.items():
        years = country_years[country]
        mask = years <= TRAIN_END
        train_populations[country] = pops[mask]

    scaler = MeanScaler().fit(train_populations)

    return preprocessor, df, country_populations, country_years, scaler


def create_deepar_datasets(
    country_populations, country_years, country_to_idx, scaler, window_size
):
    """Create train/val datasets for DeepAR and Multi LSTM."""
    train_ds = DeepARDataset(
        country_populations, country_years, country_to_idx, scaler,
        window_size=window_size, year_min=1950, year_max=TRAIN_END,
    )

    val_ds = DeepARDataset(
        country_populations, country_years, country_to_idx, scaler,
        window_size=window_size, year_min=1950, year_max=VAL_END,
        end_year_min=TRAIN_END + 1,  # windows that include validation years
    )

    return train_ds, val_ds


def create_single_lstm_datasets(
    country_populations, country_years, scaler, window_size, country: str
):
    """Create train/val datasets for a single country LSTM."""
    pops = country_populations[country]
    years = country_years[country]
    scale = scaler.get_scale(country)

    def make_windows(year_min, year_max, end_year_min=None):
        mask = (years >= year_min) & (years <= year_max)
        p = pops[mask] / scale
        y = years[mask]
        windows = []
        for i in range(len(p) - window_size + 1):
            wp = p[i:i + window_size]
            wy = y[i:i + window_size]
            if end_year_min and wy[-1] < end_year_min:
                continue
            windows.append(wp.astype(np.float32))
        return windows

    train_windows = make_windows(1950, TRAIN_END)
    val_windows = make_windows(1950, VAL_END, end_year_min=TRAIN_END + 1)

    def to_tensor_dataset(windows):
        if not windows:
            return None
        data = torch.tensor(np.array(windows), dtype=torch.float32)
        return TensorDataset(data)

    return to_tensor_dataset(train_windows), to_tensor_dataset(val_windows), scale


# ═══════════════════════════════════════════════════════════════
# Training functions for each model
# ═══════════════════════════════════════════════════════════════

def train_deepar(config, country_populations, country_years, country_to_idx,
                 scaler, num_countries, device):
    """Train DeepAR model for experiments."""
    logger.info("=" * 60)
    logger.info("Training DeepAR (Proposed Model)")
    logger.info("=" * 60)

    train_ds, val_ds = create_deepar_datasets(
        country_populations, country_years, country_to_idx, scaler,
        config.data.window_size,
    )
    logger.info(f"  Train samples: {len(train_ds)}, Val samples: {len(val_ds)}")

    train_loader = DataLoader(train_ds, batch_size=config.training.batch_size,
                              shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=config.training.batch_size,
                            shuffle=False, num_workers=2, pin_memory=True)

    model = DeepARModel(
        num_countries=num_countries,
        embedding_dim=config.model.embedding_dim,
        hidden_size=config.model.hidden_size,
        num_layers=config.model.num_layers,
        dropout=config.model.dropout,
    )

    trainer = Trainer(
        model=model, train_loader=train_loader, val_loader=val_loader,
        lr=config.training.learning_rate, weight_decay=config.training.weight_decay,
        grad_clip=config.training.grad_clip, patience=config.training.patience,
        checkpoint_dir=CHECKPOINT_DIR, device=device,
    )
    trainer.fit(config.training.epochs, prefix='exp_deepar')
    trainer.load_checkpoint('exp_deepar_best.pt')

    return model


def train_multi_lstm(config, country_populations, country_years, country_to_idx,
                     scaler, num_countries, device):
    """Train Multi LSTM baseline."""
    logger.info("=" * 60)
    logger.info("Training Multi LSTM (Baseline 2)")
    logger.info("=" * 60)

    train_ds, val_ds = create_deepar_datasets(
        country_populations, country_years, country_to_idx, scaler,
        config.data.window_size,
    )
    logger.info(f"  Train samples: {len(train_ds)}, Val samples: {len(val_ds)}")

    train_loader = DataLoader(train_ds, batch_size=config.training.batch_size,
                              shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=config.training.batch_size,
                            shuffle=False, num_workers=2, pin_memory=True)

    model = MultiLSTM(
        num_countries=num_countries,
        embedding_dim=config.model.embedding_dim,
        hidden_size=config.model.hidden_size,
        num_layers=config.model.num_layers,
        dropout=config.model.dropout,
    ).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=config.training.learning_rate,
                                 weight_decay=config.training.weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10, factor=0.5)
    criterion = nn.MSELoss()

    best_loss = float('inf')
    patience_counter = 0
    ckpt_path = Path(CHECKPOINT_DIR)
    ckpt_path.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, config.training.epochs + 1):
        # Train
        model.train()
        train_loss = 0
        for batch in train_loader:
            cidx = batch['country_idx'].to(device)
            pops = batch['populations'].to(device)
            yrs = batch['years'].to(device)

            preds = model(cidx, yrs, pops)
            loss = criterion(preds, pops)

            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), config.training.grad_clip)
            optimizer.step()
            train_loss += loss.item()
        train_loss /= len(train_loader)

        # Validate
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for batch in val_loader:
                cidx = batch['country_idx'].to(device)
                pops = batch['populations'].to(device)
                yrs = batch['years'].to(device)
                preds = model(cidx, yrs, pops)
                val_loss += criterion(preds, pops).item()
        val_loss /= len(val_loader)
        scheduler.step(val_loss)

        if epoch % 10 == 0 or epoch == 1:
            logger.info(f"  Epoch {epoch:03d} │ Train: {train_loss:.6f} │ Val: {val_loss:.6f}")

        if val_loss < best_loss:
            best_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), ckpt_path / 'exp_multi_lstm_best.pt')
        else:
            patience_counter += 1
            if patience_counter >= config.training.patience:
                logger.info(f"  Early stopping at epoch {epoch}")
                break

    model.load_state_dict(torch.load(ckpt_path / 'exp_multi_lstm_best.pt', map_location=device, weights_only=True))
    return model


def train_single_lstm(config, country_populations, country_years, scaler, device):
    """Train Single LSTM on TEST_COUNTRY only."""
    logger.info("=" * 60)
    logger.info(f"Training Single LSTM (Baseline 1) — {TEST_COUNTRY} only")
    logger.info("=" * 60)

    train_ds, val_ds, scale = create_single_lstm_datasets(
        country_populations, country_years, scaler,
        config.data.window_size, TEST_COUNTRY,
    )

    if train_ds is None:
        logger.warning(f"  No training data for {TEST_COUNTRY}!")
        return None, scale

    logger.info(f"  Train samples: {len(train_ds)}, Val samples: {len(val_ds) if val_ds else 0}")

    train_loader = DataLoader(train_ds, batch_size=min(32, len(train_ds)), shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False) if val_ds else None

    model = SingleLSTM(
        hidden_size=config.model.hidden_size,
        num_layers=config.model.num_layers,
        dropout=config.model.dropout,
    ).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=config.training.learning_rate)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10, factor=0.5)
    criterion = nn.MSELoss()

    best_loss = float('inf')
    patience_counter = 0
    ckpt_path = Path(CHECKPOINT_DIR)
    ckpt_path.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, config.training.epochs + 1):
        model.train()
        train_loss = 0
        for (batch_data,) in train_loader:
            batch_data = batch_data.to(device)
            preds = model(batch_data)
            loss = criterion(preds, batch_data)

            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), config.training.grad_clip)
            optimizer.step()
            train_loss += loss.item()
        train_loss /= len(train_loader)

        val_loss = float('inf')
        if val_loader:
            model.eval()
            vl = 0
            with torch.no_grad():
                for (bd,) in val_loader:
                    bd = bd.to(device)
                    preds = model(bd)
                    vl += criterion(preds, bd).item()
            val_loss = vl / len(val_loader)
            scheduler.step(val_loss)

        monitor = val_loss if val_loader else train_loss
        if epoch % 10 == 0 or epoch == 1:
            logger.info(f"  Epoch {epoch:03d} │ Train: {train_loss:.6f} │ Val: {val_loss:.6f}")

        if monitor < best_loss:
            best_loss = monitor
            patience_counter = 0
            torch.save(model.state_dict(), ckpt_path / 'exp_single_lstm_best.pt')
        else:
            patience_counter += 1
            if patience_counter >= config.training.patience:
                logger.info(f"  Early stopping at epoch {epoch}")
                break

    model.load_state_dict(torch.load(ckpt_path / 'exp_single_lstm_best.pt', map_location=device, weights_only=True))
    return model, scale


# ═══════════════════════════════════════════════════════════════
# Evaluation
# ═══════════════════════════════════════════════════════════════

def evaluate_deepar_on_country(model, scaler, country_to_idx, country_populations,
                               country_years, country, device):
    """Evaluate DeepAR on a single country's test period."""
    predictor = DeepARPredictor(model, scaler, country_to_idx, device, num_samples=500)

    pops = country_populations[country]
    years = country_years[country]

    # Conditioning: last window_size years before test
    cond_mask = years < TEST_START
    cond_pops = pops[cond_mask][-10:]
    cond_years = years[cond_mask][-10:]

    # Test actuals
    test_mask = years >= TEST_START
    test_years = years[test_mask]
    test_pops = pops[test_mask]

    if len(test_years) == 0:
        return None

    pred_pops = predictor.predict_point(country, cond_pops, cond_years, int(test_years[-1]))

    # Align lengths
    min_len = min(len(pred_pops), len(test_pops))
    return compute_all_metrics(test_pops[:min_len], pred_pops[:min_len])


def evaluate_deepar_all_countries(model, scaler, country_to_idx, country_populations,
                                  country_years, device):
    """Evaluate DeepAR on ALL countries' test periods. Return average metrics."""
    predictor = DeepARPredictor(model, scaler, country_to_idx, device, num_samples=100)

    all_true, all_pred = [], []

    for country in country_to_idx.keys():
        pops = country_populations[country]
        years = country_years[country]

        cond_mask = years < TEST_START
        cond_pops = pops[cond_mask][-10:]
        cond_years = years[cond_mask][-10:]

        test_mask = years >= TEST_START
        test_years = years[test_mask]
        test_pops = pops[test_mask]

        if len(cond_pops) < 10 or len(test_years) == 0:
            continue

        pred_pops = predictor.predict_point(country, cond_pops, cond_years, int(test_years[-1]))

        min_len = min(len(pred_pops), len(test_pops))
        all_true.extend(test_pops[:min_len].tolist())
        all_pred.extend(pred_pops[:min_len].tolist())

    return compute_all_metrics(np.array(all_true), np.array(all_pred))


def evaluate_single_lstm_on_country(model, country_populations, country_years,
                                    scaler, country, device):
    """Evaluate Single LSTM on test country."""
    pops = country_populations[country]
    years = country_years[country]
    scale = scaler.get_scale(country)

    cond_mask = years < TEST_START
    cond_pops = pops[cond_mask][-10:]
    cond_scaled = cond_pops / scale

    test_mask = years >= TEST_START
    test_pops = pops[test_mask]
    num_steps = len(test_pops)

    if num_steps == 0:
        return None

    pred_pops = model.autoregressive_predict(cond_scaled, num_steps, scale, device)

    return compute_all_metrics(test_pops[:len(pred_pops)], pred_pops[:len(test_pops)])


def evaluate_multi_lstm_all_countries(model, scaler, country_to_idx, country_populations,
                                      country_years, device):
    """Evaluate Multi LSTM on ALL countries' test periods."""
    all_true, all_pred = [], []

    for country, cidx in country_to_idx.items():
        pops = country_populations[country]
        years = country_years[country]
        scale = scaler.get_scale(country)

        cond_mask = years < TEST_START
        cond_years_arr = years[cond_mask][-10:]

        test_mask = years >= TEST_START
        test_years_arr = years[test_mask]
        test_pops = pops[test_mask]

        if len(cond_years_arr) < 10 or len(test_years_arr) == 0:
            continue

        pred_pops = model.autoregressive_predict(
            cidx, cond_years_arr, test_years_arr, scale, device
        )

        min_len = min(len(pred_pops), len(test_pops))
        all_true.extend(test_pops[:min_len].tolist())
        all_pred.extend(pred_pops[:min_len].tolist())

    return compute_all_metrics(np.array(all_true), np.array(all_pred))


def evaluate_multi_lstm_on_country(model, scaler, country_to_idx, country_populations,
                                   country_years, country, device):
    """Evaluate Multi LSTM on a single country."""
    cidx = country_to_idx[country]
    pops = country_populations[country]
    years = country_years[country]
    scale = scaler.get_scale(country)

    cond_mask = years < TEST_START
    cond_years_arr = years[cond_mask][-10:]

    test_mask = years >= TEST_START
    test_years_arr = years[test_mask]
    test_pops = pops[test_mask]

    if len(test_years_arr) == 0:
        return None

    pred_pops = model.autoregressive_predict(
        cidx, cond_years_arr, test_years_arr, scale, device
    )

    min_len = min(len(pred_pops), len(test_pops))
    return compute_all_metrics(test_pops[:min_len], pred_pops[:min_len])


# ═══════════════════════════════════════════════════════════════
# Main Experiment
# ═══════════════════════════════════════════════════════════════

def run_all_experiments():
    """Run complete experiment suite."""
    config = Config.from_yaml('ai_service/config.yaml')
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    logger.info("╔══════════════════════════════════════════════════════════╗")
    logger.info("║       EXPERIMENT: DeepAR vs Baselines                   ║")
    logger.info("╠══════════════════════════════════════════════════════════╣")
    logger.info(f"║  Device:     {device.upper():44s}║")
    logger.info(f"║  Train:      1950 — {TRAIN_END}                               ║")
    logger.info(f"║  Valid:      {TRAIN_END + 1} — {VAL_END}                               ║")
    logger.info(f"║  Test:       {TEST_START} — 2023                               ║")
    logger.info(f"║  Test country: {TEST_COUNTRY:41s}║")
    logger.info("╚══════════════════════════════════════════════════════════╝")

    # ── Prepare data ────────────────────────────────────────────
    preprocessor, df, country_populations, country_years, scaler = prepare_data(config)

    # ── Train all models ────────────────────────────────────────
    t0 = time.time()

    deepar_model = train_deepar(
        config, country_populations, country_years,
        preprocessor.country_to_idx, scaler, preprocessor.num_countries, device,
    )

    multi_lstm_model = train_multi_lstm(
        config, country_populations, country_years,
        preprocessor.country_to_idx, scaler, preprocessor.num_countries, device,
    )

    single_lstm_model, single_scale = train_single_lstm(
        config, country_populations, country_years, scaler, device,
    )

    train_time = time.time() - t0
    logger.info(f"\nTotal training time: {train_time:.1f}s\n")

    # ── Evaluate ────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("EVALUATION")
    logger.info("=" * 60)

    # Experiment 1: DeepAR vs Single LSTM on TEST_COUNTRY
    logger.info(f"\n{'─' * 60}")
    logger.info(f"Experiment 1: DeepAR vs Single LSTM on {TEST_COUNTRY}")
    logger.info(f"{'─' * 60}")

    deepar_single = evaluate_deepar_on_country(
        deepar_model, scaler, preprocessor.country_to_idx,
        country_populations, country_years, TEST_COUNTRY, device,
    )

    single_result = evaluate_single_lstm_on_country(
        single_lstm_model, country_populations, country_years,
        scaler, TEST_COUNTRY, device,
    )

    table1 = []
    for metric in ['RMSE', 'MAE', 'MAPE (%)', 'sMAPE (%)']:
        table1.append([
            metric,
            f"{deepar_single[metric]:,.2f}",
            f"{single_result[metric]:,.2f}" if single_result else "N/A",
        ])

    print("\n" + tabulate(table1, headers=['Metric', f'DeepAR ({TEST_COUNTRY})', f'Single LSTM ({TEST_COUNTRY})'],
                          tablefmt='fancy_grid'))

    # Experiment 2: DeepAR vs Multi LSTM on ALL countries
    logger.info(f"\n{'─' * 60}")
    logger.info("Experiment 2: DeepAR vs Multi LSTM on ALL countries")
    logger.info(f"{'─' * 60}")

    deepar_all = evaluate_deepar_all_countries(
        deepar_model, scaler, preprocessor.country_to_idx,
        country_populations, country_years, device,
    )

    multi_all = evaluate_multi_lstm_all_countries(
        multi_lstm_model, scaler, preprocessor.country_to_idx,
        country_populations, country_years, device,
    )

    table2 = []
    for metric in ['RMSE', 'MAE', 'MAPE (%)', 'sMAPE (%)']:
        table2.append([
            metric,
            f"{deepar_all[metric]:,.2f}",
            f"{multi_all[metric]:,.2f}",
        ])

    print("\n" + tabulate(table2, headers=['Metric', 'DeepAR (All)', 'Multi LSTM (All)'],
                          tablefmt='fancy_grid'))

    # ── Bonus: Multi LSTM on single country too ─────────────────
    multi_single = evaluate_multi_lstm_on_country(
        multi_lstm_model, scaler, preprocessor.country_to_idx,
        country_populations, country_years, TEST_COUNTRY, device,
    )

    logger.info(f"\n{'─' * 60}")
    logger.info(f"Bonus: All 3 models on {TEST_COUNTRY}")
    logger.info(f"{'─' * 60}")

    table3 = []
    for metric in ['RMSE', 'MAE', 'MAPE (%)', 'sMAPE (%)']:
        table3.append([
            metric,
            f"{deepar_single[metric]:,.2f}",
            f"{single_result[metric]:,.2f}" if single_result else "N/A",
            f"{multi_single[metric]:,.2f}" if multi_single else "N/A",
        ])

    print("\n" + tabulate(
        table3,
        headers=['Metric', 'DeepAR', 'Single LSTM', 'Multi LSTM'],
        tablefmt='fancy_grid',
    ))

    logger.info("\nExperiments complete!")


if __name__ == '__main__':
    run_all_experiments()
