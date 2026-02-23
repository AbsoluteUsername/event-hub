import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EventsState } from './events.reducer';
import { EventFilter } from '../../shared/models/event-filter.model';

export const selectEventsState = createFeatureSelector<EventsState>('events');

export const selectEvents = createSelector(
  selectEventsState,
  (state) => state.items
);

export const selectEventsTotalCount = createSelector(
  selectEventsState,
  (state) => state.totalCount
);

export const selectEventsLoading = createSelector(
  selectEventsState,
  (state) => state.loading
);

export const selectEventsError = createSelector(
  selectEventsState,
  (state) => state.error
);

export const selectEventsFilters = createSelector(
  selectEventsState,
  (state) => state.filters
);

export const selectEventsPagination = createSelector(
  selectEventsState,
  (state) => state.pagination
);

export const selectEventsSort = createSelector(
  selectEventsState,
  (state) => state.sort
);

export const selectEventsQueryParams = createSelector(
  selectEventsFilters,
  selectEventsPagination,
  selectEventsSort,
  (filters, pagination, sort): EventFilter => ({
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  })
);
