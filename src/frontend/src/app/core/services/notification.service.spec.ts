import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<MatSnackBarRef<TextOnlySnackBar>>;
  let onActionSubject: Subject<void>;

  beforeEach(() => {
    onActionSubject = new Subject<void>();
    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction']);
    mockSnackBarRef.onAction.and.returnValue(onActionSubject.asObservable());

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue(mockSnackBarRef);

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

  describe('showInfo', () => {
    it('should call MatSnackBar.open with correct parameters and duration 6000', () => {
      service.showInfo('New event added');

      expect(snackBar.open).toHaveBeenCalledWith('New event added', '', jasmine.objectContaining({
        duration: 6000,
        panelClass: ['toast-info'],
      }));
    });

    it('should position at end/bottom', () => {
      service.showInfo('New event added');

      expect(snackBar.open).toHaveBeenCalledWith('New event added', '', jasmine.objectContaining({
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
      }));
    });

    it('should use polite politeness for accessibility', () => {
      service.showInfo('New event added');

      expect(snackBar.open).toHaveBeenCalledWith('New event added', '', jasmine.objectContaining({
        politeness: 'polite',
      }));
    });

    it('should open with actionLabel when provided', () => {
      service.showInfo('Hidden by filters', 'Clear filters');

      expect(snackBar.open).toHaveBeenCalledWith('Hidden by filters', 'Clear filters', jasmine.objectContaining({
        duration: 6000,
        panelClass: ['toast-info'],
      }));
    });

    it('should subscribe to onAction and fire callback when action is triggered', () => {
      const callback = jasmine.createSpy('onAction callback');
      service.showInfo('Hidden by filters', 'Clear filters', callback);

      expect(mockSnackBarRef.onAction).toHaveBeenCalled();

      onActionSubject.next();

      expect(callback).toHaveBeenCalled();
    });

    it('should not subscribe to onAction when no actionLabel is provided', () => {
      service.showInfo('New event added');

      expect(mockSnackBarRef.onAction).not.toHaveBeenCalled();
    });

    it('should not subscribe to onAction when no callback is provided', () => {
      service.showInfo('New event added', 'Some action');

      expect(mockSnackBarRef.onAction).not.toHaveBeenCalled();
    });
  });
});
