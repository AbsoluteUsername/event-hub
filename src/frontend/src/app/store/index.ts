import { EventsState } from './events/events.reducer';
import { SubmissionState } from './submission/submission.reducer';
import { SignalrState } from './signalr/signalr.reducer';

export interface AppState {
  events: EventsState;
  submission: SubmissionState;
  signalr: SignalrState;
}
