"""
DeepAR: Probabilistic Forecasting with Autoregressive Recurrent Networks.

Implementation based on: "DeepAR: Probabilistic Forecasting with Autoregressive
Recurrent Neural Networks" (Salinas et al., 2020, Amazon Research)

Architecture overview:
    ┌─────────────┐   ┌──────────┐   ┌──────────┐
    │ z_{t-1}     │   │ Embed(c) │   │ YearProj │
    │ (prev pop)  │   │ (country)│   │ (year)   │
    └──────┬──────┘   └────┬─────┘   └────┬─────┘
           │               │              │
           └───────┬───────┴──────┬───────┘
                   │              │
                   ▼              │
              ┌─────────┐        │
              │  CONCAT  │◄──────┘
              └────┬────┘
                   │
                   ▼
              ┌─────────┐
              │  LSTM    │ ──► h_t
              └────┬────┘
                   │
                   ▼
           ┌──────────────┐
           │  GaussianHead │ ──► (mu_t, sigma_t)
           └──────────────┘

Training: Teacher forcing with true z_{t-1}
Inference: Autoregressive sampling z ~ N(mu, sigma^2)
"""

import torch
import torch.nn as nn
from typing import Tuple, Optional

from .gaussian import GaussianLikelihood


class DeepARModel(nn.Module):
    """
    DeepAR model for multiple time-series population forecasting.

    Key features vs standard LSTM:
        1. Autoregressive: feeds z_{t-1} as input (captures trajectory momentum)
        2. Country embedding: learns latent representations for each country
        3. Gaussian output: probabilistic forecasts with uncertainty
        4. Shared parameters: single model learns patterns across ALL countries
    """

    def __init__(
        self,
        num_countries: int,
        embedding_dim: int = 32,
        hidden_size: int = 64,
        num_layers: int = 2,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.num_countries = num_countries
        self.embedding_dim = embedding_dim
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        # --- Country Embedding ---
        # Learnable dense representation for each country.
        # Allows the model to discover similarities between countries
        # (e.g., similar growth patterns, demographic transitions).
        self.country_embedding = nn.Embedding(num_countries, embedding_dim)

        # --- Year Covariate Projection ---
        # Projects normalized year scalar into a richer feature space.
        self.year_proj = nn.Sequential(
            nn.Linear(1, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
        )

        # --- LSTM Backbone ---
        # Input: [z_{t-1}, country_embedding, year_features]
        input_size = 1 + embedding_dim + 8
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0.0,
            batch_first=True,
        )

        # --- Gaussian Likelihood Head ---
        self.likelihood = GaussianLikelihood(hidden_size)

        self._init_weights()

    def _init_weights(self):
        """Initialize weights for stable training."""
        # Xavier for input-hidden, orthogonal for hidden-hidden
        for name, param in self.lstm.named_parameters():
            if 'weight_ih' in name:
                nn.init.xavier_uniform_(param)
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param)
            elif 'bias' in name:
                nn.init.zeros_(param)

        # Small init for embedding
        nn.init.normal_(self.country_embedding.weight, mean=0, std=0.01)

    def _normalize_year(self, years: torch.Tensor) -> torch.Tensor:
        """Normalize year to approximately [0, 1] range."""
        return (years - 1950.0) / 73.0  # 2023 - 1950 = 73

    def forward(
        self,
        country_idx: torch.Tensor,   # (batch,)
        populations: torch.Tensor,    # (batch, seq_len) — scaled values
        years: torch.Tensor,          # (batch, seq_len) — raw years
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass with teacher forcing.

        At each timestep t, the model receives:
            - z_{t-1}: previous (scaled) population (0 for t=0)
            - embed(country): country embedding vector
            - proj(year_t): year covariate features

        Returns:
            mu: (batch, seq_len) predicted mean at each step
            sigma: (batch, seq_len) predicted std at each step
        """
        batch_size, seq_len = populations.shape
        device = populations.device

        # Country embedding: (batch,) -> (batch, emb_dim) -> (batch, seq_len, emb_dim)
        country_emb = self.country_embedding(country_idx)
        country_emb = country_emb.unsqueeze(1).expand(-1, seq_len, -1)

        # Year features: (batch, seq_len) -> (batch, seq_len, 8)
        year_norm = self._normalize_year(years).unsqueeze(-1)
        year_features = self.year_proj(year_norm)

        # z_{t-1}: autoregressive input (teacher forcing)
        # Shift right - first step gets 0 (no previous observation)
        z_prev = torch.zeros(batch_size, seq_len, 1, device=device)
        z_prev[:, 1:, 0] = populations[:, :-1]

        # Concatenate all inputs: [z_{t-1}, embed(country), year_features]
        lstm_input = torch.cat([z_prev, country_emb, year_features], dim=-1)

        # LSTM forward
        lstm_out, _ = self.lstm(lstm_input)

        # Gaussian parameters
        mu, sigma = self.likelihood(lstm_out)

        return mu, sigma

    def predict_step(
        self,
        z_prev: torch.Tensor,                               # (batch,)
        country_emb: torch.Tensor,                           # (batch, emb_dim)
        year_feature: torch.Tensor,                          # (batch, 8)
        hidden: Optional[Tuple[torch.Tensor, ...]] = None,   # LSTM state
    ) -> Tuple[torch.Tensor, torch.Tensor, Tuple[torch.Tensor, ...]]:
        """
        Single-step prediction for autoregressive inference.

        Used during the "dream" phase where the model feeds its own
        samples back as input to generate future forecasts.

        Returns:
            mu: (batch,) predicted mean
            sigma: (batch,) predicted std
            hidden: updated LSTM hidden state
        """
        # Build input: (batch, 1, input_size)
        lstm_input = torch.cat([
            z_prev.unsqueeze(-1),   # (batch, 1)
            country_emb,            # (batch, emb_dim)
            year_feature,           # (batch, 8)
        ], dim=-1).unsqueeze(1)     # (batch, 1, input_size)

        lstm_out, hidden = self.lstm(lstm_input, hidden)

        # Squeeze seq_len dim: (batch, 1, hidden) -> (batch, hidden)
        mu, sigma = self.likelihood(lstm_out.squeeze(1))

        return mu, sigma, hidden
