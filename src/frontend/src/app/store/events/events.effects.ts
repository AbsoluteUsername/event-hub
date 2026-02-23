import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { switchMap, map, catchError, tap, debounceTime, withLatestFrom } from 'rxjs/operators';
import { EventService } from '../../core/services/event.service';
import { NotificationService } from '../../core/services/notification.service';
import * as EventsActions from './events.actions';
import { selectEventsQueryParams } from './events.selectors';

@Injectable()
export class EventsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly eventService = inject(EventService);
  private readonly notificationService = inject(NotificationService);

  loadEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventsActions.loadEvents),
      withLatestFrom(this.store.select(selectEventsQueryParams)),
      switchMap(([, queryParams]) =>
        this.eventService.getAll(queryParams).pipe(
          map((result) => EventsActions.loadEventsSuccess({ result })),
          catchError((error: HttpErrorResponse) => {
            const errorMessage = this.extractErrorMessage(error);
            return of(EventsActions.loadEventsFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  changeFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventsActions.changeFilter),
      debounceTime(300),
      map(() => EventsActions.loadEvents())
    )
  );

  changePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventsActions.changePage),
      map(() => EventsActions.loadEvents())
    )
  );

  changeSort$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventsActions.changeSort),
      map(() => EventsActions.loadEvents())
    )
  );

  loadEventsFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(EventsActions.loadEventsFailure),
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
