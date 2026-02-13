"""
Loss functions for DeepAR training.

The core loss is Negative Log-Likelihood (NLL) under a Gaussian distribution:
    NLL = -log N(z | mu, sigma^2)
        = 0.5 * [log(2*pi) + 2*log(sigma) + ((z - mu) / sigma)^2]

This loss simultaneously:
    1. Pushes mu towards the true value z (accuracy)
    2. Calibrates sigma to reflect actual uncertainty (confidence)
    
The NLL maximizes the probability density function (PDF) at the observed
value z, which is fundamentally different from MSE — it learns the full
predictive distribution, not just the point estimate.
"""

import math
import torch


def gaussian_nll_loss(
    z: torch.Tensor,
    mu: torch.Tensor,
    sigma: torch.Tensor,
) -> torch.Tensor:
    """
    Gaussian Negative Log-Likelihood loss.

    Args:
        z: (batch, seq_len) true (scaled) population values
        mu: (batch, seq_len) predicted means
        sigma: (batch, seq_len) predicted standard deviations

    Returns:
        Scalar mean NLL loss over all timesteps and batch elements.
    """
    nll = 0.5 * (
        math.log(2 * math.pi)
        + 2 * torch.log(sigma)
        + ((z - mu) / sigma) ** 2
    )
    return nll.mean()
