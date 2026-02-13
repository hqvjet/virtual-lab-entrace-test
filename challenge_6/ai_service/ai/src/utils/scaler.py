"""
Mean Absolute Scaler for DeepAR.

Per-series mean scaling normalizes each country's population values
by their mean absolute value, enabling the model to learn across
series with vastly different magnitudes (e.g., China vs. Tuvalu).

Reference: Section 3.3 of DeepAR paper (Salinas et al., 2020)
"""

import numpy as np
from typing import Dict
import json


class MeanScaler:
    """Per-country mean absolute scaling."""

    def __init__(self):
        self.scales: Dict[str, float] = {}

    def fit(self, country_populations: Dict[str, np.ndarray]) -> 'MeanScaler':
        """
        Compute scale factor for each country.
        scale_i = mean(|population_i|), clamped to >= 1.0 to avoid div-by-zero.
        """
        for country, values in country_populations.items():
            mean_abs = float(np.mean(np.abs(values)))
            self.scales[country] = max(mean_abs, 1.0)
        return self

    def transform(self, country: str, values: np.ndarray) -> np.ndarray:
        """Scale population values by the country's scale factor."""
        return values / self.scales[country]

    def inverse_transform(self, country: str, values: np.ndarray) -> np.ndarray:
        """Reverse scaling to get back original population magnitudes."""
        return values * self.scales[country]

    def get_scale(self, country: str) -> float:
        """Get the scale factor for a country."""
        return self.scales.get(country, 1.0)

    def state_dict(self) -> Dict[str, float]:
        return dict(self.scales)

    def load_state_dict(self, state: Dict[str, float]) -> None:
        self.scales = dict(state)
