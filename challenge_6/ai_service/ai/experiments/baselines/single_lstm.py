"""
Baseline 1: Single Time-Series LSTM.

A traditional LSTM that trains on a SINGLE country's population data.
This serves as a baseline to show that global multi-series models (DeepAR)
outperform country-specific models, especially for countries with limited
or noisy historical data.

Architecture:
    Input:  z_{t-1} (previous population, scaled)
    Model:  LSTM -> Linear
    Output: z_t (point prediction)
    Loss:   MSE

Key limitation: Cannot leverage cross-country patterns.
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, Optional


class SingleLSTM(nn.Module):
    """
    Autoregressive LSTM for single time-series forecasting.
    Input is only the previous population value — no covariates.
    """

    def __init__(
        self,
        hidden_size: int = 64,
        num_layers: int = 2,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=1,
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

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Teacher-forced forward pass.

        Args:
            x: (batch, seq_len) scaled population values

        Returns:
            predictions: (batch, seq_len) predicted values
        """
        batch_size, seq_len = x.shape

        # Autoregressive input: z_{t-1}, with z_0 = 0
        z_input = torch.zeros(batch_size, seq_len, 1, device=x.device)
        z_input[:, 1:, 0] = x[:, :-1]

        lstm_out, _ = self.lstm(z_input)
        return self.output_proj(lstm_out).squeeze(-1)

    def predict_step(
        self,
        z_prev: torch.Tensor,
        hidden: Optional[Tuple[torch.Tensor, ...]] = None,
    ) -> Tuple[torch.Tensor, Tuple[torch.Tensor, ...]]:
        """
        Single-step autoregressive prediction.

        Args:
            z_prev: (batch,) previous value
            hidden: LSTM state

        Returns:
            pred: (batch,) predicted value
            hidden: updated LSTM state
        """
        x = z_prev.unsqueeze(-1).unsqueeze(1)  # (batch, 1, 1)
        lstm_out, hidden = self.lstm(x, hidden)
        pred = self.output_proj(lstm_out.squeeze(1)).squeeze(-1)
        return pred, hidden

    @torch.no_grad()
    def autoregressive_predict(
        self,
        conditioning_values: np.ndarray,
        num_steps: int,
        scale: float,
        device: str = 'cuda',
    ) -> np.ndarray:
        """
        Condition on known data, then autoregressively predict forward.

        Args:
            conditioning_values: scaled population values for conditioning
            num_steps: how many future steps to predict
            scale: inverse-scale factor
            device: compute device

        Returns:
            np.ndarray of predicted (unscaled) population values
        """
        self.eval()

        # Buffer phase
        hidden = None
        z_prev = torch.zeros(1, device=device)

        for val in conditioning_values:
            z_prev_input = z_prev.unsqueeze(-1).unsqueeze(1)
            _, hidden = self.lstm(z_prev_input, hidden)
            z_prev = torch.tensor([val], device=device, dtype=torch.float32)

        # Dream phase
        predictions = []
        for _ in range(num_steps):
            pred, hidden = self.predict_step(z_prev, hidden)
            z_prev = pred
            predictions.append(max(float(pred.cpu().numpy()[0]) * scale, 0))

        return np.array(predictions)
