"""
PyTorch Dataset for DeepAR training.
Creates sliding window samples from population time series with per-country scaling.
"""

import torch
import numpy as np
from torch.utils.data import Dataset
from typing import Dict, Optional

from ..utils.scaler import MeanScaler


class DeepARDataset(Dataset):
    """
    Sliding window dataset for DeepAR.
    
    Each sample contains:
        - country_idx: integer index for country embedding
        - populations: scaled population values for the window
        - years: raw year values for covariate features
        - scale: per-country scale factor for inverse transform
    """

    def __init__(
        self,
        country_populations: Dict[str, np.ndarray],
        country_years: Dict[str, np.ndarray],
        country_to_idx: Dict[str, int],
        scaler: MeanScaler,
        window_size: int = 10,
        year_min: int = 1950,
        year_max: int = 2023,
        end_year_min: Optional[int] = None,
    ):
        """
        Args:
            country_populations: {country: population_array}
            country_years: {country: year_array}
            country_to_idx: {country: integer_index}
            scaler: fitted MeanScaler
            window_size: sliding window length
            year_min: earliest year to include
            year_max: latest year to include
            end_year_min: if set, only keep windows whose LAST year >= this value
                          (useful for creating validation windows in temporal splits)
        """
        self.samples = []
        self.window_size = window_size

        for country, populations in country_populations.items():
            if country not in country_to_idx:
                continue

            years = country_years[country]

            # Apply year range filter
            mask = (years >= year_min) & (years <= year_max)
            pops = populations[mask]
            yrs = years[mask]

            if len(pops) < window_size:
                continue

            country_idx = country_to_idx[country]
            scaled_pops = scaler.transform(country, pops)
            scale = scaler.get_scale(country)

            # Create sliding windows
            for i in range(len(pops) - window_size + 1):
                window_pop = scaled_pops[i:i + window_size]
                window_years = yrs[i:i + window_size]

                # Optional: filter by last year of window
                if end_year_min is not None and window_years[-1] < end_year_min:
                    continue

                self.samples.append({
                    'country_idx': country_idx,
                    'populations': window_pop.astype(np.float32),
                    'years': window_years.astype(np.float32),
                    'scale': np.float32(scale),
                })

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        sample = self.samples[idx]
        return {
            'country_idx': torch.tensor(sample['country_idx'], dtype=torch.long),
            'populations': torch.tensor(sample['populations'], dtype=torch.float32),
            'years': torch.tensor(sample['years'], dtype=torch.float32),
            'scale': torch.tensor(sample['scale'], dtype=torch.float32),
        }
