import { createReducer, on } from '@ngrx/store';
import * as SubmissionActions from './submission.actions';

export interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'failure' | 'chip-flying' | 'waiting-signalr' | 'landing' | 'complete';
  error: string | null;
}

export const initialSubmissionState: SubmissionState = {
  status: 'idle',
  error: null,
};

export const submissionReducer = createReducer(
  initialSubmissionState,
  on(SubmissionActions.submitEvent, (state) => ({
    ...state,
    status: 'submitting' as const,
    error: null,
  })),
  on(SubmissionActions.submitEventSuccess, (state) => ({
    ...state,
    status: 'success' as const,
    error: null,
  })),
  on(SubmissionActions.submitEventFailure, (state, { error }) => ({
    ...state,
    status: 'failure' as const,
    error,
  })),
  on(SubmissionActions.resetSubmissionStatus, (state) => ({
    ...state,
    status: 'idle' as const,
    error: null,
  })),
  on(SubmissionActions.chipFlying, (state) => ({
    ...state,
    status: 'chip-flying' as const,
  })),
  on(SubmissionActions.chipWaitingSignalr, (state) => ({
    ...state,
    status: 'waiting-signalr' as const,
  })),
  on(SubmissionActions.chipLanding, (state) => ({
    ...state,
    status: 'landing' as const,
  })),
  on(SubmissionActions.chipLanded, (state) => ({
    ...state,
    status: 'complete' as const,
  }))
);
