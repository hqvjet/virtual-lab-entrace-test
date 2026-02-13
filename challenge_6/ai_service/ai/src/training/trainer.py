"""
Training loop for DeepAR with early stopping and checkpointing.

Features:
    - Mixed-precision training (if GPU available)
    - Gradient clipping for LSTM stability
    - ReduceLROnPlateau scheduler
    - Early stopping with patience
    - Best model checkpointing
    - Training history tracking
"""

import time
import logging
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
from pathlib import Path
from typing import Optional, Dict, List

from ..models.deepar import DeepARModel
from .losses import gaussian_nll_loss

logger = logging.getLogger(__name__)


class Trainer:
    """
    Training orchestrator for DeepAR model.

    Handles the complete training lifecycle including optimization,
    validation, early stopping, and model persistence.
    """

    def __init__(
        self,
        model: DeepARModel,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        lr: float = 1e-3,
        weight_decay: float = 1e-5,
        grad_clip: float = 10.0,
        patience: int = 20,
        checkpoint_dir: str = 'ai_service/ai/checkpoints',
        device: str = 'cuda',
    ):
        self.model = model.to(device)
        self.device = device
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.grad_clip = grad_clip
        self.patience = patience
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        self.optimizer = Adam(
            model.parameters(),
            lr=lr,
            weight_decay=weight_decay,
        )
        self.scheduler = ReduceLROnPlateau(
            self.optimizer,
            mode='min',
            factor=0.5,
            patience=10,
            min_lr=1e-6,
        )

        # Use AMP for GPU training
        self.use_amp = device == 'cuda'
        self.scaler = torch.amp.GradScaler('cuda') if self.use_amp else None

        self.best_loss = float('inf')
        self.patience_counter = 0
        self.history: Dict[str, List[float]] = {'train_loss': [], 'val_loss': [], 'lr': []}

    def train_epoch(self) -> float:
        """Run one training epoch."""
        self.model.train()
        total_loss = 0.0
        num_batches = 0

        for batch in self.train_loader:
            country_idx = batch['country_idx'].to(self.device)
            populations = batch['populations'].to(self.device)
            years = batch['years'].to(self.device)

            self.optimizer.zero_grad()

            if self.use_amp:
                with torch.amp.autocast('cuda'):
                    mu, sigma = self.model(country_idx, populations, years)
                    loss = gaussian_nll_loss(populations, mu, sigma)

                self.scaler.scale(loss).backward()
                self.scaler.unscale_(self.optimizer)
                nn.utils.clip_grad_norm_(self.model.parameters(), self.grad_clip)
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                mu, sigma = self.model(country_idx, populations, years)
                loss = gaussian_nll_loss(populations, mu, sigma)
                loss.backward()
                nn.utils.clip_grad_norm_(self.model.parameters(), self.grad_clip)
                self.optimizer.step()

            total_loss += loss.item()
            num_batches += 1

        return total_loss / max(num_batches, 1)

    @torch.no_grad()
    def validate(self) -> float:
        """Run validation pass."""
        if self.val_loader is None:
            return float('inf')

        self.model.eval()
        total_loss = 0.0
        num_batches = 0

        for batch in self.val_loader:
            country_idx = batch['country_idx'].to(self.device)
            populations = batch['populations'].to(self.device)
            years = batch['years'].to(self.device)

            mu, sigma = self.model(country_idx, populations, years)
            loss = gaussian_nll_loss(populations, mu, sigma)

            total_loss += loss.item()
            num_batches += 1

        return total_loss / max(num_batches, 1)

    def fit(self, epochs: int, prefix: str = 'deepar') -> Dict[str, List[float]]:
        """
        Full training loop with early stopping.

        Args:
            epochs: maximum number of epochs
            prefix: filename prefix for saved checkpoints

        Returns:
            Training history dict with loss curves
        """
        logger.info(f"{'='*60}")
        logger.info(f"Training DeepAR on {self.device.upper()}")
        logger.info(f"  Train batches: {len(self.train_loader)}")
        logger.info(f"  Val batches:   {len(self.val_loader) if self.val_loader else 0}")
        logger.info(f"  Max epochs:    {epochs}")
        logger.info(f"  Patience:      {self.patience}")
        logger.info(f"{'='*60}")

        for epoch in range(1, epochs + 1):
            t0 = time.time()

            train_loss = self.train_epoch()
            val_loss = self.validate()

            lr = self.optimizer.param_groups[0]['lr']
            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_loss)
            self.history['lr'].append(lr)

            # Step scheduler
            monitor = val_loss if self.val_loader else train_loss
            self.scheduler.step(monitor)

            elapsed = time.time() - t0

            logger.info(
                f"Epoch {epoch:03d}/{epochs} │ "
                f"Train: {train_loss:.6f} │ "
                f"Val: {val_loss:.6f} │ "
                f"LR: {lr:.2e} │ "
                f"{elapsed:.1f}s"
            )

            # Early stopping + checkpointing
            if monitor < self.best_loss:
                self.best_loss = monitor
                self.patience_counter = 0
                self.save_checkpoint(f'{prefix}_best.pt')
                logger.info(f"  ✓ New best model! Loss: {monitor:.6f}")
            else:
                self.patience_counter += 1
                if self.patience_counter >= self.patience:
                    logger.info(f"  ✗ Early stopping at epoch {epoch} (patience={self.patience})")
                    break

        logger.info(f"Training complete. Best loss: {self.best_loss:.6f}")
        return self.history

    def save_checkpoint(self, filename: str) -> None:
        """Save model + optimizer state."""
        path = self.checkpoint_dir / filename
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'best_loss': self.best_loss,
        }, path)

    def load_checkpoint(self, filename: str) -> None:
        """Load model from checkpoint."""
        path = self.checkpoint_dir / filename
        checkpoint = torch.load(path, map_location=self.device, weights_only=True)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        logger.info(f"Loaded checkpoint: {path}")
