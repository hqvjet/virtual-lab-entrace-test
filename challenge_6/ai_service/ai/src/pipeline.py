"""
End-to-end training pipeline for DeepAR production model.

Trains on 100% of available data (1950-2023) with a random 90/10 split
for internal validation / early stopping. Saves the best model checkpoint
and all artifacts needed for inference (scaler, country mapping, config).

Usage:
    cd challenge_6
    python -m ai_service.ai.src.pipeline
"""

import torch
import pickle
import logging
from pathlib import Path
from torch.utils.data import DataLoader, random_split

from .config import Config
from .data.preprocessor import DataPreprocessor
from .data.dataset import DeepARDataset
from .models.deepar import DeepARModel
from .training.trainer import Trainer
from .utils.scaler import MeanScaler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s │ %(levelname)-7s │ %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

CHECKPOINT_DIR = 'ai_service/ai/checkpoints'


def train_pipeline(config_path: str = 'ai_service/config.yaml'):
    """Train DeepAR on full dataset and save production model."""

    config = Config.from_yaml(config_path)
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    logger.info(f"Device: {device}")
    if device == 'cuda':
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
        logger.info(f"GPU: {gpu_name} ({gpu_mem:.1f} GB)")

    # ── Step 1: Load & preprocess data ──────────────────────────
    preprocessor = DataPreprocessor(config.data.csv_path, config.data.non_countries)
    df = preprocessor.load_and_clean()
    preprocessor.build_country_mapping(df)

    logger.info(f"Dataset: {len(df):,} records, {preprocessor.num_countries} countries")
    logger.info(f"Year range: {df['year'].min()} — {df['year'].max()}")

    # ── Step 2: Compute per-country scaling ─────────────────────
    country_populations, country_years = preprocessor.get_arrays(df)
    scaler = MeanScaler().fit(country_populations)

    # ── Step 3: Create sliding window dataset (100% data) ───────
    full_dataset = DeepARDataset(
        country_populations=country_populations,
        country_years=country_years,
        country_to_idx=preprocessor.country_to_idx,
        scaler=scaler,
        window_size=config.data.window_size,
    )

    # 90/10 random split for early stopping
    val_size = max(int(0.1 * len(full_dataset)), 1)
    train_size = len(full_dataset) - val_size
    train_dataset, val_dataset = random_split(
        full_dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42),
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=config.training.batch_size,
        shuffle=True,
        num_workers=2,
        pin_memory=(device == 'cuda'),
        drop_last=False,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=config.training.batch_size,
        shuffle=False,
        num_workers=2,
        pin_memory=(device == 'cuda'),
    )

    logger.info(f"Samples: {train_size:,} train, {val_size:,} val "
                f"(window={config.data.window_size})")

    # ── Step 4: Build model ─────────────────────────────────────
    model = DeepARModel(
        num_countries=preprocessor.num_countries,
        embedding_dim=config.model.embedding_dim,
        hidden_size=config.model.hidden_size,
        num_layers=config.model.num_layers,
        dropout=config.model.dropout,
    )

    total_params = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info(f"Model parameters: {total_params:,} total, {trainable:,} trainable")

    # ── Step 5: Train ───────────────────────────────────────────
    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        lr=config.training.learning_rate,
        weight_decay=config.training.weight_decay,
        grad_clip=config.training.grad_clip,
        patience=config.training.patience,
        checkpoint_dir=CHECKPOINT_DIR,
        device=device,
    )

    history = trainer.fit(config.training.epochs, prefix='deepar')

    # ── Step 6: Save all artifacts ──────────────────────────────
    checkpoint_dir = Path(CHECKPOINT_DIR)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    artifacts = {
        'country_to_idx': preprocessor.country_to_idx,
        'idx_to_country': preprocessor.idx_to_country,
        'scaler_state': scaler.state_dict(),
        'num_countries': preprocessor.num_countries,
        'config': config.to_dict(),
        'history': history,
    }

    artifacts_path = checkpoint_dir / 'artifacts.pkl'
    with open(artifacts_path, 'wb') as f:
        pickle.dump(artifacts, f)

    logger.info(f"Artifacts saved to {artifacts_path}")
    logger.info("Pipeline complete!")

    return model, scaler, preprocessor


if __name__ == '__main__':
    train_pipeline()
