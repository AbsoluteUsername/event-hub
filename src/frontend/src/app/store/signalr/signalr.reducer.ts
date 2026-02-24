import { createReducer, on } from '@ngrx/store';
import * as SignalrActions from './signalr.actions';

export interface SignalrState {
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
}

export const initialSignalrState: SignalrState = {
  connectionStatus: 'disconnected',
};

export const signalrReducer = createReducer(
  initialSignalrState,
  on(SignalrActions.signalrConnected, (state) => ({
    ...state,
    connectionStatus: 'connected' as const,
  })),
  on(SignalrActions.signalrReconnecting, (state) => ({
    ...state,
    connectionStatus: 'reconnecting' as const,
  })),
  on(SignalrActions.signalrDisconnected, (state) => ({
    ...state,
    connectionStatus: 'disconnected' as const,
  }))
);
