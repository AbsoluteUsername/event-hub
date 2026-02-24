import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { signalrEventReceived } from './signalr.actions';
import { loadEvents } from '../events/events.actions';
import { selectEventsPagination } from '../events/events.selectors';

@Injectable()
export class SignalrEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  eventReceived$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signalrEventReceived),
      withLatestFrom(this.store.select(selectEventsPagination)),
      filter(([, pagination]) => pagination.page === 1),
      map(() => loadEvents())
    )
  );
}
