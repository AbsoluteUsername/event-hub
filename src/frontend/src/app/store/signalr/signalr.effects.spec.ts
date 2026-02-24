import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject } from 'rxjs';
import { SignalrEffects } from './signalr.effects';
import { signalrEventReceived } from './signalr.actions';
import { loadEvents, markNewEvent, updateTotalCount } from '../events/events.actions';
import { selectEventsPagination, selectEventsFilters } from '../events/events.selectors';
import { EventType } from '../../shared/models/event.model';
import { NotificationService } from '../../core/services/notification.service';

describe('SignalrEffects', () => {
  let effects: SignalrEffects;
  let actions$: ReplaySubject<Action>;
  let store: MockStore;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockEvent = {
    id: '1',
    userId: 'user1',
    type: EventType.Click,
    description: 'test event',
    createdAt: '2026-02-24T00:00:00Z',
  };

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['showInfo']);

    TestBed.configureTestingModule({
      providers: [
        SignalrEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: NotificationService, useValue: notificationSpy },
      ],
    });

    effects = TestBed.inject(SignalrEffects);
    store = TestBed.inject(MockStore);
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  afterEach(() => {
    store.resetSelectors();
  });

  describe('eventReceived$ - Scenario 1: Page 1, event matches filters', () => {
    beforeEach(() => {
      store.overrideSelector(selectEventsPagination, { page: 1, pageSize: 20 });
      store.overrideSelector(selectEventsFilters, {});
    });

    it('should dispatch markNewEvent and loadEvents', () => {
      const results: Action[] = [];
      effects.eventReceived$.subscribe((action) => results.push(action));

      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(results).toEqual([
        markNewEvent({ eventId: '1' }),
        loadEvents(),
      ]);
    });

    it('should NOT call showInfo', () => {
      effects.eventReceived$.subscribe();
      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(notificationService.showInfo).not.toHaveBeenCalled();
    });
  });

  describe('eventReceived$ - Scenario 2: Page 1, event excluded by filters', () => {
    beforeEach(() => {
      store.overrideSelector(selectEventsPagination, { page: 1, pageSize: 20 });
      store.overrideSelector(selectEventsFilters, { type: EventType.PageView });
    });

    it('should dispatch loadEvents only (no markNewEvent)', () => {
      const results: Action[] = [];
      effects.eventReceived$.subscribe((action) => results.push(action));

      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(results).toEqual([loadEvents()]);
    });

    it('should call showInfo with hidden-by-filters message and Clear filters action', () => {
      effects.eventReceived$.subscribe();
      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(notificationService.showInfo).toHaveBeenCalledWith(
        'New event added — hidden by current filters',
        'Clear filters',
        jasmine.any(Function)
      );
    });
  });

  describe('eventReceived$ - Scenario 3: Page 2+', () => {
    beforeEach(() => {
      store.overrideSelector(selectEventsPagination, { page: 2, pageSize: 20 });
      store.overrideSelector(selectEventsFilters, {});
    });

    it('should dispatch updateTotalCount only (no loadEvents)', () => {
      const results: Action[] = [];
      effects.eventReceived$.subscribe((action) => results.push(action));

      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(results).toEqual([updateTotalCount()]);
    });

    it('should NOT dispatch loadEvents', () => {
      const results: Action[] = [];
      effects.eventReceived$.subscribe((action) => results.push(action));

      actions$.next(signalrEventReceived({ event: mockEvent }));

      const hasLoadEvents = results.some(a => a.type === loadEvents.type);
      expect(hasLoadEvents).toBe(false);
    });

    it('should call showInfo with Go to page 1 action', () => {
      effects.eventReceived$.subscribe();
      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(notificationService.showInfo).toHaveBeenCalledWith(
        'New event added',
        'Go to page 1',
        jasmine.any(Function)
      );
    });
  });

  describe('eventMatchesFilters helper', () => {
    beforeEach(() => {
      store.overrideSelector(selectEventsPagination, { page: 1, pageSize: 20 });
    });

    it('should exclude event when type does not match filter', () => {
      store.overrideSelector(selectEventsFilters, { type: EventType.Purchase });

      const results: Action[] = [];
      effects.eventReceived$.subscribe((action) => results.push(action));

      actions$.next(signalrEventReceived({ event: mockEvent }));

      // Excluded → scenario 2 (loadEvents only, no markNewEvent)
      expect(results).toEqual([loadEvents()]);
    });

    it('should exclude event when userId does not match filter', () => {
      store.overrideSelector(selectEventsFilters, { userId: 'other-user' });

      const results: Action[] = [];
      effects.eventReceived$.subscribe((action) => results.push(action));

      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(results).toEqual([loadEvents()]);
    });

    it('should exclude event when description does not contain filter text', () => {
      store.overrideSelector(selectEventsFilters, { description: 'nonexistent' });

      const results: Action[] = [];
      effects.eventReceived$.subscribe((action) => results.push(action));

      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(results).toEqual([loadEvents()]);
    });

    it('should include event when all filters match', () => {
      store.overrideSelector(selectEventsFilters, { type: EventType.Click, userId: 'user1' });

      const results: Action[] = [];
      effects.eventReceived$.subscribe((action) => results.push(action));

      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(results).toEqual([
        markNewEvent({ eventId: '1' }),
        loadEvents(),
      ]);
    });
  });
});
