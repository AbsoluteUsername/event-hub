import { createReducer } from '@ngrx/store';

export interface EventsState {
  items: unknown[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

export const initialEventsState: EventsState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const eventsReducer = createReducer(initialEventsState);
