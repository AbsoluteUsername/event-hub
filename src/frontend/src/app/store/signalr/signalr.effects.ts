import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap, withLatestFrom } from 'rxjs/operators';
import { signalrEventReceived } from './signalr.actions';
import { loadEvents, markNewEvent, updateTotalCount, changeFilter, changePage } from '../events/events.actions';
import { selectEventsPagination, selectEventsFilters } from '../events/events.selectors';
import { NotificationService } from '../../core/services/notification.service';
import { EventResponse } from '../../shared/models/event.model';
import { EventFilter } from '../../shared/models/event-filter.model';

@Injectable()
export class SignalrEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly notificationService = inject(NotificationService);

  eventReceived$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signalrEventReceived),
      withLatestFrom(
        this.store.select(selectEventsPagination),
        this.store.select(selectEventsFilters),
      ),
      switchMap(([{ event }, pagination, filters]) => {
        const isPage1 = pagination.page === 1;
        const matchesFilters = this.eventMatchesFilters(event, filters);

        if (isPage1 && matchesFilters) {
          return [markNewEvent({ eventId: event.id }), loadEvents()];
        } else if (isPage1 && !matchesFilters) {
          this.notificationService.showInfo(
            'New event added — hidden by current filters',
            'Clear filters',
            () => this.store.dispatch(changeFilter({ filter: {} }))
          );
          return [loadEvents()];
        } else {
          this.notificationService.showInfo(
            'New event added',
            'Go to page 1',
            () => this.store.dispatch(changePage({ page: 1 }))
          );
          return [updateTotalCount()];
        }
      })
    )
  );

  private eventMatchesFilters(event: EventResponse, filters: Partial<EventFilter>): boolean {
    if (filters.type && event.type !== filters.type) return false;
    if (filters.userId && event.userId !== filters.userId) return false;
    if (filters.description && !event.description.toLowerCase().includes(filters.description.toLowerCase())) return false;
    if (filters.from && new Date(event.createdAt) < new Date(filters.from)) return false;
    if (filters.to && new Date(event.createdAt) > new Date(filters.to)) return false;
    return true;
  }
}
