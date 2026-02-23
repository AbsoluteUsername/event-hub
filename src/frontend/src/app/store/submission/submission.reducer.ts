import { createReducer } from '@ngrx/store';

export interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'failure';
  error: string | null;
}

export const initialSubmissionState: SubmissionState = {
  status: 'idle',
  error: null,
};

export const submissionReducer = createReducer(initialSubmissionState);
