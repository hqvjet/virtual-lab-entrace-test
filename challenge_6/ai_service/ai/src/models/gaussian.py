"""
Gaussian Likelihood Head for DeepAR.

Maps LSTM hidden states to the parameters of a Gaussian distribution (mu, sigma).
The model learns to output probabilistic forecasts instead of point estimates,
enabling uncertainty quantification through the predicted variance.

Key design:
  - mu: unbounded linear projection
  - sigma: linear projection + softplus activation (ensures sigma > 0)
  - Supports log_prob computation for NLL training
  - Supports reparameterized sampling for autoregressive inference
"""

import math
import torch
import torch.nn as nn
from typing import Tuple


class GaussianLikelihood(nn.Module):
    """
    Gaussian likelihood head: h_t -> (mu_t, sigma_t)

    The predicted distribution N(mu_t, sigma_t^2) represents the model's
    belief about the population value at time t.
    """

    def __init__(self, hidden_size: int):
        super().__init__()
        self.mu_layer = nn.Linear(hidden_size, 1)
        self.sigma_layer = nn.Linear(hidden_size, 1)

    def forward(self, hidden: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Compute Gaussian parameters from hidden state.

        Args:
            hidden: (..., hidden_size) LSTM output

        Returns:
            mu: (...) predicted mean
            sigma: (...) predicted std (always positive)
        """
        mu = self.mu_layer(hidden).squeeze(-1)
        # Softplus ensures sigma > 0; add epsilon for numerical stability
        sigma = nn.functional.softplus(self.sigma_layer(hidden).squeeze(-1)) + 1e-6
        return mu, sigma

    @staticmethod
    def log_prob(z: torch.Tensor, mu: torch.Tensor, sigma: torch.Tensor) -> torch.Tensor:
        """
        Log probability of observation z under N(mu, sigma^2).

        log N(z | mu, sigma^2) = -0.5 * (log(2*pi) + 2*log(sigma) + ((z - mu) / sigma)^2)
        """
        return -0.5 * (
            math.log(2 * math.pi)
            + 2 * torch.log(sigma)
            + ((z - mu) / sigma) ** 2
        )

    @staticmethod
    def sample(mu: torch.Tensor, sigma: torch.Tensor) -> torch.Tensor:
        """
        Reparameterized sample from N(mu, sigma^2).
        z = mu + sigma * epsilon, where epsilon ~ N(0, 1)
        """
        return mu + sigma * torch.randn_like(mu)
