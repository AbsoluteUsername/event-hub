import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ReplaySubject, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';
import { EventsEffects } from './events.effects';
import { EventService } from '../../core/services/event.service';
import { NotificationService } from '../../core/services/notification.service';
import * as EventsActions from './events.actions';
import { selectEventsQueryParams } from './events.selectors';
import { EventResponse, EventType } from '../../shared/models/event.model';
import { PagedResult } from '../../shared/models/paged-result.model';
import { EventFilter } from '../../shared/models/event-filter.model';

describe('EventsEffects', () => {
  let effects: EventsEffects;
  let actions$: ReplaySubject<Action>;
  let eventService: jasmine.SpyObj<EventService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let store: MockStore;

  const mockQueryParams: EventFilter = {
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  };

  const mockItems: EventResponse[] = [
    {
      id: '1',
      userId: 'olena',
      type: EventType.PageView,
      description: 'Viewed homepage',
      createdAt: '2026-02-24T10:00:00Z',
    },
  ];

  const mockPagedResult: PagedResult<EventResponse> = {
    items: mockItems,
    totalCount: 1,
    page: 1,
    pageSize: 20,
  };

  beforeEach(() => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getAll']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError',
    ]);

    TestBed.configureTestingModule({
      providers: [
        EventsEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: EventService, useValue: eventServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });

    effects = TestBed.inject(EventsEffects);
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    store = TestBed.inject(MockStore);
    actions$ = new ReplaySubject<Action>(1);

    store.overrideSelector(selectEventsQueryParams, mockQueryParams);
  });

  afterEach(() => {
    store.resetSelectors();
  });

  describe('loadEvents$', () => {
    it('should call EventService.getAll() with current query params and dispatch loadEventsSuccess', (done) => {
      eventService.getAll.and.returnValue(of(mockPagedResult));
      actions$.next(EventsActions.loadEvents());

      effects.loadEvents$.subscribe((action) => {
        expect(action).toEqual(EventsActions.loadEventsSuccess({ result: mockPagedResult }));
        expect(eventService.getAll).toHaveBeenCalledWith(mockQueryParams);
        done();
      });
    });

    it('should dispatch loadEventsFailure on HTTP error with field errors', (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 400,
        error: {
          errors: {
            type: 'Invalid event type.',
          },
        },
      });
      eventService.getAll.and.returnValue(throwError(() => errorResponse));
      actions$.next(EventsActions.loadEvents());

      effects.loadEvents$.subscribe((action) => {
        expect(action).toEqual(
          EventsActions.loadEventsFailure({ error: 'type: Invalid event type.' })
        );
        done();
      });
    });

    it('should dispatch loadEventsFailure with generic message on 500 response', (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 500,
        error: { message: 'Internal Server Error' },
      });
      eventService.getAll.and.returnValue(throwError(() => errorResponse));
      actions$.next(EventsActions.loadEvents());

      effects.loadEvents$.subscribe((action) => {
        expect(action).toEqual(
          EventsActions.loadEventsFailure({
            error: 'An unexpected error occurred. Please try again.',
          })
        );
        done();
      });
    });

    it('should dispatch loadEventsFailure with connection error on network failure', (done) => {
      const errorResponse = new HttpErrorResponse({
        status: 0,
        error: new ProgressEvent('error'),
      });
      eventService.getAll.and.returnValue(throwError(() => errorResponse));
      actions$.next(EventsActions.loadEvents());

      effects.loadEvents$.subscribe((action) => {
        expect(action).toEqual(
          EventsActions.loadEventsFailure({ error: 'Connection error. Check your network.' })
        );
        done();
      });
    });
  });

  describe('changeFilter$', () => {
    it('should debounce 300ms before dispatching loadEvents', fakeAsync(() => {
      let emitted: Action | undefined;
      effects.changeFilter$.subscribe((action) => {
        emitted = action;
      });

      actions$.next(EventsActions.changeFilter({ filter: { userId: 'test' } }));
      expect(emitted).toBeUndefined();

      tick(299);
      expect(emitted).toBeUndefined();

      tick(1);
      expect(emitted).toEqual(EventsActions.loadEvents());
    }));
  });

  describe('changePage$', () => {
    it('should dispatch loadEvents immediately (no debounce)', (done) => {
      actions$.next(EventsActions.changePage({ page: 2 }));

      effects.changePage$.subscribe((action) => {
        expect(action).toEqual(EventsActions.loadEvents());
        done();
      });
    });
  });

  describe('changeSort$', () => {
    it('should dispatch loadEvents immediately (no debounce)', (done) => {
      actions$.next(EventsActions.changeSort({ sortBy: 'userId', sortDir: 'asc' }));

      effects.changeSort$.subscribe((action) => {
        expect(action).toEqual(EventsActions.loadEvents());
        done();
      });
    });
  });

  describe('loadEventsFailure$', () => {
    it('should call notificationService.showError on loadEventsFailure', (done) => {
      actions$.next(
        EventsActions.loadEventsFailure({
          error: 'An unexpected error occurred. Please try again.',
        })
      );

      effects.loadEventsFailure$.subscribe(() => {
        expect(notificationService.showError).toHaveBeenCalledWith(
          'An unexpected error occurred. Please try again.'
        );
        done();
      });
    });
  });
});
