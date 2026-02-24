# Story 4.2: Angular SignalR Service & NgRx Integration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want the application to maintain a persistent SignalR connection and automatically refresh the table when new events arrive,
so that I see live data without manual page refresh.

## Acceptance Criteria

1. **Given** the Angular app initializes, **When** `SignalRService` starts, **Then** it negotiates a connection via `POST ${environment.apiUrl}/api/negotiate`, establishes a WebSocket connection to Azure SignalR Service, and dispatches `[SignalR] Connected` NgRx action.

2. **Given** an active SignalR connection, **When** a `newEvent` message is received from the server, **Then** `SignalRService` dispatches `[SignalR] Event Received` NgRx action with the event payload, and the `signalr` effect checks if the user is on page 1: if yes, dispatches `loadEvents` to re-fetch current data.

3. **Given** the SignalR connection drops unexpectedly, **When** the client detects disconnect, **Then** it dispatches `[SignalR] Reconnecting` and attempts automatic reconnection with exponential backoff intervals: 0s, 2s, 10s, 30s (NFR-I3). On successful reconnect, dispatches `[SignalR] Connected`. On permanent failure, dispatches `[SignalR] Disconnected`.

4. **Given** the NgRx `signalr` store slice, **When** connection status changes, **Then** the reducer updates `connectionStatus: 'connected' | 'reconnecting' | 'disconnected'`.

## Tasks / Subtasks

