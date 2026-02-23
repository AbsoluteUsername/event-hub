import { createReducer } from '@ngrx/store';

export interface SignalrState {
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
}

export const initialSignalrState: SignalrState = {
  connectionStatus: 'disconnected',
};

export const signalrReducer = createReducer(initialSignalrState);
