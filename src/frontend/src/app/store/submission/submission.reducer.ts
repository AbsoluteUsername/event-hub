import { createReducer, on } from '@ngrx/store';
import * as SubmissionActions from './submission.actions';

export interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'failure';
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
  }))
);
