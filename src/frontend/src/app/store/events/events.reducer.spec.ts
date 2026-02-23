import { eventsReducer, initialEventsState, EventsState } from './events.reducer';
import * as EventsActions from './events.actions';
import { EventResponse, EventType } from '../../shared/models/event.model';
import { PagedResult } from '../../shared/models/paged-result.model';

describe('eventsReducer', () => {
  const mockItems: EventResponse[] = [
    {
      id: '1',
      userId: 'olena',
      type: EventType.PageView,
      description: 'Viewed homepage',
      createdAt: '2026-02-24T10:00:00Z',
    },
    {
      id: '2',
      userId: 'dmytro',
      type: EventType.Click,
      description: 'Clicked button',
      createdAt: '2026-02-24T10:01:00Z',
    },
  ];

  const mockPagedResult: PagedResult<EventResponse> = {
    items: mockItems,
    totalCount: 42,
    page: 1,
    pageSize: 20,
  };

  it('should return the initial state on unknown action', () => {
    const action = { type: 'UNKNOWN' };
    const state = eventsReducer(undefined, action);
    expect(state).toEqual(initialEventsState);
  });

  it('should have correct initial state defaults', () => {
    expect(initialEventsState.items).toEqual([]);
    expect(initialEventsState.totalCount).toBe(0);
    expect(initialEventsState.loading).toBe(false);
    expect(initialEventsState.error).toBeNull();
    expect(initialEventsState.filters).toEqual({});
    expect(initialEventsState.pagination).toEqual({ page: 1, pageSize: 20 });
    expect(initialEventsState.sort).toEqual({ sortBy: 'createdAt', sortDir: 'desc' });
  });

  describe('loadEvents', () => {
    it('should set loading to true and clear error', () => {
      const state = eventsReducer(initialEventsState, EventsActions.loadEvents());
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should clear previous error when loading', () => {
      const errorState: EventsState = {
        ...initialEventsState,
        error: 'Previous error',
        loading: false,
      };
      const state = eventsReducer(errorState, EventsActions.loadEvents());
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('loadEventsSuccess', () => {
    it('should populate items and totalCount, set loading to false', () => {
      const loadingState: EventsState = { ...initialEventsState, loading: true };
      const state = eventsReducer(
        loadingState,
        EventsActions.loadEventsSuccess({ result: mockPagedResult })
      );
      expect(state.items).toEqual(mockItems);
      expect(state.totalCount).toBe(42);
      expect(state.loading).toBe(false);
    });
  });

  describe('loadEventsFailure', () => {
    it('should set error message and loading to false', () => {
      const loadingState: EventsState = { ...initialEventsState, loading: true };
      const state = eventsReducer(
        loadingState,
        EventsActions.loadEventsFailure({ error: 'Network error' })
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('changeFilter', () => {
    it('should merge partial filter into filters', () => {
      const state = eventsReducer(
        initialEventsState,
        EventsActions.changeFilter({ filter: { userId: 'test-user' } })
      );
      expect(state.filters).toEqual({ userId: 'test-user' });
    });

    it('should merge with existing filters', () => {
      const stateWithFilter: EventsState = {
        ...initialEventsState,
        filters: { userId: 'existing' },
      };
      const state = eventsReducer(
        stateWithFilter,
        EventsActions.changeFilter({ filter: { type: EventType.Click } })
      );
      expect(state.filters).toEqual({ userId: 'existing', type: EventType.Click });
    });

    it('should reset page to 1', () => {
      const stateOnPage2: EventsState = {
        ...initialEventsState,
        pagination: { page: 2, pageSize: 20 },
      };
      const state = eventsReducer(
        stateOnPage2,
        EventsActions.changeFilter({ filter: { userId: 'test' } })
      );
      expect(state.pagination.page).toBe(1);
    });
  });

  describe('changePage', () => {
    it('should update page number', () => {
      const state = eventsReducer(
        initialEventsState,
        EventsActions.changePage({ page: 3 })
      );
      expect(state.pagination.page).toBe(3);
      expect(state.pagination.pageSize).toBe(20);
    });

    it('should update pageSize when provided', () => {
      const state = eventsReducer(
        initialEventsState,
        EventsActions.changePage({ page: 1, pageSize: 50 })
      );
      expect(state.pagination.page).toBe(1);
      expect(state.pagination.pageSize).toBe(50);
    });

    it('should keep existing pageSize when not provided', () => {
      const stateWithCustomSize: EventsState = {
        ...initialEventsState,
        pagination: { page: 1, pageSize: 50 },
      };
      const state = eventsReducer(
        stateWithCustomSize,
        EventsActions.changePage({ page: 2 })
      );
      expect(state.pagination.pageSize).toBe(50);
    });
  });

  describe('changeSort', () => {
    it('should update sortBy and sortDir', () => {
      const state = eventsReducer(
        initialEventsState,
        EventsActions.changeSort({ sortBy: 'userId', sortDir: 'asc' })
      );
      expect(state.sort).toEqual({ sortBy: 'userId', sortDir: 'asc' });
    });
  });
});
