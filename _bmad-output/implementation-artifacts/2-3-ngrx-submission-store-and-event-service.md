# Story 2.3: NgRx Submission Store & Event Service

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want the Angular submission NgRx store slice and EventService HTTP integration,
so that form submission state is managed predictably and API calls are centralized.

## Acceptance Criteria

1. **AC1: Submission Actions** — Given the NgRx store shell from Epic 1, when the submission store slice is implemented, then `store/submission/submission.actions.ts` contains: `submitEvent`, `submitEventSuccess`, `submitEventFailure` actions following the `[Source] Verb Noun` naming convention from the architecture doc.

2. **AC2: Submission Reducer** — Given the submission actions exist, when the reducer handles state transitions, then `store/submission/submission.reducer.ts` manages state: `{ status: 'idle' | 'submitting' | 'success' | 'failure', error: string | null }` with correct transitions: `submitEvent` → `submitting`, `submitEventSuccess` → `success`, `submitEventFailure` → `failure` with error payload.

3. **AC3: Submission Effects** — Given the submission actions and EventService exist, when `submitEvent` is dispatched, then `store/submission/submission.effects.ts` handles the side effect: calls `EventService.create()` and dispatches `submitEventSuccess` on 201 response or `submitEventFailure` on HTTP error.

4. **AC4: EventService HTTP Integration** — Given the API POST endpoint from Story 2.1 is available, when `EventService.create(request)` is called, then it sends `POST ${environment.apiUrl}/api/events` with the `CreateEventRequest` body and returns `Observable<EventResponse>`. HTTP errors are caught by the effect, not the service.

5. **AC5: TypeScript Models** — Given the backend DTOs from the Application layer, when Angular models are created, then `shared/models/` contains TypeScript interfaces matching the API contract: `CreateEventRequest`, `EventResponse`, `EventType` enum, and the service uses these types for type safety.

## Tasks / Subtasks

