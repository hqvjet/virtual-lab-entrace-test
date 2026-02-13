"""
DeepAR Inference Pipeline — Buffer + Dream.

Inference consists of two phases as described in the README:

Phase 1 — Buffer (Conditioning):
    Feed the last `window_size` known years of data through the LSTM
    to build up the hidden state. This "warms up" the model so it
    understands the country's recent trajectory.

Phase 2 — Dream (Autoregressive Sampling):
    From the last known year onward, the model autoregressively generates
    future population values by sampling from the predicted Gaussian
    distribution at each step. Running this with `num_samples` parallel
    trajectories produces a Monte Carlo estimate of the predictive
    distribution, giving us mean, median, and confidence intervals.

    ┌──────── Buffer ────────┐┌──────── Dream ──────────┐
    │ 2014  2015  ...  2023  ││  2024  2025  ...  2030  │
    │  z₁    z₂   ...  z₁₀  ││  ẑ₁₁   ẑ₁₂  ...  ẑ₁₇  │
    │  (known data)          ││  (sampled from Gaussian) │
    └────────────────────────┘└──────────────────────────┘
"""

import torch
import numpy as np
from typing import Dict, List, Optional, Tuple

from ..models.deepar import DeepARModel
from ..utils.scaler import MeanScaler


class DeepARPredictor:
    """
    Probabilistic inference engine for DeepAR model.

    Produces Monte Carlo forecasts with uncertainty quantification.
    """

    def __init__(
        self,
        model: DeepARModel,
        scaler: MeanScaler,
        country_to_idx: Dict[str, int],
        device: str = 'cuda',
        num_samples: int = 200,
    ):
        self.model = model.to(device)
        self.model.eval()
        self.scaler = scaler
        self.country_to_idx = country_to_idx
        self.device = device
        self.num_samples = num_samples

    @torch.no_grad()
    def predict(
        self,
        country: str,
        historical_populations: np.ndarray,
        historical_years: np.ndarray,
        target_year: int,
        num_samples: Optional[int] = None,
    ) -> Dict:
        """
        Generate probabilistic forecast for a country.

        Args:
            country: country name (must exist in training data)
            historical_populations: last window_size years of known population
            historical_years: corresponding year values
            target_year: predict up to this year (inclusive)
            num_samples: override default number of MC samples

        Returns:
            Dict with 'forecasts': list of per-year forecast dicts containing
                year, mean, median, lower (2.5%), upper (97.5%), std
        """
        if country not in self.country_to_idx:
            raise ValueError(f"Unknown country: '{country}'. Not in training data.")

        n_samples = num_samples or self.num_samples
        country_idx = self.country_to_idx[country]
        scale = self.scaler.get_scale(country)

        # Scale historical data
        scaled_hist = historical_populations.astype(np.float64) / scale

        last_known_year = int(historical_years[-1])
        years_to_predict = target_year - last_known_year

        if years_to_predict <= 0:
            return {'forecasts': []}

        # Prepare tensors — expand for parallel MC sampling
        country_tensor = torch.tensor(
            [country_idx] * n_samples, device=self.device, dtype=torch.long
        )
        country_emb = self.model.country_embedding(country_tensor)  # (n_samples, emb_dim)

        # ============================================================
        # Phase 1: BUFFER — Condition on known history
        # ============================================================
        hidden = None
        z_prev = torch.zeros(n_samples, device=self.device)

        for t in range(len(scaled_hist)):
            year_val = float(historical_years[t])
            year_norm = self.model._normalize_year(
                torch.tensor([year_val], device=self.device)
            ).unsqueeze(-1).expand(n_samples, 1)
            year_feature = self.model.year_proj(year_norm)  # (n_samples, 8)

            _, _, hidden = self.model.predict_step(
                z_prev, country_emb, year_feature, hidden
            )

            # Teacher forcing: use actual scaled value
            z_prev = torch.full(
                (n_samples,), scaled_hist[t], device=self.device, dtype=torch.float32
            )

        # ============================================================
        # Phase 2: DREAM — Autoregressively sample future
        # ============================================================
        forecasts = []

        for step in range(years_to_predict):
            future_year = last_known_year + step + 1
            year_norm = self.model._normalize_year(
                torch.tensor([float(future_year)], device=self.device)
            ).unsqueeze(-1).expand(n_samples, 1)
            year_feature = self.model.year_proj(year_norm)

            mu, sigma, hidden = self.model.predict_step(
                z_prev, country_emb, year_feature, hidden
            )

            # Sample from predicted Gaussian
            z_sample = mu + sigma * torch.randn_like(sigma)
            z_prev = z_sample  # Feed sample back (autoregressive)

            # Inverse scale to real population
            pop_samples = (z_sample.cpu().numpy() * scale)

            # Clamp to non-negative (population can't be negative)
            pop_samples = np.maximum(pop_samples, 0)

            forecasts.append({
                'year': future_year,
                'mean': float(np.mean(pop_samples)),
                'median': float(np.median(pop_samples)),
                'lower': float(np.percentile(pop_samples, 2.5)),
                'upper': float(np.percentile(pop_samples, 97.5)),
                'std': float(np.std(pop_samples)),
            })

        return {'forecasts': forecasts}

    @torch.no_grad()
    def predict_point(
        self,
        country: str,
        historical_populations: np.ndarray,
        historical_years: np.ndarray,
        target_year: int,
    ) -> np.ndarray:
        """
        Point forecast using mean of Gaussian (no sampling).
        Useful for deterministic evaluation in experiments.

        Returns:
            np.ndarray of predicted populations for each year from
            last_known_year+1 to target_year
        """
        country_idx = self.country_to_idx[country]
        scale = self.scaler.get_scale(country)
        scaled_hist = historical_populations.astype(np.float64) / scale

        last_known_year = int(historical_years[-1])
        years_to_predict = target_year - last_known_year

        if years_to_predict <= 0:
            return np.array([])

        country_tensor = torch.tensor([country_idx], device=self.device, dtype=torch.long)
        country_emb = self.model.country_embedding(country_tensor)

        # Buffer phase
        hidden = None
        z_prev = torch.zeros(1, device=self.device)

        for t in range(len(scaled_hist)):
            year_val = float(historical_years[t])
            year_norm = self.model._normalize_year(
                torch.tensor([year_val], device=self.device)
            ).unsqueeze(-1)
            year_feature = self.model.year_proj(year_norm)

            _, _, hidden = self.model.predict_step(z_prev, country_emb, year_feature, hidden)
            z_prev = torch.tensor([scaled_hist[t]], device=self.device, dtype=torch.float32)

        # Dream phase — use mu directly (no sampling)
        predictions = []
        for step in range(years_to_predict):
            future_year = last_known_year + step + 1
            year_norm = self.model._normalize_year(
                torch.tensor([float(future_year)], device=self.device)
            ).unsqueeze(-1)
            year_feature = self.model.year_proj(year_norm)

            mu, sigma, hidden = self.model.predict_step(z_prev, country_emb, year_feature, hidden)

            z_prev = mu  # Use mean as next input
            pred_pop = max(float(mu.cpu().numpy()[0]) * scale, 0)
            predictions.append(pred_pop)

        return np.array(predictions)
