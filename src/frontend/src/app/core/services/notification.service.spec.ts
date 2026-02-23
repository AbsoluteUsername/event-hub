import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    service = TestBed.inject(NotificationService);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  describe('showSuccess', () => {
    it('should call MatSnackBar.open with correct message and duration 3000', () => {
      service.showSuccess('Event submitted successfully');

      expect(snackBar.open).toHaveBeenCalledWith('Event submitted successfully', '', jasmine.objectContaining({
        duration: 3000,
        panelClass: ['toast-success'],
      }));
    });

    it('should use panelClass toast-success', () => {
      service.showSuccess('Test message');

      expect(snackBar.open).toHaveBeenCalledWith('Test message', '', jasmine.objectContaining({
        panelClass: ['toast-success'],
      }));
    });

    it('should position at end/bottom', () => {
      service.showSuccess('Test message');

      expect(snackBar.open).toHaveBeenCalledWith('Test message', '', jasmine.objectContaining({
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
      }));
    });

    it('should use polite politeness for accessibility', () => {
      service.showSuccess('Test message');

      expect(snackBar.open).toHaveBeenCalledWith('Test message', '', jasmine.objectContaining({
        politeness: 'polite',
      }));
    });
  });

  describe('showError', () => {
    it('should call MatSnackBar.open with correct message, action Dismiss, and duration 5000', () => {
      service.showError('Failed to submit event. Please try again.');

      expect(snackBar.open).toHaveBeenCalledWith('Failed to submit event. Please try again.', 'Dismiss', jasmine.objectContaining({
        duration: 5000,
        panelClass: ['toast-error'],
      }));
    });

    it('should use panelClass toast-error', () => {
      service.showError('Error message');

      expect(snackBar.open).toHaveBeenCalledWith('Error message', 'Dismiss', jasmine.objectContaining({
        panelClass: ['toast-error'],
      }));
    });

    it('should position at end/bottom', () => {
      service.showError('Error message');

      expect(snackBar.open).toHaveBeenCalledWith('Error message', 'Dismiss', jasmine.objectContaining({
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
      }));
    });
  });
});
