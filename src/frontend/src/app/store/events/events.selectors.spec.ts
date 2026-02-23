import {
  selectEvents,
  selectEventsTotalCount,
  selectEventsLoading,
  selectEventsError,
  selectEventsFilters,
  selectEventsPagination,
  selectEventsSort,
  selectEventsQueryParams,
} from './events.selectors';
import { EventsState, initialEventsState } from './events.reducer';
import { EventResponse, EventType } from '../../shared/models/event.model';

describe('Events Selectors', () => {
  const mockItems: EventResponse[] = [
    {
      id: '1',
      userId: 'olena',
      type: EventType.PageView,
      description: 'Viewed homepage',
      createdAt: '2026-02-24T10:00:00Z',
    },
  ];

  const populatedState: EventsState = {
    items: mockItems,
    totalCount: 42,
    loading: false,
    error: null,
    filters: { userId: 'olena', type: EventType.PageView },
    pagination: { page: 2, pageSize: 10 },
    sort: { sortBy: 'userId', sortDir: 'asc' },
  };

  describe('selectEvents', () => {
    it('should return the items array', () => {
      const result = selectEvents.projector(populatedState);
      expect(result).toEqual(mockItems);
    });

    it('should return empty array from initial state', () => {
      const result = selectEvents.projector(initialEventsState);
      expect(result).toEqual([]);
    });
  });

  describe('selectEventsTotalCount', () => {
    it('should return totalCount', () => {
      const result = selectEventsTotalCount.projector(populatedState);
      expect(result).toBe(42);
    });
  });

  describe('selectEventsLoading', () => {
    it('should return loading boolean', () => {
      const loadingState: EventsState = { ...initialEventsState, loading: true };
      const result = selectEventsLoading.projector(loadingState);
      expect(result).toBe(true);
    });

    it('should return false from initial state', () => {
      const result = selectEventsLoading.projector(initialEventsState);
      expect(result).toBe(false);
    });
  });

  describe('selectEventsError', () => {
    it('should return error string', () => {
      const errorState: EventsState = { ...initialEventsState, error: 'Something went wrong' };
      const result = selectEventsError.projector(errorState);
      expect(result).toBe('Something went wrong');
    });

    it('should return null from initial state', () => {
      const result = selectEventsError.projector(initialEventsState);
      expect(result).toBeNull();
    });
  });

  describe('selectEventsFilters', () => {
    it('should return current filters', () => {
      const result = selectEventsFilters.projector(populatedState);
      expect(result).toEqual({ userId: 'olena', type: EventType.PageView });
    });
  });

  describe('selectEventsPagination', () => {
    it('should return pagination object', () => {
      const result = selectEventsPagination.projector(populatedState);
      expect(result).toEqual({ page: 2, pageSize: 10 });
    });
  });

  describe('selectEventsSort', () => {
    it('should return sort object', () => {
      const result = selectEventsSort.projector(populatedState);
      expect(result).toEqual({ sortBy: 'userId', sortDir: 'asc' });
    });
  });

  describe('selectEventsQueryParams', () => {
    it('should combine filters, pagination, and sort into EventFilter', () => {
      const filters = { userId: 'olena', type: EventType.PageView };
      const pagination = { page: 2, pageSize: 10 };
      const sort = { sortBy: 'userId' as string, sortDir: 'asc' as const };

      const result = selectEventsQueryParams.projector(filters, pagination, sort);

      expect(result).toEqual({
        userId: 'olena',
        type: EventType.PageView,
        page: 2,
        pageSize: 10,
        sortBy: 'userId',
        sortDir: 'asc',
      });
    });

    it('should work with empty filters', () => {
      const filters = {};
      const pagination = { page: 1, pageSize: 20 };
      const sort = { sortBy: 'createdAt' as string, sortDir: 'desc' as const };

      const result = selectEventsQueryParams.projector(filters, pagination, sort);

      expect(result).toEqual({
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
    });
  });
});
