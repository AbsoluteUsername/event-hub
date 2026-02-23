import { createAction, props } from '@ngrx/store';
import { EventResponse } from '../../shared/models/event.model';
import { EventFilter } from '../../shared/models/event-filter.model';
import { PagedResult } from '../../shared/models/paged-result.model';

// Events Page actions
export const loadEvents = createAction('[Events Page] Load Events');

export const changeFilter = createAction(
  '[Events Page] Change Filter',
  props<{ filter: Partial<EventFilter> }>()
);

export const changePage = createAction(
  '[Events Page] Change Page',
  props<{ page: number; pageSize?: number }>()
);

export const changeSort = createAction(
  '[Events Page] Change Sort',
  props<{ sortBy: string; sortDir: 'asc' | 'desc' }>()
);

// Events API actions
export const loadEventsSuccess = createAction(
  '[Events API] Load Events Success',
  props<{ result: PagedResult<EventResponse> }>()
);

export const loadEventsFailure = createAction(
  '[Events API] Load Events Failure',
  props<{ error: string }>()
);
