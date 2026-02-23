# Story 3.2: NgRx Events Store & Data Fetching

Status: review
Story-Key: 3-2-ngrx-events-store-and-data-fetching
Epic: 3 — Event Discovery & Table Display (Full Stack)
Date: 2026-02-24

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want the Angular events NgRx store slice with reactive data fetching on filter, sort, and page changes,
So that the table state is predictable and API calls are debounced efficiently.

## Acceptance Criteria

1. **Given** the NgRx store shell from Epic 1
   **When** the events store slice is implemented
   **Then** `store/events/events.actions.ts` contains: `loadEvents`, `loadEventsSuccess`, `loadEventsFailure`, `changeFilter`, `changePage`, `changeSort`
   **And** `store/events/events.reducer.ts` manages state: `{ items: Event[], totalCount: number, loading: boolean, error: string | null, filters: EventFilter, pagination: { page, pageSize }, sort: { sortBy, sortDir } }`
   **And** default state has: `page: 1, pageSize: 20, sortBy: 'createdAt', sortDir: 'desc'`, empty filters

2. **Given** a `changeFilter` action is dispatched
   **When** the events effect processes it
   **Then** it waits `debounceTime(300ms)` before triggering an API call via `EventService.getAll(filter)`
   **And** pagination resets to page 1

3. **Given** a `changePage` or `changeSort` action is dispatched
   **When** the events effect processes it
   **Then** it triggers an API call immediately (no debounce)

4. **Given** `loadEvents` is dispatched
   **When** the effect fires
   **Then** `loading` is set to `true` in the reducer
   **And** on success, items and totalCount are updated and `loading` is set to `false`
   **And** `core/services/event.service.ts` implements `getAll(filter: EventFilter): Observable<PagedResult<Event>>` calling `GET ${environment.apiUrl}/api/events` with query params

## Tasks / Subtasks

