import { createReducer, on } from '@ngrx/store';
import { EventResponse } from '../../shared/models/event.model';
import { EventFilter } from '../../shared/models/event-filter.model';
import * as EventsActions from './events.actions';

export interface EventsState {
  items: EventResponse[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  filters: Partial<EventFilter>;
  pagination: { page: number; pageSize: number };
  sort: { sortBy: string; sortDir: 'asc' | 'desc' };
}

export const initialEventsState: EventsState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
  filters: {},
  pagination: { page: 1, pageSize: 20 },
  sort: { sortBy: 'createdAt', sortDir: 'desc' },
};

export const eventsReducer = createReducer(
  initialEventsState,
  on(EventsActions.loadEvents, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(EventsActions.loadEventsSuccess, (state, { result }) => ({
    ...state,
    items: result.items,
    totalCount: result.totalCount,
    loading: false,
  })),
  on(EventsActions.loadEventsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(EventsActions.changeFilter, (state, { filter }) => ({
    ...state,
    filters: { ...state.filters, ...filter },
    pagination: { ...state.pagination, page: 1 },
  })),
  on(EventsActions.changePage, (state, { page, pageSize }) => ({
    ...state,
    pagination: {
      page,
      pageSize: pageSize ?? state.pagination.pageSize,
    },
  })),
  on(EventsActions.changeSort, (state, { sortBy, sortDir }) => ({
    ...state,
    sort: { sortBy, sortDir },
  }))
);