- [x] Task 1: Create TypeScript model interfaces (AC: #5)
  - [x] Create `src/app/shared/models/event.model.ts` with `EventType` enum (`PageView`, `Click`, `Purchase`), `CreateEventRequest` interface, `EventResponse` interface
  - [x] Create `src/app/shared/models/paged-result.model.ts` with generic `PagedResult<T>` interface (needed for Story 3.2 but defined now for completeness)
  - [x] Verify all property names use camelCase matching the API JSON response (id, userId, type, description, createdAt)

- [x] Task 2: Create EventService with HTTP POST (AC: #4)
  - [x] Create `src/app/core/services/event.service.ts` with `@Injectable({ providedIn: 'root' })`
  - [x] Inject `HttpClient` via constructor
  - [x] Import `environment` from `environments/environment` (NOT `environment.development` — Angular build system handles substitution)
  - [x] Implement `create(request: CreateEventRequest): Observable<EventResponse>` calling `POST ${environment.apiUrl}/api/events`
  - [x] Do NOT add error handling in the service — effects handle errors
  - [x] Do NOT hardcode API URLs — use `environment.apiUrl` per enforcement rule #11

- [x] Task 3: Create submission NgRx actions (AC: #1)
  - [x] Create `src/app/store/submission/submission.actions.ts`
  - [x] Define `submitEvent` action: `createAction('[Event Form] Submit Event', props<{ request: CreateEventRequest }>())`
  - [x] Define `submitEventSuccess` action: `createAction('[Events API] Submit Event Success', props<{ event: EventResponse }>())`
  - [x] Define `submitEventFailure` action: `createAction('[Events API] Submit Event Failure', props<{ error: string }>())`
  - [x] Follow `[Source] Verb Noun` naming convention per architecture doc

- [x] Task 4: Update submission reducer with action handlers (AC: #2)
  - [x] Update existing `src/app/store/submission/submission.reducer.ts` (DO NOT recreate — file exists with empty `createReducer`)
  - [x] Add `on(submitEvent, ...)` → set status to `'submitting'`, clear error
  - [x] Add `on(submitEventSuccess, ...)` → set status to `'success'`, clear error
  - [x] Add `on(submitEventFailure, ...)` → set status to `'failure'`, set error from action payload
  - [x] Preserve existing `SubmissionState` interface and `initialSubmissionState`

- [x] Task 5: Create submission effects (AC: #3)
  - [x] Create `src/app/store/submission/submission.effects.ts`
  - [x] Use class-based effects pattern (inject `Actions` and `EventService`)
  - [x] Implement `submitEvent$` effect: listen for `submitEvent` action → call `EventService.create(action.request)` → map to `submitEventSuccess` or catch error → `submitEventFailure`
  - [x] Use `switchMap` for the HTTP call (cancels previous in-flight request if new submission)
  - [x] Extract error message from HTTP error response: parse `error.error?.errors` for field-level errors (400) or use generic message for 500/network errors
  - [x] Do NOT use `{ functional: true }` — use class-based effects for consistency with architecture doc's `provideEffects(SubmissionEffects)` pattern

- [x] Task 6: Create submission selectors (AC: #2)
  - [x] Create `src/app/store/submission/submission.selectors.ts`
  - [x] Define `selectSubmissionState` feature selector
  - [x] Define `selectSubmissionStatus` → `state.status`
  - [x] Define `selectSubmissionError` → `state.error`
  - [x] Define `selectIsSubmitting` → `state.status === 'submitting'`

- [x] Task 7: Update app.config.ts with effects provider (AC: #3)
  - [x] Update existing `src/app/app.config.ts` (DO NOT recreate)
  - [x] Add `provideEffects(SubmissionEffects)` to providers array
  - [x] Import `SubmissionEffects` from `./store/submission/submission.effects`
  - [x] Keep existing `provideStore`, `provideHttpClient`, `provideStoreDevtools`, `provideAnimationsAsync` unchanged

- [x] Task 8: Write unit tests (AC: #1, #2, #3, #4, #5)
  - [x] Create `src/app/store/submission/submission.reducer.spec.ts` — test all state transitions: idle→submitting, submitting→success, submitting→failure, unknown action returns current state
  - [x] Create `src/app/core/services/event.service.spec.ts` — test create() sends POST to correct URL with correct body, uses `HttpClientTestingModule`
  - [x] Create `src/app/store/submission/submission.effects.spec.ts` — test effect dispatches success/failure actions, uses `provideMockActions` and mock EventService

- [x] Task 9: Build verification (AC: #1, #2, #3, #4, #5)
  - [x] Run `ng build` — verify 0 errors
  - [x] Run `ng test --watch=false` — verify all tests pass
  - [x] Run `ng lint` — verify 0 linting errors (if ESLint configured)

## Dev Notes

### Critical Context — What This Story Does

This is the **third story in Epic 2** (Event Submission Pipeline). It implements the **Angular frontend state management and HTTP integration** for event submission. This is the first Angular implementation story in Epic 2 — Stories 2.1 and 2.2 were backend-only. This story creates the NgRx plumbing that Story 2.4 (Event Creation Form Component) will consume.

**Data flow for this story:**
```
NgRx Store dispatch [Event Form] Submit Event
  → SubmissionEffects.submitEvent$
    → EventService.create(request)
      → HTTP POST ${environment.apiUrl}/api/events
        → API returns 201 Created with EventResponse
      → dispatch [Events API] Submit Event Success
    OR
      → HTTP error (400/500/network)
      → dispatch [Events API] Submit Event Failure with error message
  → Reducer updates submission state (idle → submitting → success/failure)
```

**What this story DOES NOT do:**
- Does NOT create the form UI (that's Story 2.4)
- Does NOT create toast notifications (that's Story 2.5)
- Does NOT implement the events list/table store (that's Story 3.2)
- Does NOT integrate SignalR (that's Story 4.2)

### What Already Exists (DO NOT Recreate)

The Angular foundation is complete from Epic 1. These files exist and are FUNCTIONAL:

| Component | File | Status |
|-----------|------|--------|
| App config | `src/frontend/src/app/app.config.ts` | EXISTS — provideStore with 3 reducers, provideHttpClient, provideStoreDevtools, provideAnimationsAsync. **NO provideEffects yet** |
| Store root state | `src/frontend/src/app/store/index.ts` | EXISTS — `AppState` interface with events, submission, signalr slices |
| Submission reducer | `src/frontend/src/app/store/submission/submission.reducer.ts` | EXISTS — `SubmissionState` interface, `initialSubmissionState`, EMPTY `createReducer` (no action handlers) |
| Events reducer | `src/frontend/src/app/store/events/events.reducer.ts` | EXISTS — `EventsState` interface, EMPTY `createReducer` |
| SignalR reducer | `src/frontend/src/app/store/signalr/signalr.reducer.ts` | EXISTS — `SignalrState` interface, EMPTY `createReducer` |
| Environment (dev) | `src/frontend/src/environments/environment.development.ts` | EXISTS — `apiUrl: 'https://localhost:5001'` |
| Environment (prod) | `src/frontend/src/environments/environment.ts` | EXISTS — `apiUrl: 'https://production-api.com'` |
| Package.json | `src/frontend/package.json` | EXISTS — `@ngrx/effects@^19.2.1`, `@ngrx/store@^19.2.1`, `@ngrx/store-devtools@^19.2.1` all installed |
| Glass panel | `src/frontend/src/app/shared/components/glass-panel/` | EXISTS — standalone component with ng-content |
| App component | `src/frontend/src/app/app.component.ts` | EXISTS — shell with header + main area |
| HttpClient | `src/frontend/src/app/app.config.ts` | EXISTS — `provideHttpClient(withInterceptors([]))` already configured |

**DO NOT:** Recreate existing files, modify `EventsState` or `SignalrState` (those are other stories), or add interceptors (those are later stories).

**DO:** Create new files for actions, effects, selectors, service, and models. Update existing reducer to add action handlers. Update existing app.config.ts to add provideEffects.

### Architecture Patterns & Constraints

**MUST FOLLOW — Enforcement Rules relevant to this story:**

- **Rule #1:** Follow file naming conventions exactly — kebab-case for Angular files. `event.service.ts`, `submission.actions.ts`, `submission.effects.ts`, `event.model.ts`
- **Rule #5:** Use NgRx actions for all state mutations — never modify store directly. All submission state changes go through actions → reducer.
- **Rule #9:** Use `provideStore()` / `provideEffects()` / `provideHttpClient(withInterceptors([...]))` — NEVER legacy `StoreModule.forRoot()` or `HTTP_INTERCEPTORS` provider. **`provideEffects(SubmissionEffects)` must be added to app.config.ts**.
- **Rule #11:** Use `environment.ts` / `environment.prod.ts` for API URL configuration — never hardcode URLs in services. EventService must use `environment.apiUrl`.
- **Rule #12:** Place SCSS tokens in `src/styles/_variables.scss` — never inline magic color values. (Not directly relevant to this story but important context.)

**NgRx Action Naming Convention (from architecture doc):**
```typescript
// Pattern: [Source] Verb Noun
'[Event Form] Submit Event'        // Source: Event Form component
'[Events API] Submit Event Success' // Source: Events API (HTTP response)
'[Events API] Submit Event Failure' // Source: Events API (HTTP error)
```

**Architecture doc specifies class-based Effects pattern:**
```typescript
// architecture.md shows: provideEffects(EventsEffects, SubmissionEffects, SignalrEffects)
// This means class-based effects, NOT functional effects
```

### Implementation Patterns

**EventService Pattern:**
```typescript
@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(request: CreateEventRequest): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.apiUrl}/api/events`, request);
  }
}
```

**Key decisions:**
1. `inject(HttpClient)` — modern Angular DI pattern (preferred over constructor injection in Angular 19)
2. NO error handling in service — effects catch errors via `catchError` in the effect pipe
3. `environment.apiUrl` — imported from `environments/environment` (NOT `environment.development`)
4. Return type is `Observable<EventResponse>` — typed with our model interface

**Submission Actions Pattern:**
```typescript
import { createAction, props } from '@ngrx/store';
import { CreateEventRequest } from '../../shared/models/event.model';
import { EventResponse } from '../../shared/models/event.model';

export const submitEvent = createAction(
  '[Event Form] Submit Event',
  props<{ request: CreateEventRequest }>()
);

export const submitEventSuccess = createAction(
  '[Events API] Submit Event Success',
  props<{ event: EventResponse }>()
);

export const submitEventFailure = createAction(
  '[Events API] Submit Event Failure',
  props<{ error: string }>()
);
```

**Submission Reducer Update Pattern:**
```typescript
// UPDATE existing file — add on() handlers to the EMPTY createReducer
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
```

**Submission Effects Pattern:**
```typescript
@Injectable()
export class SubmissionEffects {
  private readonly actions$ = inject(Actions);
  private readonly eventService = inject(EventService);

  submitEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SubmissionActions.submitEvent),
      switchMap(({ request }) =>
        this.eventService.create(request).pipe(
          map((event) => SubmissionActions.submitEventSuccess({ event })),
          catchError((error) => {
            const errorMessage = this.extractErrorMessage(error);
            return of(SubmissionActions.submitEventFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.errors) {
      // 400: field-level errors → combine into single message
      const errors = error.error.errors;
      return Object.entries(errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('; ');
    }
    if (error.status === 0) {
      return 'Connection error. Check your network.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
```

**Key decisions:**
1. `switchMap` — cancels previous request if user submits again rapidly. This is correct because only the latest submission matters.
2. Error extraction handles 3 cases: 400 (field errors), network errors (status 0), and 500 (generic message) — matches the toast requirements from Story 2.5.
3. Class-based effects with `inject()` pattern — per architecture doc's `provideEffects(SubmissionEffects)`.

**TypeScript Models Pattern:**
```typescript
// event.model.ts
export enum EventType {
  PageView = 'PageView',
  Click = 'Click',
  Purchase = 'Purchase',
}

export interface CreateEventRequest {
  userId: string;
  type: EventType;
  description: string;
}

export interface EventResponse {
  id: string;       // GUID as string
  userId: string;
  type: EventType;
  description: string;
  createdAt: string; // ISO 8601 UTC string
}
```

**Key decisions:**
1. `EventType` uses string enum — matches API's `JsonStringEnumConverter` (Story 2.1 added this)
2. `id` is `string` not `Guid` — TypeScript has no native GUID type, API returns as string
3. `createdAt` is `string` — ISO 8601 format from API, parsed by component when needed
4. Property names are camelCase — matches API JSON serialization (System.Text.Json default)

### API Contract Reference

**POST /api/events** (implemented in Story 2.1):

Request:
```json
{
  "userId": "olena",
  "type": "PageView",
  "description": "Viewed homepage"
}
```

Success Response (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "olena",
  "type": "PageView",
  "description": "Viewed homepage",
  "createdAt": "2026-02-23T14:30:00Z"
}
```

Error Response (400 Bad Request):
```json
{
  "errors": {
    "userId": "The UserId field is required.",
    "type": "The field Type is invalid."
  }
}
```

Error Response (500 Internal Server Error):
```json
{
  "errors": {
    "server": "An unexpected error occurred."
  }
}
```

### Testing Strategy

**Unit tests (Karma + Jasmine):**

| Test File | What it Verifies | Setup |
|-----------|-----------------|-------|
| `submission.reducer.spec.ts` | State transitions: idle→submitting→success, idle→submitting→failure, unknown action returns same state | Direct reducer function calls with actions |
| `event.service.spec.ts` | `create()` sends POST to correct URL with correct body | `HttpClientTestingModule`, `HttpTestingController` |
| `submission.effects.spec.ts` | Effect dispatches `submitEventSuccess` on success, `submitEventFailure` on HTTP error | `provideMockActions`, mock `EventService` with jasmine spy |

**Reducer test pattern:**
```typescript
describe('submissionReducer', () => {
  it('should set status to submitting on submitEvent', () => {
    const action = submitEvent({ request: mockRequest });
    const state = submissionReducer(initialSubmissionState, action);
    expect(state.status).toBe('submitting');
    expect(state.error).toBeNull();
  });
});
```

**Service test pattern:**
```typescript
describe('EventService', () => {
  it('should POST to /api/events', () => {
    service.create(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(`${environment.apiUrl}/api/events`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });
});
```

**Effects test pattern:**
```typescript
describe('SubmissionEffects', () => {
  it('should dispatch submitEventSuccess on successful API call', () => {
    actions$ = hot('-a', { a: submitEvent({ request: mockRequest }) });
    eventService.create.and.returnValue(cold('-b', { b: mockResponse }));

    const expected = cold('--c', { c: submitEventSuccess({ event: mockResponse }) });
    expect(effects.submitEvent$).toBeObservable(expected);
  });
});
```

### Previous Story Intelligence

**From Story 2.1 (API POST Endpoint & Server-Side Validation):**
- `JsonStringEnumConverter` was added to API `Program.cs` — enums serialize as strings (`"PageView"`, not `0`). Angular `EventType` string enum must match these exact string values.
- Validation returns `{"errors": {"field": "message"}}` format — the effects `extractErrorMessage` must parse this structure.
- `CreatedAtAction(null, ...)` returns 201 — HttpClient will receive this as a successful response with body.
- API runs on `https://localhost:5001` — matches `environment.development.ts` setting.

**From Story 2.2 (Azure Function Event Processing & DB Persistence):**
- Backend write path is complete: API → Service Bus → Function → Azure SQL. After this story, the full E2E path from Angular form to DB persistence will be functional (minus the actual form UI from Story 2.4).
- 29 backend tests passing (16 API + 13 Function) — no regressions expected from frontend changes.

**From Story 1.6 (Angular SPA Foundation & Glass Theme):**
- NgRx store bootstrapped with empty reducers — this story fills in the submission slice.
- `provideHttpClient(withInterceptors([]))` already configured — HttpClient is ready to use.
- Environment files configured with correct API URLs.
- Angular Material installed and configured — available for future form components.
- `@ngrx/effects` package installed but `provideEffects()` NOT yet in app.config.ts — **this story must add it**.

### Git Intelligence

Recent commit pattern:
```
06b9ff0 feat: 2-2-azure-function-event-processing-and-db-persistence - Azure Function Event Processing & DB Persistence
4702042 feat: 2-1-api-post-endpoint-and-server-side-validation - API POST Endpoint & Server-Side Validation
b6db634 feat: 1-6-angular-spa-foundation-and-glass-theme - Angular SPA Foundation & Glass Theme
```

- Branch naming: `feature/{story-key}`
- Commit message: `feat: {story-key} - {story title}`
- Most recent Angular changes were in Story 1.6 — store shell, styling, glass panel component.
- This is the **first Angular implementation story in Epic 2** — all prior Epic 2 work was backend-only.

### Latest Technical Specifics

- **Angular 19.2.0 LTS** — Standalone components default. `inject()` function preferred over constructor injection. No breaking changes since Story 1.6.
- **NgRx 19.2.1** — Compatible with Angular 19. `createAction`, `createReducer`, `createEffect`, `createFeatureSelector`, `createSelector` are the standard APIs. Class-based effects with `inject()` pattern are fully supported. Functional effects (`{ functional: true }`) also available but architecture doc specifies class-based.
- **RxJS 7.8** — `switchMap`, `map`, `catchError`, `of` all standard. `hot`/`cold` from `jasmine-marbles` for effect testing.
- **HttpClient** — `provideHttpClient(withInterceptors([]))` already configured. `HttpClient.post<T>()` returns `Observable<T>` with automatic JSON deserialization.
- **Karma + Jasmine** — Angular 19 default test runner. `HttpClientTestingModule` for service tests. `provideMockActions` from `@ngrx/effects/testing` for effects tests. `provideMockStore` from `@ngrx/store/testing` for component tests.

### Project Structure Notes

**Files to CREATE:**
```
src/frontend/src/app/
  shared/
    models/
      event.model.ts                          ← NEW (EventType enum, CreateEventRequest, EventResponse interfaces)
      paged-result.model.ts                   ← NEW (PagedResult<T> generic interface for Story 3.2 readiness)
  core/
    services/
      event.service.ts                        ← NEW (HttpClient POST to API)
  store/
    submission/
      submission.actions.ts                   ← NEW (submitEvent, submitEventSuccess, submitEventFailure)
      submission.effects.ts                   ← NEW (submitEvent$ effect with EventService.create())
      submission.selectors.ts                 ← NEW (selectSubmissionStatus, selectSubmissionError, selectIsSubmitting)
```

**Files to MODIFY:**
```
src/frontend/src/app/
  store/
    submission/
      submission.reducer.ts                   ← MODIFY (add on() action handlers to existing empty createReducer)
  app.config.ts                               ← MODIFY (add provideEffects(SubmissionEffects) to providers)
```

**Files to CREATE (tests):**
```
src/frontend/src/app/
  store/
    submission/
      submission.reducer.spec.ts              ← NEW (reducer state transition tests)
      submission.effects.spec.ts              ← NEW (effect dispatching tests)
  core/
    services/
      event.service.spec.ts                   ← NEW (HTTP POST test with HttpClientTestingModule)
```

**Files NOT to modify:**
```
src/frontend/src/app/store/events/            ← No changes (Story 3.2 scope)
src/frontend/src/app/store/signalr/           ← No changes (Story 4.2 scope)
src/frontend/src/app/store/index.ts           ← No changes (AppState already has submission slice)
src/frontend/src/app/shared/components/       ← No changes
src/frontend/src/environments/                ← No changes (URLs already correct)
src/frontend/src/styles/                      ← No changes
src/EventHub.Api/                             ← No changes (backend story)
src/EventHub.Function/                        ← No changes (backend story)
src/EventHub.Domain/                          ← No changes
src/EventHub.Application/                     ← No changes
src/EventHub.Infrastructure/                  ← No changes
tests/                                        ← No changes (.NET tests)
```

**Alignment with architecture doc:** Fully aligned. NgRx store structure matches `architecture.md § Frontend Architecture`. Action naming matches `architecture.md § Communication Patterns`. File structure matches `architecture.md § Structure Patterns`. No conflicts detected.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — NgRx Store structure, ADR-5 (NgRx decision), store slices, effects pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — NgRx action naming convention `[Source] Verb Noun`, action examples
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Angular project structure, store directory layout, services location
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — 14 enforcement rules (especially #5 NgRx, #9 provideEffects, #11 environment.apiUrl)
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — API response JSON examples (201 success, 400 error, 500 error)
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Error handling per layer (Angular HTTP), loading states
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Strategy] — Karma + Jasmine, HttpClientTestingModule, provideMockStore
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — Acceptance criteria, user story, BDD scenarios
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] — FR1 (submit event), FR5 (prevent invalid submission), FR15 (POST returns Id)
- [Source: _bmad-output/implementation-artifacts/2-1-api-post-endpoint-and-server-side-validation.md] — Previous story: API POST endpoint, JsonStringEnumConverter, error response format
- [Source: _bmad-output/implementation-artifacts/2-2-azure-function-event-processing-and-db-persistence.md] — Previous story: Backend write path complete, 29 tests passing
- [Source: src/frontend/src/app/app.config.ts] — Current config: provideStore, provideHttpClient, NO provideEffects
- [Source: src/frontend/src/app/store/submission/submission.reducer.ts] — Current empty reducer shell
- [Source: src/frontend/src/app/store/index.ts] — AppState interface with SubmissionState
- [Source: src/frontend/src/environments/environment.development.ts] — apiUrl: 'https://localhost:5001'
- [Source: src/frontend/package.json] — @ngrx/effects@^19.2.1 installed

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Lint fix: Changed `ReplaySubject<any>` to `ReplaySubject<Action>` in effects spec to satisfy `@typescript-eslint/no-explicit-any`

### Completion Notes List

- Task 1: Created `event.model.ts` with `EventType` string enum (PageView, Click, Purchase), `CreateEventRequest`, `EventResponse` interfaces; created `paged-result.model.ts` with generic `PagedResult<T>`. All property names camelCase matching API contract.
- Task 2: Created `event.service.ts` with `@Injectable({ providedIn: 'root' })`, `inject(HttpClient)` pattern, `environment.apiUrl` for URL config, no error handling in service.
- Task 3: Created `submission.actions.ts` with `submitEvent`, `submitEventSuccess`, `submitEventFailure` actions following `[Source] Verb Noun` convention.
- Task 4: Updated existing `submission.reducer.ts` — added `on()` handlers for all 3 actions with correct state transitions. Preserved existing `SubmissionState` interface and `initialSubmissionState`.
- Task 5: Created `submission.effects.ts` with class-based `SubmissionEffects` using `inject()` pattern, `switchMap` for HTTP call, `extractErrorMessage()` handling 400 field errors, network errors (status 0), and 500 generic errors.
- Task 6: Created `submission.selectors.ts` with `selectSubmissionState`, `selectSubmissionStatus`, `selectSubmissionError`, `selectIsSubmitting` selectors.
- Task 7: Updated `app.config.ts` — added `provideEffects(SubmissionEffects)` to providers (replaced empty `provideEffects([])`).
- Task 8: Created 3 test files — reducer spec (5 tests: unknown action, submitEvent, clear previous error, success, failure), service spec (3 tests: created, POST correct URL/body, response types), effects spec (4 tests: success dispatch, 400 field errors, 500 generic, network error).
- Task 9: Build verification — `ng build` 0 errors, `ng test --watch=false` 21/21 SUCCESS, `ng lint` all files pass.

### Change Log

- 2026-02-23: Implemented NgRx submission store slice and EventService HTTP integration — all 9 tasks completed, 21 tests passing, 0 lint errors.

### File List

New files:
- src/frontend/src/app/shared/models/event.model.ts
- src/frontend/src/app/shared/models/paged-result.model.ts
- src/frontend/src/app/core/services/event.service.ts
- src/frontend/src/app/store/submission/submission.actions.ts
- src/frontend/src/app/store/submission/submission.effects.ts
- src/frontend/src/app/store/submission/submission.selectors.ts
- src/frontend/src/app/store/submission/submission.reducer.spec.ts
- src/frontend/src/app/store/submission/submission.effects.spec.ts
- src/frontend/src/app/core/services/event.service.spec.ts

Modified files:
- src/frontend/src/app/store/submission/submission.reducer.ts
- src/frontend/src/app/app.config.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/2-3-ngrx-submission-store-and-event-service.md
