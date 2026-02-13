"""
Baseline 2: Multiple Time-Series LSTM (Naive).

A multi-country LSTM where the input consists of ONLY covariates
(country embedding + year features) — NO autoregressive z_{t-1} input.
Output is the population value directly via MSE regression.

This baseline tests whether the autoregressive + probabilistic design
of DeepAR provides meaningful improvement over a simpler approach.

Architecture:
    Input:  [Embed(country), YearProj(year)]  ← no z_{t-1} !
    Model:  LSTM -> Linear
    Output: population (point prediction)
    Loss:   MSE

Key limitation: Without z_{t-1}, the model cannot capture the
autoregressive dynamics of population growth trajectories.
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, Optional


class MultiLSTM(nn.Module):
    """
    Naive multi-country LSTM baseline.
    Input = [country_embedding, year_features], output = population.
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
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.country_embedding = nn.Embedding(num_countries, embedding_dim)
        self.year_proj = nn.Sequential(
            nn.Linear(1, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
        )

        # Input: country_emb + year_features (NO z_{t-1})
        self.lstm = nn.LSTM(
            input_size=embedding_dim + 8,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0.0,
            batch_first=True,
        )
        self.output_proj = nn.Linear(hidden_size, 1)

        self._init_weights()

    def _init_weights(self):
        for name, param in self.lstm.named_parameters():
            if 'weight_ih' in name:
                nn.init.xavier_uniform_(param)
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param)
            elif 'bias' in name:
                nn.init.zeros_(param)
        nn.init.normal_(self.country_embedding.weight, mean=0, std=0.01)

    def _normalize_year(self, years: torch.Tensor) -> torch.Tensor:
        return (years - 1950.0) / 73.0

    def forward(
        self,
        country_idx: torch.Tensor,  # (batch,)
        years: torch.Tensor,        # (batch, seq_len)
        populations: torch.Tensor,   # (batch, seq_len) — NOT used as input, just for API compat
    ) -> torch.Tensor:
        """
        Forward pass.

        Returns:
            predictions: (batch, seq_len) predicted population values
        """
        batch_size, seq_len = years.shape

        country_emb = self.country_embedding(country_idx)
        country_emb = country_emb.unsqueeze(1).expand(-1, seq_len, -1)

        year_norm = self._normalize_year(years).unsqueeze(-1)
        year_features = self.year_proj(year_norm)

        lstm_input = torch.cat([country_emb, year_features], dim=-1)
        lstm_out, _ = self.lstm(lstm_input)

        return self.output_proj(lstm_out).squeeze(-1)

    @torch.no_grad()
    def autoregressive_predict(
        self,
        country_idx: int,
        conditioning_years: np.ndarray,
        future_years: np.ndarray,
        scale: float,
        device: str = 'cuda',
    ) -> np.ndarray:
        """
        Condition on known years, then predict future years.

        Since this model has no z_{t-1}, it processes conditioning years
        to build LSTM hidden state, then continues with future years.
        """
        self.eval()

        country_tensor = torch.tensor([country_idx], device=device, dtype=torch.long)
        country_emb = self.country_embedding(country_tensor)  # (1, emb_dim)

        # Conditioning phase — build hidden state
        hidden = None
        for year in conditioning_years:
            year_norm = self._normalize_year(
                torch.tensor([year], device=device, dtype=torch.float32)
            ).unsqueeze(-1)
            year_feature = self.year_proj(year_norm)
            lstm_input = torch.cat([country_emb, year_feature], dim=-1).unsqueeze(1)
            _, hidden = self.lstm(lstm_input, hidden)

        # Prediction phase
        predictions = []
        for year in future_years:
            year_norm = self._normalize_year(
                torch.tensor([year], device=device, dtype=torch.float32)
            ).unsqueeze(-1)
            year_feature = self.year_proj(year_norm)
            lstm_input = torch.cat([country_emb, year_feature], dim=-1).unsqueeze(1)
            lstm_out, hidden = self.lstm(lstm_input, hidden)
            pred = self.output_proj(lstm_out.squeeze(1)).squeeze(-1)
            predictions.append(max(float(pred.cpu().numpy()[0]) * scale, 0))

        return np.array(predictions)
