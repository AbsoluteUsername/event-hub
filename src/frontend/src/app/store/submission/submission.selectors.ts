import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SubmissionState } from './submission.reducer';

export const selectSubmissionState = createFeatureSelector<SubmissionState>('submission');

export const selectSubmissionStatus = createSelector(
  selectSubmissionState,
  (state) => state.status
);

export const selectSubmissionError = createSelector(
  selectSubmissionState,
  (state) => state.error
);

export const selectIsSubmitting = createSelector(
  selectSubmissionState,
  (state) => state.status === 'submitting'
);
