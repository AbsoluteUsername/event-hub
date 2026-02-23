import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';
import { SubmissionEffects } from './submission.effects';
import { EventService } from '../../core/services/event.service';
import { NotificationService } from '../../core/services/notification.service';
import { submitEvent, submitEventSuccess, submitEventFailure } from './submission.actions';
import { CreateEventRequest, EventResponse, EventType } from '../../shared/models/event.model';

describe('SubmissionEffects', () => {
  let effects: SubmissionEffects;
  let actions$: ReplaySubject<Action>;
  let eventService: jasmine.SpyObj<EventService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockRequest: CreateEventRequest = {
    userId: 'olena',
    type: EventType.PageView,
    description: 'Viewed homepage',
  };

  const mockResponse: EventResponse = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'olena',
    type: EventType.PageView,
    description: 'Viewed homepage',
    createdAt: '2026-02-23T14:30:00Z',
  };

  beforeEach(() => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['create']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    TestBed.configureTestingModule({
      providers: [
        SubmissionEffects,
        provideMockActions(() => actions$),
        { provide: EventService, useValue: eventServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });

    effects = TestBed.inject(SubmissionEffects);
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    actions$ = new ReplaySubject<Action>(1);
  });

  describe('submitEvent$', () => {
    it('should dispatch submitEventSuccess on successful API call', (done) => {
      eventService.create.and.returnValue(of(mockResponse));
      actions$.next(submitEvent({ request: mockRequest }));

      effects.submitEvent$.subscribe((action) => {
        expect(action).toEqual(submitEventSuccess({ event: mockResponse }));
        expect(eventService.create).toHaveBeenCalledWith(mockRequest);
        done();
      });
    });

    it('should dispatch submitEventFailure with field errors on 400 response', (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 400,
        error: {
          errors: {
            userId: 'The UserId field is required.',
            type: 'The field Type is invalid.',
          },
        },
      });
      eventService.create.and.returnValue(throwError(() => errorResponse));
      actions$.next(submitEvent({ request: mockRequest }));

      effects.submitEvent$.subscribe((action) => {
        expect(action).toEqual(
          submitEventFailure({ error: 'userId: The UserId field is required.; type: The field Type is invalid.' })
        );
        done();
      });
    });

    it('should dispatch submitEventFailure with generic message on 500 response', (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: { message: 'Internal Server Error' },
      });
      eventService.create.and.returnValue(throwError(() => errorResponse));
      actions$.next(submitEvent({ request: mockRequest }));

      effects.submitEvent$.subscribe((action) => {
        expect(action).toEqual(
          submitEventFailure({ error: 'An unexpected error occurred. Please try again.' })
        );
        done();
      });
    });

    it('should dispatch submitEventFailure with connection error on network failure', (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 0,
        error: new ProgressEvent('error'),
      });
      eventService.create.and.returnValue(throwError(() => errorResponse));
      actions$.next(submitEvent({ request: mockRequest }));

      effects.submitEvent$.subscribe((action) => {
        expect(action).toEqual(
          submitEventFailure({ error: 'Connection error. Check your network.' })
        );
        done();
      });
    });
  });

  describe('submitSuccess$', () => {
    it('should call notificationService.showSuccess on submitEventSuccess', (done) => {
      actions$.next(submitEventSuccess({ event: mockResponse }));

      effects.submitSuccess$.subscribe(() => {
        expect(notificationService.showSuccess).toHaveBeenCalledWith('Event submitted successfully');
        done();
      });
    });
  });

  describe('submitFailure$', () => {
    it('should call notificationService.showError on submitEventFailure', (done) => {
      actions$.next(submitEventFailure({ error: 'An unexpected error occurred. Please try again.' }));

      effects.submitFailure$.subscribe(() => {
        expect(notificationService.showError).toHaveBeenCalledWith('An unexpected error occurred. Please try again.');
        done();
      });
    });

    it('should pass field error messages to showError on 400 errors', (done) => {
      const fieldErrors = 'userId: The UserId field is required.; type: The field Type is invalid.';
      actions$.next(submitEventFailure({ error: fieldErrors }));

      effects.submitFailure$.subscribe(() => {
        expect(notificationService.showError).toHaveBeenCalledWith(fieldErrors);
        done();
      });
    });

    it('should pass network error message to showError', (done) => {
      actions$.next(submitEventFailure({ error: 'Connection error. Check your network.' }));

      effects.submitFailure$.subscribe(() => {
        expect(notificationService.showError).toHaveBeenCalledWith('Connection error. Check your network.');
        done();
      });
    });
  });
});
