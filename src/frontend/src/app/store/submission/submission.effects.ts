import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { EventService } from '../../core/services/event.service';
import { NotificationService } from '../../core/services/notification.service';
import * as SubmissionActions from './submission.actions';

@Injectable()
export class SubmissionEffects {
  private readonly actions$ = inject(Actions);
  private readonly eventService = inject(EventService);
  private readonly notificationService = inject(NotificationService);

  submitEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SubmissionActions.submitEvent),
      switchMap(({ request }) =>
        this.eventService.create(request).pipe(
          map((event) => SubmissionActions.submitEventSuccess({ event })),
          catchError((error: HttpErrorResponse) => {
            const errorMessage = this.extractErrorMessage(error);
            return of(SubmissionActions.submitEventFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  submitSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SubmissionActions.submitEventSuccess),
        tap(() =>
          this.notificationService.showSuccess('Event submitted successfully')
        )
      ),
    { dispatch: false }
  );

  submitFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SubmissionActions.submitEventFailure),
        tap(({ error }) => this.notificationService.showError(error))
      ),
    { dispatch: false }
  );

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.errors) {
      const errors = error.error.errors;
      return Object.entries(errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('; ');
    }
    if (error.status === 0) {
      return 'Connection error. Check your network.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
