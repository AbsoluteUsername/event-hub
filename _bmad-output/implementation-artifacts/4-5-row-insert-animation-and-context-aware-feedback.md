# Story 4.5: Row Insert Animation & Context-Aware Feedback

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want newly arrived events to animate into the table with contextual feedback based on my current view,
so that I always know a new event was created regardless of my filter and pagination state.

## Acceptance Criteria

1. **Given** a SignalR `newEvent` arrives and the user is on page 1 with no filters (or filters that match the new event), **When** the table re-fetches and the new row appears, **Then** the row unfolds top-to-bottom via `max-height` animation (~300ms, `ease-out`), and the row highlights with violet glow (`rgba(124,58,237,0.12)`) for ~1.5s then fades to normal.

2. **Given** a SignalR `newEvent` arrives and the user has active filters that EXCLUDE the new event, **When** the event is received, **Then** the flying chip completes its arc to the table header area, bounces, and dissolves (no row to land into), and an info toast appears: "New event added — hidden by current filters" with a "Clear filters" action link (violet left border), and clicking "Clear filters" resets all filters and shows the full event list.

3. **Given** a SignalR `newEvent` arrives and the user is on page 2 or later, **When** the event is received, **Then** the flying chip completes its animation (lands at table header, bounces, dissolves), and an info toast appears: "New event added" with a "Go to page 1" action link, and the `totalCount` in the paginator updates, and no automatic page jump occurs — user stays on their current page.

4. **Given** `prefers-reduced-motion: reduce` is enabled, **When** a new row appears, **Then** the row appears instantly without unfold animation, and a static violet tint shows for 1s then clears instantly.

## Tasks / Subtasks

