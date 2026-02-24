import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  showSuccess(message: string): void {
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['toast-success'],
      politeness: 'polite',
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['toast-error'],
    });
  }

  showInfo(message: string, actionLabel?: string, onAction?: () => void): void {
    const ref = this.snackBar.open(message, actionLabel ?? '', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['toast-info'],
      politeness: 'polite',
    });

    if (onAction && actionLabel) {
      ref.onAction().subscribe(() => onAction());
    }
  }
}