- [x] Task 1: Create events NgRx actions (AC: #1)
  - [x] 1.1 Create `src/frontend/src/app/store/events/events.actions.ts`
  - [x] 1.2 Define `loadEvents` action: `[Events Page] Load Events`
  - [x] 1.3 Define `loadEventsSuccess` action: `[Events API] Load Events Success` with `props<{ result: PagedResult<EventResponse> }>()`
  - [x] 1.4 Define `loadEventsFailure` action: `[Events API] Load Events Failure` with `props<{ error: string }>()`
  - [x] 1.5 Define `changeFilter` action: `[Events Page] Change Filter` with `props<{ filter: Partial<EventFilter> }>()`
  - [x] 1.6 Define `changePage` action: `[Events Page] Change Page` with `props<{ page: number; pageSize?: number }>()`
  - [x] 1.7 Define `changeSort` action: `[Events Page] Change Sort` with `props<{ sortBy: string; sortDir: 'asc' | 'desc' }>()`

- [x] Task 2: Update events NgRx reducer with full state management (AC: #1, #2, #3, #4)
  - [x] 2.1 Update `EventsState` interface in `events.reducer.ts` to include: `items: EventResponse[]`, `totalCount: number`, `loading: boolean`, `error: string | null`, `filters: EventFilter`, `pagination: { page: number; pageSize: number }`, `sort: { sortBy: string; sortDir: 'asc' | 'desc' }`
  - [x] 2.2 Set initial state: `items: [], totalCount: 0, loading: false, error: null, filters: {}, pagination: { page: 1, pageSize: 20 }, sort: { sortBy: 'createdAt', sortDir: 'desc' }`
  - [x] 2.3 Handle `loadEvents` — set `loading: true`, clear error
  - [x] 2.4 Handle `loadEventsSuccess` — set items, totalCount, `loading: false`
  - [x] 2.5 Handle `loadEventsFailure` — set `loading: false`, set error message
  - [x] 2.6 Handle `changeFilter` — merge partial filter into filters, reset pagination to page 1
  - [x] 2.7 Handle `changePage` — update page (and optionally pageSize)
  - [x] 2.8 Handle `changeSort` — update sortBy and sortDir

- [x] Task 3: Create events NgRx selectors (AC: #1, #4)
  - [x] 3.1 Create `src/frontend/src/app/store/events/events.selectors.ts`
  - [x] 3.2 Define `selectEventsState` feature selector
  - [x] 3.3 Define `selectEvents` — returns items array
  - [x] 3.4 Define `selectEventsTotalCount` — returns totalCount
  - [x] 3.5 Define `selectEventsLoading` — returns loading boolean
  - [x] 3.6 Define `selectEventsError` — returns error string or null
  - [x] 3.7 Define `selectEventsFilters` — returns current filters
  - [x] 3.8 Define `selectEventsPagination` — returns { page, pageSize }
  - [x] 3.9 Define `selectEventsSort` — returns { sortBy, sortDir }
  - [x] 3.10 Define `selectEventsQueryParams` — combines filters + pagination + sort into a single EventFilter object for the API call

- [x] Task 4: Create events NgRx effects with debounce logic (AC: #2, #3, #4)
  - [x] 4.1 Create `src/frontend/src/app/store/events/events.effects.ts`
  - [x] 4.2 Implement `loadEvents$` effect — on `loadEvents` action, select current query params from store, call `EventService.getAll()`, dispatch success/failure
  - [x] 4.3 Implement `changeFilter$` effect — on `changeFilter` action, apply `debounceTime(300)`, then dispatch `loadEvents`
  - [x] 4.4 Implement `changePage$` effect — on `changePage` action, dispatch `loadEvents` immediately (no debounce)
  - [x] 4.5 Implement `changeSort$` effect — on `changeSort` action, dispatch `loadEvents` immediately (no debounce)
  - [x] 4.6 Implement `loadEventsFailure$` non-dispatching effect — show error toast via `NotificationService`
  - [x] 4.7 Use `switchMap` in `loadEvents$` to cancel stale requests when new ones arrive
  - [x] 4.8 Use `withLatestFrom(store.select(selectEventsQueryParams))` to get current query state

- [x] Task 5: Register EventsEffects in app.config.ts (AC: #1)
  - [x] 5.1 Import `EventsEffects` in `app.config.ts`
  - [x] 5.2 Add `EventsEffects` to `provideEffects(SubmissionEffects, EventsEffects)`

- [x] Task 6: Verify EventService.getAll() exists from Story 3.1 (AC: #4)
  - [x] 6.1 Confirm `getAll(filter: EventFilter): Observable<PagedResult<EventResponse>>` exists in `event.service.ts`
  - [x] 6.2 Confirm `EventFilter` interface exists in `shared/models/event-filter.model.ts`
  - [x] 6.3 If Story 3.1 is not yet complete, implement `getAll()` and `EventFilter` as a prerequisite

- [x] Task 7: Unit Tests — Events Reducer (AC: #1, #2, #3, #4)
  - [x] 7.1 Create `src/frontend/src/app/store/events/events.reducer.spec.ts`
  - [x] 7.2 Test initial state matches expected defaults (page 1, pageSize 20, sortBy createdAt, sortDir desc)
  - [x] 7.3 Test `loadEvents` sets loading to true, clears error
  - [x] 7.4 Test `loadEventsSuccess` populates items and totalCount, sets loading to false
  - [x] 7.5 Test `loadEventsFailure` sets error message, sets loading to false
  - [x] 7.6 Test `changeFilter` merges partial filter, resets page to 1
  - [x] 7.7 Test `changePage` updates page (and pageSize if provided)
  - [x] 7.8 Test `changeSort` updates sortBy and sortDir

- [x] Task 8: Unit Tests — Events Effects (AC: #2, #3, #4)
  - [x] 8.1 Create `src/frontend/src/app/store/events/events.effects.spec.ts`
  - [x] 8.2 Test `loadEvents$` calls `EventService.getAll()` with current query params from store and dispatches `loadEventsSuccess`
  - [x] 8.3 Test `loadEvents$` dispatches `loadEventsFailure` on HTTP error
  - [x] 8.4 Test `changeFilter$` debounces 300ms before dispatching `loadEvents`
  - [x] 8.5 Test `changePage$` dispatches `loadEvents` immediately (no debounce)
  - [x] 8.6 Test `changeSort$` dispatches `loadEvents` immediately (no debounce)
  - [x] 8.7 Test `loadEventsFailure$` calls `NotificationService.showError()`
  - [x] 8.8 Use `provideMockStore` with initial state, `provideMockActions`, and mock `EventService`

- [x] Task 9: Unit Tests — Events Selectors (AC: #1)
  - [x] 9.1 Create `src/frontend/src/app/store/events/events.selectors.spec.ts`
  - [x] 9.2 Test each selector returns correct slice of state
  - [x] 9.3 Test `selectEventsQueryParams` correctly combines filters, pagination, and sort

- [x] Task 10: Verify End-to-End Build and Tests
  - [x] 10.1 Run `ng build` — successful production build
  - [x] 10.2 Run `ng test` — all existing + new tests pass
  - [x] 10.3 Run `ng lint` — 0 errors

## Dev Notes

### Architecture Patterns & Constraints

- **NgRx Store (ADR-5 — Updated):** NgRx was chosen over plain services+signals because state complexity justifies it — server-side pagination + filters + sort + SignalR connection + flying chip animation lifecycle + submit cycle + toast queue coordination
- **Clean Architecture enforcement rule #5:** Use NgRx actions for ALL state mutations — never modify store directly
- **Enforcement rule #9:** Use `provideStore()` / `provideEffects()` — never legacy `StoreModule.forRoot()` or `HTTP_INTERCEPTORS` provider
- **Enforcement rule #11:** Use `environment.ts` / `environment.prod.ts` for API URL — never hardcode URLs in services
- **Action naming convention:** `[Source] Verb Noun` — e.g., `[Events Page] Load Events`, `[Events API] Load Events Success`
- **Server-side pagination (ADR-6):** ALL filtering, sorting, and pagination happens on the server — the Angular store manages query parameters and dispatches API calls, it does NOT do client-side filtering/sorting
- **NFR-P5:** Loading indicator must appear within 200ms — NgRx synchronous dispatch ensures reducer sets `loading: true` before the next render cycle

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Why |
|------|-------|-----|
| `EventService` (HTTP client) | `src/frontend/src/app/core/services/event.service.ts` | Already has `create()`, add `getAll()` alongside it (Story 3.1 may have done this already) |
| `EventResponse` model | `src/frontend/src/app/shared/models/event.model.ts` | `id, userId, type, description, createdAt` — use directly in store state |
| `EventType` enum | `src/frontend/src/app/shared/models/event.model.ts` | `PageView, Click, Purchase` — referenced by EventFilter |
| `PagedResult<T>` model | `src/frontend/src/app/shared/models/paged-result.model.ts` | `items: T[], totalCount, page, pageSize` — used as API response type |
| `EventFilter` interface | `src/frontend/src/app/shared/models/event-filter.model.ts` | Created by Story 3.1 — `type?, userId?, description?, from?, to?, page, pageSize, sortBy, sortDir` |
| `SubmissionEffects` pattern | `src/frontend/src/app/store/submission/submission.effects.ts` | Class-based effects with `inject()` — follow EXACTLY this pattern for `EventsEffects` |
| `SubmissionActions` pattern | `src/frontend/src/app/store/submission/submission.actions.ts` | `createAction` with `props<>()` — follow same pattern |
| `submissionReducer` pattern | `src/frontend/src/app/store/submission/submission.reducer.ts` | `createReducer` with `on()` handlers — follow same pattern |
| `submission.selectors.ts` pattern | `src/frontend/src/app/store/submission/submission.selectors.ts` | `createFeatureSelector` + `createSelector` — follow same pattern |
| `NotificationService` | `src/frontend/src/app/core/services/notification.service.ts` | Used for error toasts in effects — already imported in `SubmissionEffects` |
| `AppState` interface | `src/frontend/src/app/store/index.ts` | Already has `events: EventsState` — update `EventsState` import if needed |
| `app.config.ts` | `src/frontend/src/app/app.config.ts` | Already registers `eventsReducer` in `provideStore()` — add `EventsEffects` to `provideEffects()` |
| `environment.apiUrl` | `src/frontend/src/environments/environment.ts` | `'https://localhost:5001'` — used by EventService for API base URL |
| Error extraction pattern | `SubmissionEffects.extractErrorMessage()` | Parses `{"errors": {"field": "message"}}` format — reuse same pattern or extract to shared utility |

### Critical Anti-Patterns to Avoid

- **DO NOT** implement client-side filtering/sorting/pagination — ALL data operations happen server-side (ADR-6). The store manages query parameters and triggers API calls
- **DO NOT** use `MatTableDataSource` for filtering — that's client-side. Use NgRx selectors to feed data directly to `mat-table`
- **DO NOT** debounce `changePage` or `changeSort` — only `changeFilter` gets `debounceTime(300ms)`. Page/sort changes should feel instant
- **DO NOT** use `concatMap` or `mergeMap` in `loadEvents$` — use `switchMap` to cancel stale requests when a new filter/page/sort change arrives
- **DO NOT** create a separate `EventsState` in a new file — update the existing shell in `events.reducer.ts` that already has a basic `EventsState` interface
- **DO NOT** duplicate the error extraction logic — reuse or share the pattern from `SubmissionEffects.extractErrorMessage()`
- **DO NOT** store raw `Event` domain entities — store `EventResponse` DTOs (what the API returns)
- **DO NOT** use `@Effect()` decorator — it's removed. Use `createEffect()` factory function
- **DO NOT** use `StoreModule.forRoot()` or `EffectsModule.forRoot()` — use standalone `provideStore()` / `provideEffects()` (already configured)
- **DO NOT** use `*ngIf` or `*ngFor` — use Angular 19 `@if` and `@for` control flow syntax
- **DO NOT** forget to register `EventsEffects` in `app.config.ts` — effects won't run without registration
- **DO NOT** dispatch `loadEvents` from component `ngOnInit` — the `changeFilter$`/`changePage$`/`changeSort$` effects handle API calls. Initial load should dispatch `loadEvents` once on app initialization (or on first navigation to events view)
- **DO NOT** create a separate `index.ts` barrel file for the events store — import directly from individual files

### Implementation Patterns

#### Events Actions Pattern

```typescript
// src/frontend/src/app/store/events/events.actions.ts
import { createAction, props } from '@ngrx/store';
import { EventResponse } from '../../shared/models/event.model';
import { EventFilter } from '../../shared/models/event-filter.model';
import { PagedResult } from '../../shared/models/paged-result.model';

// Events Page actions
export const loadEvents = createAction('[Events Page] Load Events');

export const changeFilter = createAction(
  '[Events Page] Change Filter',
  props<{ filter: Partial<EventFilter> }>()
);

export const changePage = createAction(
  '[Events Page] Change Page',
  props<{ page: number; pageSize?: number }>()
);

export const changeSort = createAction(
  '[Events Page] Change Sort',
  props<{ sortBy: string; sortDir: 'asc' | 'desc' }>()
);

// Events API actions
export const loadEventsSuccess = createAction(
  '[Events API] Load Events Success',
  props<{ result: PagedResult<EventResponse> }>()
);

export const loadEventsFailure = createAction(
  '[Events API] Load Events Failure',
  props<{ error: string }>()
);
```

#### Events Reducer Pattern

```typescript
// Key state shape
export interface EventsState {
  items: EventResponse[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  filters: Partial<EventFilter>;
  pagination: { page: number; pageSize: number };
  sort: { sortBy: string; sortDir: 'asc' | 'desc' };
}

export const initialEventsState: EventsState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
  filters: {},
  pagination: { page: 1, pageSize: 20 },
  sort: { sortBy: 'createdAt', sortDir: 'desc' },
};
```

#### Events Effects Pattern (Class-based with inject — matching existing SubmissionEffects)

```typescript
@Injectable()
export class EventsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly eventService = inject(EventService);
  private readonly notificationService = inject(NotificationService);

  loadEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventsActions.loadEvents),
      withLatestFrom(this.store.select(selectEventsQueryParams)),
      switchMap(([, queryParams]) =>
        this.eventService.getAll(queryParams).pipe(
          map((result) => EventsActions.loadEventsSuccess({ result })),
          catchError((error: HttpErrorResponse) => {
            const errorMessage = this.extractErrorMessage(error);
            return of(EventsActions.loadEventsFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  changeFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventsActions.changeFilter),
      debounceTime(300),
      map(() => EventsActions.loadEvents())
    )
  );

  changePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventsActions.changePage),
      map(() => EventsActions.loadEvents())
    )
  );

  changeSort$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventsActions.changeSort),
      map(() => EventsActions.loadEvents())
    )
  );
}
```

#### Composite Selector Pattern for API Params

```typescript
export const selectEventsQueryParams = createSelector(
  selectEventsFilters,
  selectEventsPagination,
  selectEventsSort,
  (filters, pagination, sort): EventFilter => ({
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  })
);
```

#### Reducer Test Pattern (matching existing submission.reducer.spec.ts)

```typescript
describe('eventsReducer', () => {
  it('should return initial state', () => {
    const result = eventsReducer(undefined, { type: 'unknown' });
    expect(result).toEqual(initialEventsState);
  });

  it('should set loading true on loadEvents', () => {
    const result = eventsReducer(initialEventsState, EventsActions.loadEvents());
    expect(result.loading).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should reset page to 1 on changeFilter', () => {
    const stateOnPage2 = { ...initialEventsState, pagination: { page: 2, pageSize: 20 } };
    const result = eventsReducer(stateOnPage2, EventsActions.changeFilter({ filter: { userId: 'test' } }));
    expect(result.pagination.page).toBe(1);
    expect(result.filters).toEqual({ userId: 'test' });
  });
});
```

### Project Structure Notes

```
src/frontend/src/app/
├── core/services/
│   └── event.service.ts         # VERIFY — getAll() should exist from Story 3.1
├── shared/models/
│   ├── event.model.ts           # EXISTING — EventResponse, EventType, CreateEventRequest
│   ├── event-filter.model.ts    # VERIFY — should exist from Story 3.1
│   └── paged-result.model.ts    # EXISTING — PagedResult<T>
├── store/
│   ├── index.ts                 # UPDATE — EventsState import may need updating
│   ├── events/
│   │   ├── events.actions.ts    # NEW — all event store actions
│   │   ├── events.reducer.ts    # UPDATE — expand shell to full reducer with handlers
│   │   ├── events.effects.ts    # NEW — API call effects with debounce
│   │   ├── events.selectors.ts  # NEW — all events selectors
│   │   ├── events.reducer.spec.ts   # NEW — reducer unit tests
│   │   ├── events.effects.spec.ts   # NEW — effects unit tests
│   │   └── events.selectors.spec.ts # NEW — selector unit tests
│   └── submission/              # REFERENCE ONLY — follow same patterns
├── app.config.ts                # UPDATE — add EventsEffects to provideEffects()
```

**Alignment with Architecture Doc:**
- Store slices: `events/`, `submission/`, `signalr/` — matches architecture's NgRx Store Structure exactly
- Action naming: `[Source] Verb Noun` — matches architecture's Communication Patterns
- Server-side pagination: store manages query params, API does filtering — matches ADR-6
- Class-based effects with `inject()` — matches existing `SubmissionEffects` pattern

### Previous Story Intelligence

**From Story 3.1 (API GET Endpoint — in-progress, same epic):**
- Creates `EventFilter` interface in `shared/models/event-filter.model.ts` — this story DEPENDS on it
- Adds `getAll(filter: EventFilter)` to `EventService` — this story calls it from effects
- Backend `GET /api/events` accepts: `type, userId, description, from, to, page, pageSize, sortBy, sortDir` query params
- Default sort: `createdAt desc`, default page: 1, default pageSize: 20
- Response shape: `{ items: EventResponse[], totalCount: number, page: number, pageSize: number }`

**From Story 2.3 (NgRx Submission Store):**
- Established class-based effects pattern with `inject(Actions)`, `inject(EventService)`, `inject(NotificationService)`
- `switchMap` for API calls with `catchError` returning failure actions
- `extractErrorMessage()` parses server error format `{"errors": {"field": "message"}}`
- Non-dispatching effects (with `{ dispatch: false }`) for toast notifications
- `provideMockStore` + `provideMockActions` for effects testing pattern

**From Story 2.5 (Toast Notifications):**
- `NotificationService` provides `showSuccess()`, `showError()`, `showInfo()` methods
- All toasts follow Glass theme styling with color-coded left borders
- Error toasts auto-dismiss after 5 seconds, success toasts after 3 seconds

**From Story 1.6 (Angular SPA Foundation):**
- NgRx bootstrapped in `app.config.ts` with `provideStore()` and `provideEffects()`
- Store slices registered: `events: eventsReducer`, `submission: submissionReducer`, `signalr: signalrReducer`
- Currently only `SubmissionEffects` is registered in `provideEffects()`

### Git Intelligence

Recent commits follow single-story-per-commit pattern:
```
c08a0f8 feat: 2-5-form-submission-feedback-toast-notifications - Form Submission Feedback Toast Notifications
cfade28 feat: 2-4-event-creation-form-component - Event Creation Form Component
8b7f85e feat: 2-3-ngrx-submission-store-and-event-service - NgRx Submission Store & Event Service
```

Commit this story as: `feat: 3-2-ngrx-events-store-and-data-fetching - NgRx Events Store & Data Fetching`

### Latest Tech Notes

**NgRx 19 / Angular 19:**
- Class-based effects with `inject()` function remain the standard pattern — existing codebase uses this approach via `SubmissionEffects`, continue using it for consistency
- Functional effects (`createEffect(() => {...}, { functional: true })`) are available as alternative but would introduce inconsistency with existing codebase — avoid for this story
- `provideEffects()` accepts multiple effect classes: `provideEffects(SubmissionEffects, EventsEffects)` — add `EventsEffects` here
- `withLatestFrom()` from RxJS works with `store.select()` — used in `loadEvents$` to get current query params before API call
- `debounceTime(300)` from `rxjs/operators` — standard debounce for reactive filter inputs per UX spec
- `switchMap` cancels previous pending HTTP requests when new action dispatches — critical for preventing stale filter results appearing after newer ones
- `provideMockStore` from `@ngrx/store/testing` and `provideMockActions` from `@ngrx/effects/testing` for unit testing
- `provideHttpClientTesting()` for HTTP mocking in tests (not `HttpClientTestingModule`)

**RxJS Operators for Effects:**
- `switchMap` — for `loadEvents$` (cancel stale requests)
- `debounceTime(300)` — for `changeFilter$` only
- `map` — for `changePage$` and `changeSort$` (immediate dispatch)
- `withLatestFrom` — to read current store state in effect
- `catchError` — must return `of(failureAction)` to keep effect stream alive

**Testing Notes:**
- Use `jasmine-marbles` or manual subscription for testing debounceTime behavior in effects
- `provideMockStore({ initialState })` provides mock store selectors
- `overrideSelector()` on mock store to control selector output in tests
- `getTestScheduler().flush()` may be needed for marble testing of debounced effects

### Dependency Notes

**Story 3.1 (API GET Endpoint) must be complete before this story can be fully implemented.** Specifically:
- `EventFilter` interface must exist at `shared/models/event-filter.model.ts`
- `EventService.getAll()` method must exist

If Story 3.1 is not yet complete when dev begins, the developer should:
1. Check if the files exist
2. If not, implement the `EventFilter` interface and `getAll()` method as a prerequisite (refer to Story 3.1 Task 3 for exact implementation)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 State Management — NgRx Store]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6 Pagination Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Store Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Action Naming]
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Effects for Side Effects]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines rules #5, #9, #11]
- [Source: _bmad-output/planning-artifacts/prd.md#FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR16, FR17, FR31, FR32]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P2, NFR-P5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Reactive Filter Behavior — debounceTime(300ms)]
- [Source: _bmad-output/implementation-artifacts/3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination.md]
- [Source: src/frontend/src/app/store/submission/submission.effects.ts — pattern reference]
- [Source: src/frontend/src/app/store/submission/submission.actions.ts — pattern reference]
- [Source: src/frontend/src/app/store/submission/submission.reducer.ts — pattern reference]
- [Source: src/frontend/src/app/store/submission/submission.selectors.ts — pattern reference]
- [Source: src/frontend/src/app/store/events/events.reducer.ts — existing shell to update]
- [Source: src/frontend/src/app/app.config.ts — add EventsEffects registration]
- [Source: src/frontend/src/app/core/services/event.service.ts — add getAll() if missing]
- [Source: src/frontend/src/app/shared/models/event.model.ts — EventResponse, EventType]
- [Source: src/frontend/src/app/shared/models/paged-result.model.ts — PagedResult<T>]

## Change Log

- **2026-02-24:** Implemented full NgRx events store slice with actions, reducer, selectors, effects (debounced filter, immediate page/sort), registered EventsEffects in app.config.ts. Added comprehensive unit tests for reducer (12 tests), effects (7 tests), and selectors (11 tests). All 80 tests pass, build succeeds, lint clean.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- No issues encountered. Story 3.1 dependencies (EventFilter, EventService.getAll()) already existed.

### Completion Notes List

- **Task 1:** Created `events.actions.ts` with 6 actions following `[Source] Verb Noun` naming: loadEvents, loadEventsSuccess, loadEventsFailure, changeFilter, changePage, changeSort
- **Task 2:** Expanded reducer shell to full state management with EventsState interface (items, totalCount, loading, error, filters, pagination, sort) and handlers for all 6 actions. changeFilter resets page to 1, changePage preserves existing pageSize when not provided
- **Task 3:** Created `events.selectors.ts` with 9 selectors including composite `selectEventsQueryParams` that combines filters + pagination + sort into EventFilter
- **Task 4:** Created `events.effects.ts` with class-based effects matching SubmissionEffects pattern: loadEvents$ (switchMap + withLatestFrom), changeFilter$ (debounceTime 300ms), changePage$/changeSort$ (immediate), loadEventsFailure$ (non-dispatching, error toast)
- **Task 5:** Registered EventsEffects in app.config.ts alongside SubmissionEffects
- **Task 6:** Verified EventService.getAll() and EventFilter from Story 3.1 already exist
- **Tasks 7-9:** Created comprehensive unit tests: reducer (initial state, all action handlers), effects (API success/failure, debounce behavior, immediate dispatch, error toast), selectors (all individual + composite)
- **Task 10:** ng build ✅, ng test 80/80 ✅, ng lint 0 errors ✅

### File List

- `src/frontend/src/app/store/events/events.actions.ts` — NEW: NgRx actions for events store
- `src/frontend/src/app/store/events/events.reducer.ts` — MODIFIED: Expanded shell to full reducer with state management
- `src/frontend/src/app/store/events/events.selectors.ts` — NEW: All events selectors including composite query params
- `src/frontend/src/app/store/events/events.effects.ts` — NEW: Effects with debounce logic and API integration
- `src/frontend/src/app/store/events/events.reducer.spec.ts` — NEW: Reducer unit tests
- `src/frontend/src/app/store/events/events.effects.spec.ts` — NEW: Effects unit tests
- `src/frontend/src/app/store/events/events.selectors.spec.ts` — NEW: Selectors unit tests
- `src/frontend/src/app/app.config.ts` — MODIFIED: Added EventsEffects to provideEffects()
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Story status updated
- `_bmad-output/implementation-artifacts/3-2-ngrx-events-store-and-data-fetching.md` — MODIFIED: Story file updated
