"""
Data preprocessing pipeline for population time series.
Handles CSV loading, cleaning, country mapping, and per-country series extraction.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple


class DataPreprocessor:
    """Load, clean, and organize population time-series data."""

    def __init__(self, csv_path: str, non_countries: List[str]):
        self.csv_path = csv_path
        self.non_countries = set(non_countries)
        self.country_to_idx: Dict[str, int] = {}
        self.idx_to_country: Dict[int, str] = {}

    def load_and_clean(self) -> pd.DataFrame:
        """
        Load CSV and filter out non-country entities.
        Returns a clean DataFrame with columns: [country, year, population].
        """
        df = pd.read_csv(self.csv_path)

        # Standardize column names
        df.columns = ['country', 'year', 'population', 'percentage']
        df = df[['country', 'year', 'population']].copy()

        # Filter out aggregate regions (non-country entities)
        df = df[~df['country'].isin(self.non_countries)]
        df = df.dropna(subset=['country', 'year', 'population'])

        # Type enforcement
        df['year'] = df['year'].astype(int)
        df['population'] = df['population'].astype(np.int64)

        # Sort for consistent ordering
        df = df.sort_values(['country', 'year']).reset_index(drop=True)

        return df

    def build_country_mapping(self, df: pd.DataFrame) -> None:
        """Create bidirectional country <-> index mappings."""
        countries = sorted(df['country'].unique())
        self.country_to_idx = {c: i for i, c in enumerate(countries)}
        self.idx_to_country = {i: c for c, i in self.country_to_idx.items()}

    @property
    def num_countries(self) -> int:
        return len(self.country_to_idx)

    def get_country_series(self, df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """Group data by country, sorted by year."""
        return {
            name: group.sort_values('year').reset_index(drop=True)
            for name, group in df.groupby('country')
        }

    def get_arrays(self, df: pd.DataFrame) -> Tuple[Dict[str, np.ndarray], Dict[str, np.ndarray]]:
        """
        Extract per-country population and year arrays.
        Returns:
            country_populations: {country_name: np.array of population values}
            country_years: {country_name: np.array of year values}
        """
        country_populations = {}
        country_years = {}

        for country, group in df.groupby('country'):
            sorted_group = group.sort_values('year')
            country_populations[country] = sorted_group['population'].values.astype(np.float64)
            country_years[country] = sorted_group['year'].values.astype(np.float64)

        return country_populations, country_years
