"""
Configuration management for DeepAR Population Forecasting.
Loads hyperparameters from YAML and exposes them as typed dataclasses.
"""

import yaml
from dataclasses import dataclass, field
from typing import List
from pathlib import Path


@dataclass
class DataConfig:
    csv_path: str
    window_size: int
    non_countries: List[str] = field(default_factory=list)


@dataclass
class ModelConfig:
    embedding_dim: int = 32
    hidden_size: int = 64
    num_layers: int = 2
    dropout: float = 0.1


@dataclass
class TrainingConfig:
    epochs: int = 150
    batch_size: int = 128
    learning_rate: float = 1e-3
    weight_decay: float = 1e-5
    patience: int = 20
    grad_clip: float = 10.0


@dataclass
class InferenceConfig:
    num_samples: int = 200


@dataclass
class ServerConfig:
    host: str = "0.0.0.0"
    port: int = 8000


@dataclass
class Config:
    data: DataConfig
    model: ModelConfig
    training: TrainingConfig
    inference: InferenceConfig
    server: ServerConfig

    @classmethod
    def from_yaml(cls, path: str) -> 'Config':
        """Load configuration from a YAML file."""
        with open(path, 'r') as f:
            raw = yaml.safe_load(f)

        return cls(
            data=DataConfig(**raw.get('data', {})),
            model=ModelConfig(**raw.get('model', {})),
            training=TrainingConfig(**raw.get('training', {})),
            inference=InferenceConfig(**raw.get('inference', {})),
            server=ServerConfig(**raw.get('server', {})),
        )

    def to_dict(self) -> dict:
        """Serialize config to dictionary."""
        from dataclasses import asdict
        return asdict(self)
