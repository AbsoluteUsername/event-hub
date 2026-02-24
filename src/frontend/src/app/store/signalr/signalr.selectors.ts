import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SignalrState } from './signalr.reducer';

export const selectSignalrState =
  createFeatureSelector<SignalrState>('signalr');

export const selectConnectionStatus = createSelector(
  selectSignalrState,
  (state) => state.connectionStatus
);

export const selectIsConnected = createSelector(
  selectConnectionStatus,
  (status) => status === 'connected'
);