- [x] Task 1: Install `@microsoft/signalr` npm package (AC: #1)
  - [x] 1.1 Run `npm install @microsoft/signalr` in `src/frontend/`
  - [x] 1.2 Verify package appears in `package.json` dependencies

- [x] Task 2: Create `SignalRService` in `core/services/signalr.service.ts` (AC: #1, #2, #3)
  - [x] 2.1 Create `SignalRService` as `@Injectable({ providedIn: 'root' })`
  - [x] 2.2 Build `HubConnection` using `HubConnectionBuilder().withUrl("${environment.apiUrl}/api").withAutomaticReconnect([0, 2000, 10000, 30000]).build()`
  - [x] 2.3 Register `onreconnecting` callback to dispatch `signalrReconnecting` action
  - [x] 2.4 Register `onreconnected` callback to dispatch `signalrConnected` action
  - [x] 2.5 Register `onclose` callback to dispatch `signalrDisconnected` action
  - [x] 2.6 Register `connection.on("newEvent", ...)` handler to dispatch `signalrEventReceived` action
  - [x] 2.7 Implement `startConnection()` method that calls `connection.start()` and dispatches `signalrConnected` on success
  - [x] 2.8 Implement `stopConnection()` method for cleanup

- [x] Task 3: Create NgRx signalr actions in `store/signalr/signalr.actions.ts` (AC: #1, #2, #3, #4)
  - [x] 3.1 `signalrConnected = createAction('[SignalR] Connected')`
  - [x] 3.2 `signalrDisconnected = createAction('[SignalR] Disconnected')`
  - [x] 3.3 `signalrReconnecting = createAction('[SignalR] Reconnecting')`
  - [x] 3.4 `signalrEventReceived = createAction('[SignalR] Event Received', props<{ event: EventResponse }>())`

- [x] Task 4: Update signalr reducer in `store/signalr/signalr.reducer.ts` (AC: #4)
  - [x] 4.1 Add `on(signalrConnected)` handler setting `connectionStatus: 'connected'`
  - [x] 4.2 Add `on(signalrReconnecting)` handler setting `connectionStatus: 'reconnecting'`
  - [x] 4.3 Add `on(signalrDisconnected)` handler setting `connectionStatus: 'disconnected'`

- [x] Task 5: Create signalr selectors in `store/signalr/signalr.selectors.ts` (AC: #4)
  - [x] 5.1 `selectSignalrState` feature selector
  - [x] 5.2 `selectConnectionStatus` selector
  - [x] 5.3 `selectIsConnected` derived selector

- [x] Task 6: Create signalr effects in `store/signalr/signalr.effects.ts` (AC: #2)
  - [x] 6.1 `eventReceived$` effect: on `signalrEventReceived`, check if user is on page 1 via `selectEventsPagination`, if yes dispatch `loadEvents`
  - [x] 6.2 Register `SignalrEffects` in `app.config.ts` `provideEffects()`

- [x] Task 7: Initialize SignalR connection on app startup (AC: #1)
  - [x] 7.1 Inject `SignalRService` in `AppComponent` and call `startConnection()` in `ngOnInit` (or use `APP_INITIALIZER`)

- [x] Task 8: Unit tests (AC: #1, #2, #3, #4)
  - [x] 8.1 `signalr.reducer.spec.ts` — test all state transitions
  - [x] 8.2 `signalr.effects.spec.ts` — test `eventReceived$` effect dispatches `loadEvents` when on page 1 and does NOT dispatch when on page 2+
  - [x] 8.3 `signalr.service.spec.ts` — test connection lifecycle, event handling, reconnection callbacks
  - [x] 8.4 Verify `ng build` succeeds with zero errors

## Dev Notes

### Architecture Patterns & Constraints

- **ADR-3: Azure SignalR Service (Serverless)** — The API only serves the negotiate endpoint; it does NOT host a Hub. The Function sends messages via output binding. The Angular client connects directly to Azure SignalR Service after negotiation.
- **Enforcement rule #5:** Use NgRx actions for ALL state mutations — never modify store directly. All connection status changes and event receipts MUST go through NgRx actions.
- **Enforcement rule #9:** Use `provideStore()` / `provideEffects()` / `provideHttpClient(withInterceptors([...]))` — never legacy patterns. Register `SignalrEffects` via `provideEffects()` in `app.config.ts`.
- **Enforcement rule #11:** Use `environment.ts` / `environment.prod.ts` for API URL configuration — never hardcode URLs in services. The negotiate URL is derived from `environment.apiUrl`.
- **Enforcement rule #12:** Place SCSS tokens in `src/styles/_variables.scss` — no inline magic values.
- **NFR-I3:** Reconnection with exponential backoff: `[0, 2000, 10000, 30000]` ms intervals.
- **NFR-P3:** SignalR notification must arrive within 1 second of DB write.
- **NFR-P4:** Full E2E pipeline latency (form submit → DB persist → live table update) must not exceed 3 seconds.

### Critical Implementation Details

#### SignalR Client Connection Pattern (Azure Serverless)

```typescript
import * as signalR from '@microsoft/signalr';

// CRITICAL: Pass the base URL WITHOUT /negotiate — SDK appends it automatically
const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${environment.apiUrl}/api`)  // SDK calls POST /api/negotiate
  .withAutomaticReconnect([0, 2000, 10000, 30000])
  .build();
```

**Hub name:** `"eventHub"` — embedded in the negotiate response URL from Azure SignalR Service. The client does NOT specify the hub name directly; it's part of the connection info returned by negotiate.

**SignalR event target:** `"newEvent"` — server to client, payload is full `Event` object (`{ id, userId, type, description, createdAt }`).

#### NgRx Integration Pattern

The `SignalRService` should inject `Store` and dispatch actions directly from SignalR callbacks:

```typescript
// In SignalRService constructor or init method:
this.connection.on('newEvent', (event: EventResponse) => {
  this.store.dispatch(signalrEventReceived({ event }));
});

this.connection.onreconnecting(() => {
  this.store.dispatch(signalrReconnecting());
});

this.connection.onreconnected(() => {
  this.store.dispatch(signalrConnected());
});

this.connection.onclose(() => {
  this.store.dispatch(signalrDisconnected());
});
```

#### Effect: Re-fetch on Page 1 Only

```typescript
eventReceived$ = createEffect(() =>
  this.actions$.pipe(
    ofType(signalrEventReceived),
    withLatestFrom(this.store.select(selectEventsPagination)),
    filter(([, pagination]) => pagination.page === 1),
    map(() => loadEvents())
  )
);
```

When the user is on page 2+, the event is received but no re-fetch occurs. Story 4.5 will add toast notification for this case.

### Critical Anti-Patterns to Avoid

- **DO NOT** use `HttpClient` for the SignalR connection — use `@microsoft/signalr` `HubConnectionBuilder` directly. The SignalR client handles its own HTTP/WebSocket transport.
- **DO NOT** create a Hub class or use `AddSignalR()` in the API — ADR-3 serverless mode means no Hub.
- **DO NOT** hardcode `"https://localhost:5001/api"` in `SignalRService` — use `environment.apiUrl` (enforcement rule #11).
- **DO NOT** manually manage WebSocket connections — `@microsoft/signalr` handles transport negotiation, fallback (WebSocket → SSE → Long Polling), and reconnection.
- **DO NOT** call `loadEvents` on every `newEvent` regardless of page — only re-fetch when user is on page 1.
- **DO NOT** store the received event directly in NgRx items array — always re-fetch from API to maintain server-side sorting/pagination consistency.
- **DO NOT** use `connection.start()` inside a constructor — defer to `ngOnInit` or `APP_INITIALIZER` to ensure DI is fully resolved.
- **DO NOT** forget to call `connection.stop()` on app destroy — implement `ngOnDestroy` in AppComponent to clean up.

### E2E Data Flow (Real-Time Path)

```
Azure Function ProcessEvent returns SignalRMessageAction("newEvent", eventData)
  → Azure SignalR Service broadcasts to all connected clients
    → Angular SignalRService.connection.on("newEvent") fires
      → store.dispatch(signalrEventReceived({ event }))
        → SignalrEffects.eventReceived$ checks pagination
          → If page 1: dispatch loadEvents → EventService.getAll() → API GET /api/events
            → Table updates with fresh data including the new event
          → If page 2+: no action (Story 4.5 will add toast)
```

### Project Structure Notes

#### Files to CREATE:

| File | Purpose |
|------|---------|
| `src/frontend/src/app/core/services/signalr.service.ts` | SignalR WebSocket connection management |
| `src/frontend/src/app/core/services/signalr.service.spec.ts` | Unit tests for SignalRService |
| `src/frontend/src/app/store/signalr/signalr.actions.ts` | NgRx action definitions |
| `src/frontend/src/app/store/signalr/signalr.selectors.ts` | NgRx selectors |
| `src/frontend/src/app/store/signalr/signalr.effects.ts` | NgRx effects (re-fetch logic) |
| `src/frontend/src/app/store/signalr/signalr.effects.spec.ts` | Unit tests for effects |
| `src/frontend/src/app/store/signalr/signalr.reducer.spec.ts` | Unit tests for reducer |

#### Files to MODIFY:

| File | Change |
|------|--------|
| `src/frontend/src/app/store/signalr/signalr.reducer.ts` | Add `on()` handlers for connected/reconnecting/disconnected actions |
| `src/frontend/src/app/app.config.ts` | Add `SignalrEffects` to `provideEffects()` |
| `src/frontend/src/app/app.component.ts` | Inject `SignalRService`, call `startConnection()` in `ngOnInit`, `stopConnection()` in `ngOnDestroy` |
| `src/frontend/package.json` | Add `@microsoft/signalr` dependency (via npm install) |

#### Files NOT to touch:

| File | Reason |
|------|--------|
| `src/frontend/src/app/store/events/*` | Events store slice is complete from Story 3.2 — no changes needed |
| `src/frontend/src/app/store/submission/*` | Submission store is complete from Story 2.3 |
| `src/frontend/src/app/core/services/event.service.ts` | HTTP service is complete — SignalR uses a separate service |
| Any `.NET` backend files | Story 4.1 handles all backend SignalR work |

### Library & Framework Requirements

| Package | Version | Purpose |
|---------|---------|---------|
| `@microsoft/signalr` | `^10.0.0` (latest stable) | SignalR JavaScript client for Azure SignalR Service serverless |
| `@ngrx/store` | `19.2.1` (already installed) | State management |
| `@ngrx/effects` | `19.2.1` (already installed) | Side effect management |
| `@angular/core` | `19.2.x` (already installed) | Framework |
| `rxjs` | `7.8.x` (already installed) | Reactive extensions |

### Testing Requirements

**Framework:** Karma + Jasmine (Angular convention, already configured)

**Test files to create:**

1. **`signalr.reducer.spec.ts`** — Test state transitions:
   - Initial state is `{ connectionStatus: 'disconnected' }`
   - `signalrConnected` action → `connectionStatus: 'connected'`
   - `signalrReconnecting` action → `connectionStatus: 'reconnecting'`
   - `signalrDisconnected` action → `connectionStatus: 'disconnected'`
   - Unknown action returns unchanged state

2. **`signalr.effects.spec.ts`** — Test effects with `provideMockStore`:
   - `eventReceived$`: when on page 1, dispatches `loadEvents`
   - `eventReceived$`: when on page 2, does NOT dispatch `loadEvents`
   - Use `provideMockActions` and `provideMockStore` with overridden selectors

3. **`signalr.service.spec.ts`** — Test SignalR service:
   - Mock `HubConnectionBuilder` and `HubConnection`
   - Verify `startConnection()` calls `connection.start()`
   - Verify `on("newEvent")` callback dispatches correct action
   - Verify reconnection callbacks dispatch correct actions
   - Verify `stopConnection()` calls `connection.stop()`

**Mock strategy:** Use `provideMockStore` for NgRx, mock `HubConnection` object for SignalR. Do NOT attempt to create real SignalR connections in tests.

### Previous Story Intelligence (Story 4.1)

**Key learnings from Story 4.1 that impact this story:**

- Story 4.1 established the server-side SignalR infrastructure: `ProcessEvent` returns `SignalRMessageAction` with target `"newEvent"` and the full `Event` object.
- The negotiate endpoint is at `POST /api/negotiate` in `NegotiateController`, using `ServiceManager` from `Microsoft.Azure.SignalR.Management`.
- Hub name is `"eventHub"` — this is embedded in the negotiate response, so the Angular client does NOT need to specify it.
- `AzureSignalRConnectionString` is configured in both `appsettings.json` (API) and `local.settings.json` (Function).
- Story 1.6 created the `signalr` NgRx store slice stub with only `SignalrState` interface and empty reducer — this story populates it fully.
- The `app.component.html` already has a `<span class="signalr-placeholder">` in the header — Story 4.3 will replace this with `SignalRStatusDotComponent`.

### Git Intelligence

**Recent commit pattern:** `feat: {story-key} - {Story Title}`

**Last 5 commits (Epic 3 completion):**
- `56f99ec` feat: 3-6-loading-and-empty-states - Loading & Empty States
- `ef6926e` feat: 3-5-events-filter-bar-and-reactive-filtering - Events Filter Bar & Reactive Filtering
- `99d4596` feat: 3-4-event-type-chip-component - EventTypeChip Component
- `ce3df04` feat: 3-3-events-table-component - Events Table Component
- `3f6c3db` feat: 3-2-ngrx-events-store-and-data-fetching - NgRx Events Store & Data Fetching

**Patterns established:**
- NgRx slice pattern: `actions.ts` → `reducer.ts` → `effects.ts` → `selectors.ts` (all in `store/{slice}/`)
- Services use `inject()` function, not constructor injection
- Effects use `createEffect(() => ...)` with `inject(Actions)` pattern
- All effects classes are `@Injectable()` with field injection via `inject()`
- Tests co-located as `*.spec.ts` files
- `app.config.ts` uses standalone `provideStore()` / `provideEffects()` pattern

### Latest Technical Information

- **`@microsoft/signalr` v10.0.0** is the latest stable version (published ~Nov 2025). It is compatible with Azure SignalR Service serverless mode.
- The SignalR JS client auto-appends `/negotiate` to the URL passed to `withUrl()`. For our architecture with negotiate at `/api/negotiate`, pass `"${environment.apiUrl}/api"`.
- `withAutomaticReconnect([0, 2000, 10000, 30000])` matches NFR-I3 exactly — 4 retry attempts with increasing delays, then stops.
- The client fires `onreconnecting` before each retry, `onreconnected` on success, and `onclose` after all retries are exhausted.
- For Azure SignalR Service serverless mode, the client does NOT specify a hub name — it's part of the negotiate response URL.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-3] — Azure SignalR Service serverless decision
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Store Structure] — signalr state interface
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — SignalR action naming
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rules #5, #9, #11
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow] — Complete E2E real-time path
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — Acceptance criteria and requirements
- [Source: _bmad-output/planning-artifacts/prd.md#FR13-FR14] — Live event appearance requirements
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-I3] — Reconnection backoff requirement
- [Source: _bmad-output/implementation-artifacts/4-1-azure-function-signalr-output-binding-and-negotiate-endpoint.md] — Server-side SignalR setup, hub name, anti-patterns
- [Source: @microsoft/signalr npm] — v10.0.0 latest stable, HubConnectionBuilder API
- [Source: Microsoft Learn — SignalR JS client] — withUrl auto-appends /negotiate
- [Source: Microsoft Learn — Azure SignalR serverless] — Negotiate pattern for serverless mode

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Initial SignalRService test approach used `spyOn(signalR, 'HubConnectionBuilder')` which failed because ES module exports are read-only. Refactored to use `InjectionToken<HubConnection>` (`SIGNALR_CONNECTION`) for testability — allows clean mock injection via TestBed providers.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- Story depends on Story 4.1 being completed (server-side SignalR infrastructure)
- No new environment variables needed in Angular — uses existing `environment.apiUrl`
- The signalr store stub from Story 1.6 is intentionally minimal — this story fully populates it
- Story 4.3 (SignalR Status Dot) will consume `selectConnectionStatus` selector created here
- Story 4.4 (Flying Chip) will interact with `signalrEventReceived` action for chip landing coordination
- Story 4.5 (Row Insert Animation) will extend the `eventReceived$` effect for toast notifications on page 2+
- ✅ Installed `@microsoft/signalr@^10.0.0` — SignalR JavaScript client for Azure serverless mode
- ✅ Created `SignalRService` with `SIGNALR_CONNECTION` InjectionToken for HubConnection (testability pattern)
- ✅ Created 4 NgRx actions: `signalrConnected`, `signalrDisconnected`, `signalrReconnecting`, `signalrEventReceived`
- ✅ Updated signalr reducer with `on()` handlers for all 3 connection status transitions
- ✅ Created 3 selectors: `selectSignalrState`, `selectConnectionStatus`, `selectIsConnected`
- ✅ Created `SignalrEffects` with `eventReceived$` effect — re-fetches events only when user is on page 1
- ✅ Registered `SignalrEffects` in `app.config.ts` `provideEffects()`
- ✅ Updated `AppComponent` with `ngOnInit`/`ngOnDestroy` lifecycle for SignalR connection management
- ✅ All 152 tests pass (0 failures), including 27 new tests for signalr reducer, effects, and service
- ✅ `ng build` succeeds with zero errors

### Implementation Plan

- Used `InjectionToken` pattern for `HubConnection` to enable clean mocking in tests without ES module spy issues
- Followed existing NgRx slice pattern: `actions.ts` → `reducer.ts` → `effects.ts` → `selectors.ts`
- Used `inject()` function pattern (not constructor injection) consistent with existing codebase
- HubConnection configured with `withAutomaticReconnect([0, 2000, 10000, 30000])` matching NFR-I3
- Connection URL uses `environment.apiUrl` per enforcement rule #11

### File List

#### Created
- `src/frontend/src/app/core/services/signalr.service.ts` — SignalR WebSocket connection management with InjectionToken
- `src/frontend/src/app/core/services/signalr.service.spec.ts` — Unit tests for SignalRService (13 tests)
- `src/frontend/src/app/store/signalr/signalr.actions.ts` — NgRx action definitions (4 actions)
- `src/frontend/src/app/store/signalr/signalr.selectors.ts` — NgRx selectors (3 selectors)
- `src/frontend/src/app/store/signalr/signalr.effects.ts` — NgRx effects (eventReceived$ re-fetch logic)
- `src/frontend/src/app/store/signalr/signalr.effects.spec.ts` — Unit tests for effects (3 tests)
- `src/frontend/src/app/store/signalr/signalr.reducer.spec.ts` — Unit tests for reducer (7 tests)

#### Modified
- `src/frontend/src/app/store/signalr/signalr.reducer.ts` — Added `on()` handlers for connected/reconnecting/disconnected
- `src/frontend/src/app/app.config.ts` — Added `SignalrEffects` to `provideEffects()`
- `src/frontend/src/app/app.component.ts` — Added SignalR lifecycle management (ngOnInit/ngOnDestroy)
- `src/frontend/package.json` — Added `@microsoft/signalr@^10.0.0` dependency
- `src/frontend/package-lock.json` — Updated lock file

## Change Log

- 2026-02-24: Implemented Angular SignalR Service & NgRx Integration (Story 4.2) — installed @microsoft/signalr, created SignalRService with InjectionToken pattern, full NgRx signalr slice (actions, reducer, selectors, effects), AppComponent lifecycle integration, 27 unit tests all passing
