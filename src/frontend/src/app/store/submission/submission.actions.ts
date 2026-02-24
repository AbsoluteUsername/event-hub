import { createAction, props } from '@ngrx/store';
import { CreateEventRequest, EventResponse } from '../../shared/models/event.model';

export const submitEvent = createAction(
  '[Event Form] Submit Event',
  props<{ request: CreateEventRequest }>()
);

export const submitEventSuccess = createAction(
  '[Events API] Submit Event Success',
  props<{ event: EventResponse }>()
);

export const submitEventFailure = createAction(
  '[Events API] Submit Event Failure',
  props<{ error: string }>()
);

export const resetSubmissionStatus = createAction(
  '[Event Form] Reset Submission Status'
);

export const chipFlying = createAction('[Submission] Chip Flying');

export const chipWaitingSignalr = createAction('[Submission] Chip Waiting SignalR');

export const chipLanding = createAction('[Submission] Chip Landing');

export const chipLanded = createAction('[Submission] Chip Landed');
