import { createAction, props } from '@ngrx/store';
import { EventResponse } from '../../shared/models/event.model';

export const signalrConnected = createAction('[SignalR] Connected');

export const signalrDisconnected = createAction('[SignalR] Disconnected');

export const signalrReconnecting = createAction('[SignalR] Reconnecting');

export const signalrEventReceived = createAction(
  '[SignalR] Event Received',
  props<{ event: EventResponse }>()
);
