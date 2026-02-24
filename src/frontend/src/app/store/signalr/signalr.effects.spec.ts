import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject } from 'rxjs';
import { SignalrEffects } from './signalr.effects';
import { signalrEventReceived } from './signalr.actions';
import { loadEvents } from '../events/events.actions';
import { selectEventsPagination } from '../events/events.selectors';
import { EventType } from '../../shared/models/event.model';

describe('SignalrEffects', () => {
  let effects: SignalrEffects;
  let actions$: ReplaySubject<Action>;
  let store: MockStore;

  const mockEvent = {
    id: '1',
    userId: 'user1',
    type: EventType.Click,
    description: 'test event',
    createdAt: '2026-02-24T00:00:00Z',
  };

  beforeEach(() => {
    actions$ = new ReplaySubject<Action>(1);

    TestBed.configureTestingModule({
      providers: [
        SignalrEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
      ],
    });

    effects = TestBed.inject(SignalrEffects);
    store = TestBed.inject(MockStore);
  });

  afterEach(() => {
    store.resetSelectors();
  });

  describe('eventReceived$', () => {
    it('should dispatch loadEvents when on page 1', (done) => {
      store.overrideSelector(selectEventsPagination, {
        page: 1,
        pageSize: 20,
      });

      effects.eventReceived$.subscribe((action) => {
        expect(action).toEqual(loadEvents());
        done();
      });

      actions$.next(signalrEventReceived({ event: mockEvent }));
    });

    it('should NOT dispatch loadEvents when on page 2', () => {
      store.overrideSelector(selectEventsPagination, {
        page: 2,
        pageSize: 20,
      });

      const results: Action[] = [];
      const sub = effects.eventReceived$.subscribe((action) => {
        results.push(action);
      });

      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(results.length).toBe(0);
      sub.unsubscribe();
    });

    it('should NOT dispatch loadEvents when on page 3', () => {
      store.overrideSelector(selectEventsPagination, {
        page: 3,
        pageSize: 20,
      });

      const results: Action[] = [];
      const sub = effects.eventReceived$.subscribe((action) => {
        results.push(action);
      });

      actions$.next(signalrEventReceived({ event: mockEvent }));

      expect(results.length).toBe(0);
      sub.unsubscribe();
    });
  });
});