- [x] Task 1: Add `showInfo` method to `NotificationService` with action callback support (AC: #2, #3)
  - [x] 1.1 Add `showInfo(message: string, actionLabel?: string, onAction?: () => void): void` method to `notification.service.ts`
  - [x] 1.2 Use `MatSnackBar.open()` with `action` parameter for the action link text; subscribe to `onAction()` from `snackBarRef.onAction()`
  - [x] 1.3 Configure: `duration: 6000`, `horizontalPosition: 'end'`, `verticalPosition: 'bottom'`, `panelClass: ['toast-info']`
  - [x] 1.4 Add `toast-info` panel class to `_material-overrides.scss` — matching existing toast pattern: `backdrop-filter: blur(16px)`, semi-transparent dark background, `border-left: 3px solid var(--accent)` (violet `#7c3aed`)

- [x] Task 2: Extend events NgRx store with new-row tracking (AC: #1, #3)
  - [x] 2.1 Add `lastInsertedEventId: string | null` to `EventsState` interface in `events.reducer.ts`
  - [x] 2.2 Add new action `markNewEvent` in `events.actions.ts`: `createAction('[Events] Mark New Event', props<{ eventId: string }>())`
  - [x] 2.3 Add new action `clearNewEvent` in `events.actions.ts`: `createAction('[Events] Clear New Event')`
  - [x] 2.4 Add reducer `on()` handlers: `markNewEvent` sets `lastInsertedEventId`, `clearNewEvent` resets to `null`
  - [x] 2.5 Add selector `selectLastInsertedEventId` in `events.selectors.ts`

- [x] Task 3: Extend SignalR effects for context-aware feedback (AC: #1, #2, #3)
  - [x] 3.1 Refactor `eventReceived$` effect in `signalr.effects.ts` to handle all 3 context scenarios (page 1 match, page 1 hidden, page 2+)
  - [x] 3.2 **Page 1 + event matches filters (or no filters):** dispatch `markNewEvent({ eventId })` then `loadEvents()` — the re-fetched items will include the new row, identified by `lastInsertedEventId` for animation
  - [x] 3.3 **Page 1 + active filters that exclude event:** determine match by comparing `signalrEventReceived.event` fields against current `selectEventsFilters` values (type match, userId match, description contains, date range); if excluded → dispatch `loadEvents()` (totalCount updates) AND call `NotificationService.showInfo('New event added — hidden by current filters', 'Clear filters', () => store.dispatch(changeFilter({ filter: {} })))` — no `markNewEvent` dispatch (no row to animate)
  - [x] 3.4 **Page 2+:** do NOT dispatch `loadEvents()` — user stays on current page; dispatch a new action `updateTotalCount` to increment `totalCount` by 1 in the events reducer; call `NotificationService.showInfo('New event added', 'Go to page 1', () => store.dispatch(changePage({ page: 1 })))` — no `markNewEvent` dispatch
  - [x] 3.5 Add `updateTotalCount` action + reducer handler in events store: `on(updateTotalCount, (state) => ({ ...state, totalCount: state.totalCount + 1 }))`

- [x] Task 4: Implement row insert animation in `EventsTableComponent` (AC: #1, #4)
  - [x] 4.1 Inject `AnimationService` and `Store` into `EventsTableComponent`
  - [x] 4.2 Add `trackById` function: `trackById(index: number, item: EventResponse): string => item.id` — add `[trackBy]="trackById"` on the `mat-table` `*matRowDef` or table element to prevent full DOM re-render on data change
  - [x] 4.3 Subscribe to `selectLastInsertedEventId` — store as a local signal `newEventId`
  - [x] 4.4 Add `[class.new-row]="row.id === newEventId()"` binding on `<tr mat-row>` to mark the new row
  - [x] 4.5 Use `afterRenderEffect()` or `AfterViewChecked` to detect when a `.new-row` element enters the DOM, then trigger Web Animations API animation on that element
  - [x] 4.6 **Full-motion animation sequence:** (a) Set `max-height: 0; overflow: hidden; opacity: 0` initially via class → (b) Animate `max-height` from `0` to row's `scrollHeight` over 300ms `ease-out` + opacity 0→1 → (c) After unfold completes, apply violet highlight `background: rgba(124,58,237,0.12)` → (d) After 1.5s, fade highlight to transparent over 500ms `ease-in-out` → (e) Dispatch `clearNewEvent()` to remove tracking
  - [x] 4.7 **Reduced-motion fallback:** If `!animationService.shouldAnimate()`: skip unfold animation (row appears instantly); apply static violet tint `background: rgba(124,58,237,0.12)` for 1s; remove tint instantly (no fade); dispatch `clearNewEvent()`
  - [x] 4.8 After animation or reduced-motion cycle completes, dispatch `clearNewEvent()` to clean up store state

- [x] Task 5: Fix FlyingChip DOM target query (pre-existing bug from Story 4.4) (AC: #1)
  - [x] 5.1 In `app.component.html`, add `class="events-table"` to `<app-events-table>` element: `<app-events-table class="events-table"></app-events-table>` — this fixes the `document.querySelector('.events-table mat-header-row')` query in `EventFormComponent.launchFlyingChip()` which currently returns `null` (falling back to center-screen position)

- [x] Task 6: Unit tests (AC: #1, #2, #3, #4)
  - [x] 6.1 Create/extend `notification.service.spec.ts` — test `showInfo()` calls `MatSnackBar.open()` with correct parameters, verify `onAction()` callback fires
  - [x] 6.2 Extend `events.reducer.spec.ts` — test `markNewEvent` sets `lastInsertedEventId`, `clearNewEvent` resets to null, `updateTotalCount` increments totalCount
  - [x] 6.3 Extend `signalr.effects.spec.ts` — test 3 context scenarios: page 1 matching (dispatches markNewEvent + loadEvents), page 1 excluded (dispatches loadEvents + calls showInfo), page 2+ (dispatches updateTotalCount + calls showInfo, does NOT dispatch loadEvents)
  - [x] 6.4 Extend `events-table.component.spec.ts` — test `.new-row` class is applied when `lastInsertedEventId` matches a row, verify `role="status"` attributes
  - [x] 6.5 Test reduced-motion path: verify no animation triggers when `AnimationService.shouldAnimate()` returns false
  - [x] 6.6 Verify `ng build` succeeds with zero errors

## Dev Notes

### Architecture Patterns & Constraints

- **ADR-3: Azure SignalR Service (Serverless)** — The `signalrEventReceived` action carries the full `EventResponse` payload from the Azure Function's `newEvent` broadcast. This payload is used to determine filter match/mismatch for context-aware feedback. The row animation triggers AFTER the re-fetch completes (not directly from SignalR data), ensuring the animated row displays server-authoritative data.
- **ADR-5: NgRx Store** — All state mutations go through NgRx actions (Enforcement Rule #5). New row tracking uses `lastInsertedEventId` in the events store slice. Context detection logic lives in `signalr.effects.ts` — effects are the proper location for side-effect coordination (filter comparison, toast dispatch, conditional re-fetch).
- **ADR-6: Server-Side Pagination** — On page 2+, `totalCount` must increment without a full re-fetch. A new `updateTotalCount` action handles this. The paginator's `[length]` binding updates reactively via the existing `selectEventsTotalCount` selector.
- **Enforcement Rule #5:** NgRx actions for all state mutations — `markNewEvent`, `clearNewEvent`, `updateTotalCount` actions handle row animation lifecycle.
- **Enforcement Rule #9:** `provideStore()` / `provideEffects()` pattern — no changes to store configuration needed, only new actions/reducers within existing slices.
- **Enforcement Rule #12:** All color values use CSS custom properties from `_variables.scss`. Row highlight uses `--accent` (`#7c3aed`) at 12% opacity. Toast info border uses `--accent`.
- **Web Animations API** — Same pattern as Story 4.4's FlyingChipComponent. Use `element.animate()` for the row unfold and highlight sequences. `.finished` promise for sequencing phases.

### Critical Implementation Details

#### Context Detection Logic (SignalR Effects)

The `eventReceived$` effect must be refactored from a simple "page 1 → loadEvents" to a 3-branch context analyzer:

```typescript
// signalr.effects.ts — refactored eventReceived$ effect
eventReceived$ = createEffect(() =>
  this.actions$.pipe(
    ofType(signalrEventReceived),
    withLatestFrom(
      this.store.select(selectEventsPagination),
      this.store.select(selectEventsFilters),
    ),
    switchMap(([{ event }, pagination, filters]) => {
      const isPage1 = pagination.page === 1;
      const matchesFilters = this.eventMatchesFilters(event, filters);

      if (isPage1 && matchesFilters) {
        // Scenario 1: Page 1, event visible → animate new row
        return [markNewEvent({ eventId: event.id }), loadEvents()];
      } else if (isPage1 && !matchesFilters) {
        // Scenario 2: Page 1, event hidden by filters → toast + re-fetch for count
        this.notificationService.showInfo(
          'New event added — hidden by current filters',
          'Clear filters',
          () => this.store.dispatch(changeFilter({ filter: {} }))
        );
        return [loadEvents()];
      } else {
        // Scenario 3: Page 2+ → toast + increment count only
        this.notificationService.showInfo(
          'New event added',
          'Go to page 1',
          () => this.store.dispatch(changePage({ page: 1 }))
        );
        return [updateTotalCount()];
      }
    })
  )
);

private eventMatchesFilters(event: EventResponse, filters: Partial<EventFilter>): boolean {
  if (filters.type && event.type !== filters.type) return false;
  if (filters.userId && event.userId !== filters.userId) return false;
  if (filters.description && !event.description.toLowerCase().includes(filters.description.toLowerCase())) return false;
  if (filters.from && new Date(event.createdAt) < new Date(filters.from)) return false;
  if (filters.to && new Date(event.createdAt) > new Date(filters.to)) return false;
  return true;
}
```

#### NotificationService `showInfo` Method

```typescript
// notification.service.ts — new method
showInfo(message: string, actionLabel?: string, onAction?: () => void): void {
  const ref = this.snackBar.open(message, actionLabel ?? '', {
    duration: 6000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: ['toast-info'],
    politeness: 'polite',
  });

  if (onAction && actionLabel) {
    ref.onAction().subscribe(() => onAction());
  }
}
```

#### Row Animation in EventsTableComponent

```typescript
// events-table.component.ts — key additions

private readonly animationService = inject(AnimationService);
private readonly lastInsertedEventId$ = this.store.select(selectLastInsertedEventId);
readonly newEventId = signal<string | null>(null);

constructor() {
  // ... existing filters$ subscription ...

  this.lastInsertedEventId$.pipe(takeUntilDestroyed()).subscribe(id => {
    this.newEventId.set(id);
  });
}

trackById(index: number, item: EventResponse): string {
  return item.id;
}

animateNewRow(rowElement: HTMLElement): void {
  if (!this.animationService.shouldAnimate()) {
    // Reduced motion: static tint for 1s
    rowElement.style.background = 'rgba(124, 58, 237, 0.12)';
    setTimeout(() => {
      rowElement.style.background = '';
      this.store.dispatch(clearNewEvent());
    }, 1000);
    return;
  }

  // Phase 1: Unfold (300ms)
  const height = rowElement.scrollHeight;
  rowElement.style.overflow = 'hidden';
  const unfold = rowElement.animate(
    [
      { maxHeight: '0px', opacity: 0 },
      { maxHeight: `${height}px`, opacity: 1 },
    ],
    { duration: 300, easing: 'ease-out', fill: 'forwards' }
  );

  unfold.finished.then(() => {
    rowElement.style.overflow = '';

    // Phase 2: Violet highlight (1.5s hold + 500ms fade)
    rowElement.style.background = 'rgba(124, 58, 237, 0.12)';

    setTimeout(() => {
      rowElement.animate(
        [
          { background: 'rgba(124, 58, 237, 0.12)' },
          { background: 'rgba(124, 58, 237, 0)' },
        ],
        { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
      ).finished.then(() => {
        rowElement.style.background = '';
        this.store.dispatch(clearNewEvent());
      });
    }, 1500);
  });
}
```

#### Detecting New Row DOM Entry

```typescript
// In events-table.component.ts — use afterRenderEffect or MutationObserver
// Option: AfterViewChecked with a guard

private lastAnimatedId: string | null = null;

ngAfterViewChecked(): void {
  const id = this.newEventId();
  if (id && id !== this.lastAnimatedId) {
    const rowEl = document.querySelector(`tr.new-row`) as HTMLElement;
    if (rowEl) {
      this.lastAnimatedId = id;
      this.animateNewRow(rowEl);
    }
  }
}
```

#### Toast Info SCSS

```scss
/* _material-overrides.scss — add alongside existing toast-success/toast-error */
.toast-info {
  --mdc-snackbar-container-color: rgba(17, 17, 17, 0.95);
  --mdc-snackbar-supporting-text-color: var(--text-primary);
  & .mdc-snackbar__surface {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    max-width: 360px;
    border-left: 3px solid var(--accent);
  }
}
```

#### Events Store Extensions

```typescript
// events.actions.ts — new actions
export const markNewEvent = createAction('[Events] Mark New Event', props<{ eventId: string }>());
export const clearNewEvent = createAction('[Events] Clear New Event');
export const updateTotalCount = createAction('[Events] Update Total Count');
```

```typescript
// events.reducer.ts — extended state
export interface EventsState {
  items: EventResponse[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  filters: Partial<EventFilter>;
  pagination: { page: number; pageSize: number };
  sort: { sortBy: string; sortDir: 'asc' | 'desc' };
  lastInsertedEventId: string | null;  // NEW
}

// New on() handlers:
on(markNewEvent, (state, { eventId }) => ({ ...state, lastInsertedEventId: eventId })),
on(clearNewEvent, (state) => ({ ...state, lastInsertedEventId: null })),
on(updateTotalCount, (state) => ({ ...state, totalCount: state.totalCount + 1 })),
```

#### Template Changes for Row Animation

```html
<!-- events-table.component.html — update mat-row -->
<tr mat-row
    *matRowDef="let row; columns: displayedColumns;"
    [class.new-row]="row.id === newEventId()">
</tr>
```

```html
<!-- events-table.component.html — add trackBy to table -->
<table mat-table [dataSource]="(events$ | async) ?? []" matSort
       [trackBy]="trackById"
       (matSortChange)="onSortChange($event)"
       matSortActive="createdAt" matSortDirection="desc">
```

### Critical Anti-Patterns to Avoid

- **DO NOT** use `@angular/animations` (`trigger`, `state`, `transition`, `animate`) — use native Web Animations API (`element.animate()`) per architecture spec and Story 4.4 precedent.
- **DO NOT** auto-jump the user to page 1 when they're on page 2+ — this is disorienting. Silent `totalCount` update + toast with "Go to page 1" link is the correct UX pattern.
- **DO NOT** dispatch `loadEvents()` when user is on page 2+ — this would re-fetch the wrong page. Only increment `totalCount`.
- **DO NOT** skip the `trackBy` function on the mat-table — without it, Angular destroys and recreates ALL row DOM nodes on every data update, making it impossible to animate only the new row.
- **DO NOT** use `setTimeout` for animation sequencing — use Web Animations API `.finished` promise. Exception: the 1.5s highlight hold uses `setTimeout` because it's a static wait, not an animation phase.
- **DO NOT** hardcode color values — use CSS custom properties (`--accent` for violet highlight).
- **DO NOT** forget to dispatch `clearNewEvent()` after animation completes — orphaned `lastInsertedEventId` causes the next load to re-animate the same row.
- **DO NOT** compare filter match using the SignalR event's `createdAt` against date range filters without proper UTC date comparison — use `new Date()` parsing with UTC awareness.
- **DO NOT** call `showInfo()` inside the reducer — toasts are side effects and belong in effects only.
- **DO NOT** forget the `-webkit-backdrop-filter` prefix on the `toast-info` class — Safari requires it.
- **DO NOT** animate `background` via CSS transitions AND Web Animations API simultaneously — pick one. Use Web Animations API for the highlight fade; use inline `style.background` for the static hold phase.
- **DO NOT** forget the reduced-motion fallback — WCAG 2.1 AA compliance requires all animations to have `prefers-reduced-motion` alternatives. Both row unfold AND highlight fade must degrade gracefully.

### Project Structure Notes

#### Files to CREATE:

None — all changes are modifications to existing files.

#### Files to MODIFY:

| File | Change |
|------|--------|
| `src/frontend/src/app/core/services/notification.service.ts` | Add `showInfo(message, actionLabel?, onAction?)` method with `MatSnackBarRef.onAction()` callback |
| `src/frontend/src/app/store/events/events.actions.ts` | Add `markNewEvent`, `clearNewEvent`, `updateTotalCount` actions |
| `src/frontend/src/app/store/events/events.reducer.ts` | Add `lastInsertedEventId: string \| null` to state; add `on()` handlers for 3 new actions |
| `src/frontend/src/app/store/events/events.selectors.ts` | Add `selectLastInsertedEventId` selector |
| `src/frontend/src/app/store/signalr/signalr.effects.ts` | Refactor `eventReceived$` to 3-branch context analyzer (page 1 match / page 1 hidden / page 2+); inject `NotificationService`; add `eventMatchesFilters()` helper |
| `src/frontend/src/app/features/events-table/events-table.component.ts` | Inject `AnimationService`, `Store`; add `trackById()`, `newEventId` signal, `animateNewRow()` method, `ngAfterViewChecked()` for DOM detection |
| `src/frontend/src/app/features/events-table/events-table.component.html` | Add `[trackBy]="trackById"` on table; add `[class.new-row]="row.id === newEventId()"` on `mat-row` |
| `src/frontend/src/app/features/events-table/events-table.component.scss` | Add `.new-row` initial styles (overflow hidden for animation entry point) |
| `src/frontend/src/app/app.component.html` | Add `class="events-table"` to `<app-events-table>` element (fixes FlyingChip DOM target from Story 4.4) |
| `src/frontend/src/styles/_material-overrides.scss` | Add `.toast-info` panel class (violet left border, glass background) |

#### Files NOT to touch:

| File | Reason |
|------|--------|
| `src/frontend/src/app/shared/components/flying-chip/*` | FlyingChip is Story 4.4 — complete and working; its animation terminates independently |
| `src/frontend/src/app/core/services/animation.service.ts` | Already provides `shouldAnimate()` — no changes needed |
| `src/frontend/src/app/store/submission/*` | Submission store chip lifecycle is Story 4.4's domain — this story only reads `chipLanded` status indirectly |
| `src/frontend/src/app/features/event-form/*` | EventFormComponent chip orchestration is Story 4.4 — no changes needed (the chip lands and dissolves independently of row animation) |
| `src/frontend/src/app/core/services/signalr.service.ts` | SignalR WebSocket connection is Story 4.2 — already dispatches `signalrEventReceived` |
| `src/frontend/src/app/store/signalr/signalr.reducer.ts` | Only tracks `connectionStatus` — no row animation state belongs here |
| `src/frontend/src/app/store/signalr/signalr.actions.ts` | `signalrEventReceived` already carries full `EventResponse` — no changes needed |
| `src/frontend/src/styles/_variables.scss` | All needed CSS tokens already exist (`--accent`, `--text-primary`) |
| Any `.NET` backend files | This is a frontend-only animation/feedback story |

### Library & Framework Requirements

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | `19.2.x` (already installed) | Component framework, `signal()`, `AfterViewChecked` |
| `@angular/material` | `19.2.x` (already installed) | `MatSnackBar`, `MatSnackBarRef.onAction()` for toast action callbacks |
| `@ngrx/store` | `19.2.1` (already installed) | State management for new row tracking |
| `@ngrx/effects` | `19.2.1` (already installed) | Context-aware SignalR effect branching |
| Web Animations API | Browser-native | `element.animate()` — no package needed |

No new packages need to be installed.

### Testing Requirements

**Framework:** Karma + Jasmine (Angular convention, already configured)

**Test modifications:**

1. **`notification.service.spec.ts`** — Service tests:
   - `showInfo()` calls `MatSnackBar.open()` with `panelClass: ['toast-info']`, `duration: 6000`
   - `showInfo()` with actionLabel subscribes to `snackBarRef.onAction()`
   - `showInfo()` callback fires when action is triggered
   - `showInfo()` without actionLabel does not subscribe to onAction

2. **`events.reducer.spec.ts`** — Extend existing reducer tests:
   - `markNewEvent` action sets `lastInsertedEventId` to provided eventId
   - `clearNewEvent` action resets `lastInsertedEventId` to null
   - `updateTotalCount` action increments `totalCount` by 1
   - `loadEventsSuccess` does NOT clear `lastInsertedEventId` (it persists through re-fetch)

3. **`signalr.effects.spec.ts`** — Extend existing effect tests:
   - **Scenario 1 (page 1, matching):** dispatches `markNewEvent` + `loadEvents`; does NOT call `showInfo`
   - **Scenario 2 (page 1, excluded by filter):** dispatches `loadEvents`; calls `showInfo` with "hidden by current filters" message and "Clear filters" action
   - **Scenario 3 (page 2+):** dispatches `updateTotalCount`; does NOT dispatch `loadEvents`; calls `showInfo` with "New event added" message and "Go to page 1" action
   - Filter matching helper: type mismatch → excluded, userId mismatch → excluded, description no-contain → excluded, date out of range → excluded, all match → included

4. **`events-table.component.spec.ts`** — Extend existing component tests:
   - `.new-row` CSS class applied when row id matches `lastInsertedEventId`
   - `.new-row` CSS class NOT applied when ids don't match
   - `trackById` returns `item.id`
   - Verify `animateNewRow` is called when `.new-row` element appears in DOM

**Mock strategy:**
- `NotificationService`: Spy on `showInfo` to verify calls and capture callback arguments
- `AnimationService`: Mock `shouldAnimate()` return value (true/false)
- `Store`: `provideMockStore` with configurable `selectEventsPagination`, `selectEventsFilters`, `selectLastInsertedEventId`
- `MatSnackBar`: Mock with `open()` returning a mock `MatSnackBarRef` with `onAction()` returning an observable

### Previous Story Intelligence (Story 4.4)

**Key learnings from Story 4.4 that directly impact this story:**

- **Web Animations API pattern established:** `element.animate([keyframes], options)` with `.finished` promise for sequencing. Same pattern used for row unfold + highlight. Do NOT switch to `@angular/animations`.
- **AnimationService.shouldAnimate()** is the single gate for all animation — already tested, already wired. Reuse for row animation reduced-motion check.
- **`inject()` function pattern** for DI (not constructor injection) — follow this in EventsTableComponent additions.
- **Chip lifecycle is self-contained in EventFormComponent** — the flying chip lands and dissolves independently. Row animation is a separate, parallel concern triggered by the data arriving in the table (via `loadEventsSuccess` + `lastInsertedEventId`). The chip and row animation are NOT sequentially coupled.
- **DOM query bug discovered:** `document.querySelector('.events-table mat-header-row')` returns `null` because `app-events-table` has no `.events-table` class. Task 5 of this story fixes this by adding the class in `app.component.html`.
- **`submitEventSuccess` fires `showSuccess` toast unconditionally** — this is the "Event submitted successfully" toast from Story 2.5. This toast fires when the API returns 201, BEFORE SignalR arrives. The context-aware toasts in this story fire when SignalR arrives (1-3s later). They are separate, non-overlapping notifications.
- **All 186 tests pass after Story 4.4** — baseline for regression testing.

### Git Intelligence

**Recent commit pattern:** `feat({story-key}): {description}`

**Last 5 commits (Story 4.4 implementation):**
- `30558c0` feat(4-4-flying-chip-animation): complete task 5 - Submit button disable during animation
- `cab4bf1` feat(4-4-flying-chip-animation): complete task 4 - Integrate flying chip into EventFormComponent
- `fa0a17a` feat(4-4-flying-chip-animation): complete task 3 - Extend submission NgRx store
- `a7f689e` feat(4-4-flying-chip-animation): complete task 2 - Create FlyingChipComponent
- `270ebc9` feat(4-4-flying-chip-animation): complete task 1 - Create AnimationService

**Patterns established:**
- Standalone components with `imports: [...]` in `@Component` decorator
- `inject()` function for DI (not constructor injection)
- Host binding via `host: { ... }` in `@Component` metadata
- SCSS uses CSS custom properties from `_variables.scss`
- Test files co-located as `*.spec.ts`
- Commit per task: `feat({story-key}): complete task N - {Task Title}`

**Code patterns from Story 4.4 directly relevant:**
- `SignalrEffects.eventReceived$` currently uses `withLatestFrom(selectEventsPagination)` and `filter(([, pagination]) => pagination.page === 1)` — this needs to become a multi-branch `switchMap` instead of a simple filter
- `EventsTableComponent` does NOT use `trackBy` — this MUST be added before row animation can work correctly
- `NotificationService` only has `showSuccess` and `showError` — `showInfo` must be added with action callback pattern
- Toast SCSS follows a consistent pattern: `toast-success` (green border), `toast-error` (red border) — `toast-info` (violet border) follows the same structure

### Latest Technical Information

- **Angular 19 `afterRenderEffect()`:** New API in Angular 19 that runs after rendering. Could be used instead of `ngAfterViewChecked` for DOM detection. However, `ngAfterViewChecked` is more straightforward for detecting newly rendered rows after data change. Use `ngAfterViewChecked` with a guard flag to avoid repeated calls.
- **Web Animations API `background` property:** `background` shorthand is animatable in Web Animations API across all modern browsers. For the highlight fade, animate from `rgba(124,58,237,0.12)` to `rgba(124,58,237,0)`.
- **`MatSnackBarRef.onAction()`:** Returns an `Observable<void>` that emits when the user clicks the action button. Subscribe to it for the "Clear filters" / "Go to page 1" callbacks. The observable completes after one emission or when the snackbar is dismissed.
- **Angular Material `mat-table` `trackBy`:** Not directly on `mat-table` element. Instead, set `[trackBy]="trackById"` as an attribute — Angular Material's table directive recognizes it. Without trackBy, the table re-renders all rows on data source change.
- **Safari:** Requires `-webkit-backdrop-filter` prefix for `blur()` on the toast info glass effect.
- **`switchMap` returning array of actions in NgRx effects:** Use `switchMap(() => [...actions])` — NgRx effects support returning arrays of actions from `switchMap`. Alternatively, use `concatMap(() => from([action1, action2]))` for sequential dispatch.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5] — Acceptance criteria, user story, all 4 ACs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Row Insert Animation] — Row unfold top-to-bottom ~300ms, violet highlight rgba(124,58,237,0.12) for ~1.5s then fade
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Animation & Motion Patterns] — Standard durations, spring easing, reduced motion fallbacks
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Context-aware toast patterns: filter-hidden, page 2+ toast
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pagination Patterns] — SignalR + pagination edge case: no auto-jump, toast with "Go to page 1"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Filtering Patterns] — Filter-aware post-submit notification pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Reduced Motion Fallbacks] — Row appears instantly, static violet tint for 1s then instant clear
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5] — NgRx Store — events state management
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6] — Server-side pagination — totalCount update pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Effects for Side Effects] — signalrEvent$ → context-aware branching
- [Source: _bmad-output/planning-artifacts/architecture.md#SignalR + Pagination + Animation Strategy] — Full strategy table for chip + row behavior per client state
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rules #5 (NgRx), #9 (provideStore), #12 (SCSS tokens)
- [Source: _bmad-output/implementation-artifacts/4-4-flying-chip-animation.md] — Previous story: AnimationService, FlyingChip, chip lifecycle, DOM query patterns
- [Source: MDN Web Animations API] — element.animate() usage, Animation.finished promise
- [Source: Angular Material MatSnackBar] — MatSnackBarRef.onAction() observable for action callbacks

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- This story completes the "send → watch → arrive" experience — row animation is the visual payoff for the flying chip
- Story depends on Story 4.4 being completed (AnimationService, FlyingChipComponent, chip lifecycle states) — confirmed review status
- Story depends on Story 4.2 being completed (SignalR store + signalrEventReceived action) — confirmed review status
- Story depends on Story 3.2 being completed (events NgRx store with pagination/filter selectors) — confirmed review status
- No new npm packages needed — Web Animations API is browser-native, MatSnackBar already imported
- Extends existing events store with `lastInsertedEventId` tracking (no new store slice)
- Extends existing signalr effects with 3-branch context analyzer (was: simple page-1 filter)
- Extends NotificationService with `showInfo()` + action callback pattern
- Fixes pre-existing DOM query bug from Story 4.4 (`.events-table` class missing)
- `trackBy` addition to mat-table is CRITICAL — without it, all rows re-render on data change and animation targets are lost
- AnimationService from Story 4.4 is reused as-is for reduced-motion gating
- Row animation and chip animation are parallel, independent concerns — chip lands and dissolves, row unfolds and highlights separately
- The context-aware toasts (this story) fire on SignalR arrival, while the success toast (Story 2.5) fires on API 201 — they are 1-3s apart and non-overlapping
- prefers-reduced-motion fallback is a WCAG 2.1 AA requirement — not optional
- Safari requires -webkit-backdrop-filter prefix on toast-info glass effect
- Epic 4 (Real-Time Updates & Live Experience) completes with this story — all 5 stories done

### File List

- `src/frontend/src/app/core/services/notification.service.ts` (modified)
- `src/frontend/src/app/core/services/notification.service.spec.ts` (modified)
- `src/frontend/src/app/store/events/events.actions.ts` (modified)
- `src/frontend/src/app/store/events/events.reducer.ts` (modified)
- `src/frontend/src/app/store/events/events.selectors.ts` (modified)
- `src/frontend/src/app/store/events/events.reducer.spec.ts` (modified)
- `src/frontend/src/app/store/signalr/signalr.effects.ts` (modified)
- `src/frontend/src/app/store/signalr/signalr.effects.spec.ts` (modified)
- `src/frontend/src/app/features/events-table/events-table.component.ts` (modified)
- `src/frontend/src/app/features/events-table/events-table.component.html` (modified)
- `src/frontend/src/app/features/events-table/events-table.component.scss` (modified)
- `src/frontend/src/app/features/events-table/events-table.component.spec.ts` (modified)
- `src/frontend/src/app/app.component.html` (modified)
- `src/frontend/src/styles/_material-overrides.scss` (modified)
