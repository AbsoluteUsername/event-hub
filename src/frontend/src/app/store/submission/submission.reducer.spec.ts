import { submissionReducer, initialSubmissionState, SubmissionState } from './submission.reducer';
import { submitEvent, submitEventSuccess, submitEventFailure } from './submission.actions';
import { CreateEventRequest, EventResponse, EventType } from '../../shared/models/event.model';

describe('submissionReducer', () => {
  const mockRequest: CreateEventRequest = {
    userId: 'olena',
    type: EventType.PageView,
    description: 'Viewed homepage',
  };

  const mockResponse: EventResponse = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'olena',
    type: EventType.PageView,
    description: 'Viewed homepage',
    createdAt: '2026-02-23T14:30:00Z',
  };

  it('should return the initial state on unknown action', () => {
    const action = { type: 'UNKNOWN' };
    const state = submissionReducer(initialSubmissionState, action);
    expect(state).toBe(initialSubmissionState);
  });

  it('should set status to submitting and clear error on submitEvent', () => {
    const action = submitEvent({ request: mockRequest });
    const state = submissionReducer(initialSubmissionState, action);
    expect(state.status).toBe('submitting');
    expect(state.error).toBeNull();
  });

  it('should clear previous error when submitting', () => {
    const errorState: SubmissionState = {
      status: 'failure',
      error: 'Previous error',
    };
    const action = submitEvent({ request: mockRequest });
    const state = submissionReducer(errorState, action);
    expect(state.status).toBe('submitting');
    expect(state.error).toBeNull();
  });

  it('should set status to success and clear error on submitEventSuccess', () => {
    const submittingState: SubmissionState = {
      status: 'submitting',
      error: null,
    };
    const action = submitEventSuccess({ event: mockResponse });
    const state = submissionReducer(submittingState, action);
    expect(state.status).toBe('success');
    expect(state.error).toBeNull();
  });

  it('should set status to failure and set error on submitEventFailure', () => {
    const submittingState: SubmissionState = {
      status: 'submitting',
      error: null,
    };
    const action = submitEventFailure({ error: 'userId: The UserId field is required.' });
    const state = submissionReducer(submittingState, action);
    expect(state.status).toBe('failure');
    expect(state.error).toBe('userId: The UserId field is required.');
  });
});
