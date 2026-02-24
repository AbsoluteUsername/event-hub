import { signalrReducer, initialSignalrState, SignalrState } from './signalr.reducer';
import * as SignalrActions from './signalr.actions';
import { EventType } from '../../shared/models/event.model';

describe('signalrReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const action = { type: 'UNKNOWN' };
    const state = signalrReducer(undefined, action);
    expect(state).toEqual(initialSignalrState);
  });

  it('should have correct initial state defaults', () => {
    expect(initialSignalrState.connectionStatus).toBe('disconnected');
  });

  describe('signalrConnected', () => {
    it('should set connectionStatus to connected', () => {
      const state = signalrReducer(
        initialSignalrState,
        SignalrActions.signalrConnected()
      );
      expect(state.connectionStatus).toBe('connected');
    });

    it('should set connectionStatus to connected from reconnecting', () => {
      const reconnectingState: SignalrState = {
        connectionStatus: 'reconnecting',
      };
      const state = signalrReducer(
        reconnectingState,
        SignalrActions.signalrConnected()
      );
      expect(state.connectionStatus).toBe('connected');
    });
  });

  describe('signalrReconnecting', () => {
    it('should set connectionStatus to reconnecting', () => {
      const connectedState: SignalrState = {
        connectionStatus: 'connected',
      };
      const state = signalrReducer(
        connectedState,
        SignalrActions.signalrReconnecting()
      );
      expect(state.connectionStatus).toBe('reconnecting');
    });
  });

  describe('signalrDisconnected', () => {
    it('should set connectionStatus to disconnected', () => {
      const connectedState: SignalrState = {
        connectionStatus: 'connected',
      };
      const state = signalrReducer(
        connectedState,
        SignalrActions.signalrDisconnected()
      );
      expect(state.connectionStatus).toBe('disconnected');
    });

    it('should set connectionStatus to disconnected from reconnecting', () => {
      const reconnectingState: SignalrState = {
        connectionStatus: 'reconnecting',
      };
      const state = signalrReducer(
        reconnectingState,
        SignalrActions.signalrDisconnected()
      );
      expect(state.connectionStatus).toBe('disconnected');
    });
  });

  describe('signalrEventReceived', () => {
    it('should not change state on event received', () => {
      const connectedState: SignalrState = {
        connectionStatus: 'connected',
      };
      const state = signalrReducer(
        connectedState,
        SignalrActions.signalrEventReceived({
          event: {
            id: '1',
            userId: 'user1',
            type: EventType.Click,
            description: 'test',
            createdAt: '2026-02-24T00:00:00Z',
          },
        })
      );
      expect(state).toEqual(connectedState);
    });
  });
});
