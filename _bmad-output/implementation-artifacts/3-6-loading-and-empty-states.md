# Story 3.6: Loading & Empty States

Status: done
Story-Key: 3-6-loading-and-empty-states
Epic: 3 — Event Discovery & Table Display (Full Stack)
Date: 2026-02-24
FRs: FR12
NFRs: NFR-P5

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want to see clear loading indicators and helpful empty states,
So that I always know what the system is doing and what to do next.

## Acceptance Criteria

1. **Given** the events store has `loading: true`
   **When** the table area renders
   **Then** a `mat-progress-bar` with `mode="indeterminate"` spans the full table width above the table header
   **And** the loading indicator appears within 200ms of the data fetch initiation (NFR-P5)

2. **Given** the events load completes with 0 events and no filters are active
   **When** the table area renders
   **Then** `EmptyStateComponent` displays in `no-data` state: outlined icon, "No events yet" title, "Submit your first event using the form on the left." subtitle
   **And** the component has `role="status"` with descriptive text for screen readers

3. **Given** filters are active and 0 events match
   **When** the table area renders
   **Then** `EmptyStateComponent` displays in `no-results` state: search-off icon, "No events match your filters" title, and a focusable "Clear all filters" ghost button
   **And** clicking the button resets all filters and returns to the full event list

## Tasks / Subtasks

- [x] Task 1: Create EmptyStateComponent (AC: #2, #3)
  - [x] 1.1 Create component directory: `src/frontend/src/app/shared/components/empty-state/`
  - [x] 1.2 Create `empty-state.component.ts` as standalone component with imports: `MatIconModule`, `MatButtonModule`
  - [x] 1.3 Define inputs: `@Input() mode: 'no-data' | 'no-results'` — determines which variant to display
  - [x] 1.4 Define output: `@Output() clearFilters = new EventEmitter<void>()` — emitted when "Clear all filters" is clicked in `no-results` mode
  - [x] 1.5 Create `empty-state.component.html` with two variants:
    - `no-data`: mat-icon (`outbox` outlined), "No events yet" title, "Submit your first event using the form on the left." subtitle
    - `no-results`: mat-icon (`search_off` outlined), "No events match your filters" title, "Clear all filters" ghost button (`mat-button`)
  - [x] 1.6 Create `empty-state.component.scss` with centered layout, Glass-themed styling using CSS custom properties from `_variables.scss`
  - [x] 1.7 Add `role="status"` on the host element with descriptive `aria-label` for screen readers

- [x] Task 2: Integrate Loading Indicator in Events Table (AC: #1)
  - [x] 2.1 In `events-table.component.html`, add `<mat-progress-bar mode="indeterminate">` above the table header — conditionally shown via `@if (loading$ | async)`
  - [x] 2.2 Import `MatProgressBarModule` in `events-table.component.ts` imports array
  - [x] 2.3 Ensure `loading$` observable is already bound to `selectEventsLoading` selector (ALREADY EXISTS in events-table.component.ts — verify)
  - [x] 2.4 Style the progress bar to span the full table width with no gap — use `position: absolute; top: 0; left: 0; right: 0;` within a relatively-positioned table container
  - [x] 2.5 Apply Glass-themed accent color to the progress bar via `_material-overrides.scss` or component SCSS: bar color should be `var(--accent)` (#7c3aed)

- [x] Task 3: Integrate Empty States in Events Table (AC: #2, #3)
  - [x] 3.1 Import `EmptyStateComponent` in `events-table.component.ts` imports array
  - [x] 3.2 Create a computed/derived signal or use template logic to determine display state:
    - `loading === true` → show loading bar + table (or hide table body)
    - `loading === false && items.length === 0 && no active filters` → show `<app-empty-state mode="no-data">`
    - `loading === false && items.length === 0 && active filters` → show `<app-empty-state mode="no-results" (clearFilters)="onClearFilters()">`
    - `loading === false && items.length > 0` → show table with data
  - [x] 3.3 Add `filters$` observable binding to `selectEventsFilters` selector to detect whether filters are active
  - [x] 3.4 Add `hasActiveFilters` computed property: checks if any filter value is non-empty/non-null in the filter state
  - [x] 3.5 Add `onClearFilters()` method that dispatches `EventsActions.changeFilter({ filter: {} })` to reset all filters
  - [x] 3.6 Update the template with `@if` / `@else` control flow blocks:
    ```
    @if (loading$ | async) { <mat-progress-bar> }
    @if (showEmptyNoData) { <app-empty-state mode="no-data"> }
    @else if (showEmptyNoResults) { <app-empty-state mode="no-results"> }
    @else { <mat-table ... > }
    ```
  - [x] 3.7 Ensure the progress bar appears ABOVE the table/empty state (not replacing it) — loading bar is visible while table content updates

- [x] Task 4: Unit Tests — EmptyStateComponent (AC: #2, #3)
  - [x] 4.1 Create `empty-state.component.spec.ts`
  - [x] 4.2 Test: component creates successfully
  - [x] 4.3 Test: in `no-data` mode, renders outbox icon, "No events yet" title, subtitle text
  - [x] 4.4 Test: in `no-data` mode, does NOT render "Clear all filters" button
  - [x] 4.5 Test: in `no-results` mode, renders search_off icon, "No events match your filters" title, "Clear all filters" button
  - [x] 4.6 Test: clicking "Clear all filters" button emits `clearFilters` event
  - [x] 4.7 Test: component has `role="status"` attribute
  - [x] 4.8 Test: icons use outlined style (48px size)

- [x] Task 5: Unit Tests — Events Table Loading & Empty Integration (AC: #1, #2, #3)
  - [x] 5.1 Update `events-table.component.spec.ts` with `provideMockStore()` for NgRx
  - [x] 5.2 Test: when store `loading` is true, `mat-progress-bar` is present in DOM
  - [x] 5.3 Test: when store `loading` is false, `mat-progress-bar` is NOT present
  - [x] 5.4 Test: when `loading` is false, items is empty, and no filters active → `EmptyStateComponent` renders in `no-data` mode
  - [x] 5.5 Test: when `loading` is false, items is empty, and filters active → `EmptyStateComponent` renders in `no-results` mode
  - [x] 5.6 Test: when `loading` is false and items has data → table renders with rows
  - [x] 5.7 Test: `onClearFilters()` dispatches `changeFilter` with empty filter object

- [x] Task 6: Accessibility (AC: #2, #3)
  - [x] 6.1 EmptyStateComponent host element has `role="status"` for screen reader announcements
  - [x] 6.2 "Clear all filters" button has `aria-label="Clear all filters"`
  - [x] 6.3 Empty state text is readable by screen readers (no `aria-hidden` on text content)
  - [x] 6.4 Loading progress bar has `aria-label="Loading events"` via Material's built-in ARIA
  - [x] 6.5 Ensure "Clear all filters" button is focusable and keyboard-activatable (Enter/Space)

- [x] Task 7: Verify End-to-End Build and Tests
  - [x] 7.1 Run `ng build` — successful production build with no errors
  - [x] 7.2 Run `ng test` — all existing + new tests pass
  - [x] 7.3 Run `ng lint` — 0 errors

## Dev Notes

### CRITICAL: NgRx Infrastructure Already Complete

The NgRx events store **already implements** everything needed for loading and empty state detection:

- **`selectEventsLoading` selector** exists in `store/events/events.selectors.ts` — returns `boolean` for loading state
- **`selectEvents` selector** returns `EventResponse[]` — check `.length === 0` for empty state
- **`selectEventsFilters` selector** returns `Partial<EventFilter>` — check for active filters
- **`selectEventsTotalCount` selector** returns `number` — alternative empty check
- **`changeFilter` action** exists for clearing filters (dispatch with empty object `{}`)
- **`loadEvents` action** sets `loading: true` in the reducer — synchronous Angular change detection ensures the loading indicator appears within 200ms (NFR-P5)

**The table component already has `loading$` bound to `selectEventsLoading`.** The task is to ADD visual indicators in the template, not create new store infrastructure.

### IMPORTANT: Loading Indicator Timing (NFR-P5)

NFR-P5 requires the loading indicator to appear within 200ms. This is naturally satisfied because:
1. `loadEvents` action dispatch is synchronous → reducer sets `loading: true` immediately
2. Angular change detection picks up the new state synchronously
3. `mat-progress-bar` renders in the next microtask (< 16ms)

**No special timing code is needed** — NgRx's synchronous dispatch + Angular's zone.js change detection guarantees sub-200ms rendering.

### Architecture Patterns & Constraints

- **Enforcement rule #9:** Standalone components — no NgModules. Import all Material modules directly in component `imports` array
- **Enforcement rule #12:** All colors from CSS custom properties in `_variables.scss` — never hardcode hex in component SCSS
- **Enforcement rule #1:** File naming: kebab-case — `empty-state.component.ts`
- **Enforcement rule #5:** NgRx for all state mutations — dispatch `changeFilter` actions to clear filters, never set state directly
- **ADR-6:** Server-side filtering — clearing filters dispatches `changeFilter({})` which triggers API refetch
- **UX Spec:** EmptyStateComponent has two states (`no-data` and `no-results`) per UX design specification

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Why |
|------|-------|-----|
| `selectEventsLoading` selector | `store/events/events.selectors.ts` | **ALREADY EXISTS** — bound as `loading$` in events-table |
| `selectEvents` selector | `store/events/events.selectors.ts` | **ALREADY EXISTS** — bound as `events$` in events-table |
| `selectEventsFilters` selector | `store/events/events.selectors.ts` | **ALREADY EXISTS** — use to detect active filters |
| `changeFilter` action | `store/events/events.actions.ts` | **ALREADY EXISTS** — dispatch with `{}` to clear all filters |
| `EventsActions` | `store/events/events.actions.ts` | All actions for events store slice |
| `GlassPanelComponent` | `shared/components/glass-panel/` | NOT needed for empty state (it goes inside the table's glass panel) |
| `hasActiveFilters` pattern | `features/events-filter/events-filter.component.ts` | Reference: how filter component checks active filters |
| `clearFilters()` pattern | `features/events-filter/events-filter.component.ts` | Reference: how to dispatch filter reset |
| CSS custom properties | `styles/_variables.scss` | All theme tokens available |
| Material overrides | `styles/_material-overrides.scss` | Reference for styling mat-progress-bar |

### Critical Anti-Patterns to Avoid

- **DO NOT** create a separate loading service or loading state — the NgRx store already manages `loading` state
- **DO NOT** use `*ngIf` or `*ngFor` — use `@if` / `@for` Angular 19 control flow blocks
- **DO NOT** hardcode hex color values in component SCSS — use CSS custom properties
- **DO NOT** import `CommonModule` — the component uses `@if`/`@for` (Angular 19 built-in control flow)
- **DO NOT** call `EventService` directly — dispatch NgRx actions only
- **DO NOT** add loading indicator as a full-page overlay — it should be a thin progress bar above the table header
- **DO NOT** show skeleton rows — use `mat-progress-bar` indeterminate mode per acceptance criteria
- **DO NOT** hide the table while loading on subsequent fetches — only replace table with empty state when items count is 0 AND not loading. The progress bar sits above the table during refetch operations
- **DO NOT** duplicate the "clear filters" logic — dispatch the same `changeFilter({})` action that the events-filter component uses

### Implementation Pattern — EmptyStateComponent

```typescript
// empty-state.component.ts — REFERENCE IMPLEMENTATION
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  host: { 'role': 'status' },
})
export class EmptyStateComponent {
  mode = input<'no-data' | 'no-results'>('no-data');
  clearFilters = output<void>();

  onClearFilters(): void {
    this.clearFilters.emit();
  }
}
```

### Template Pattern — EmptyStateComponent

```html
<!-- empty-state.component.html — REFERENCE LAYOUT -->
<div class="empty-state">
  @if (mode() === 'no-data') {
    <mat-icon class="empty-state__icon" fontIcon="outbox"></mat-icon>
    <h3 class="empty-state__title">No events yet</h3>
    <p class="empty-state__subtitle">Submit your first event using the form on the left.</p>
  } @else {
    <mat-icon class="empty-state__icon" fontIcon="search_off"></mat-icon>
    <h3 class="empty-state__title">No events match your filters</h3>
    <button mat-button
            class="empty-state__clear-btn"
            (click)="onClearFilters()"
            aria-label="Clear all filters">
      <mat-icon>filter_list_off</mat-icon>
      Clear all filters
    </button>
  }
</div>
```

### SCSS Pattern — EmptyStateComponent

```scss
// empty-state.component.scss — REFERENCE STYLING
:host {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
}

.empty-state__icon {
  font-size: 48px;
  width: 48px;
  height: 48px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.empty-state__title {
  font-size: var(--text-md);
  color: var(--text-primary);
  margin: 0 0 8px;
  font-weight: 500;
}

.empty-state__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.empty-state__clear-btn {
  margin-top: 16px;
  color: var(--accent);
  font-size: var(--text-sm);

  mat-icon {
    font-size: 18px;
    margin-right: 4px;
  }
}
```

### Template Pattern — Events Table Integration

```html
<!-- In events-table.component.html — INTEGRATION PATTERN -->
<app-glass-panel>
  <div class="table-header">
    <h2>Events</h2>
  </div>

  <!-- Loading bar — always above table content, absolute positioned -->
  <div class="table-container" style="position: relative;">
    @if (loading$ | async) {
      <mat-progress-bar mode="indeterminate"
                        class="table-loading-bar"
                        aria-label="Loading events">
      </mat-progress-bar>
    }

    <!-- Content switching: empty states vs table -->
    @if (!(loading$ | async) && (events$ | async)?.length === 0) {
      @if (hasActiveFilters()) {
        <app-empty-state mode="no-results"
                         (clearFilters)="onClearFilters()">
        </app-empty-state>
      } @else {
        <app-empty-state mode="no-data">
        </app-empty-state>
      }
    } @else {
      <!-- Existing table markup here -->
      <table mat-table ...>
        ...
      </table>
      <mat-paginator ...></mat-paginator>
    }
  </div>
</app-glass-panel>
```

### Progress Bar Styling

```scss
// In events-table.component.scss — ADD
.table-loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;

  // Glass-themed accent color
  ::ng-deep .mdc-linear-progress__bar-inner {
    border-color: var(--accent);
  }
  ::ng-deep .mdc-linear-progress__buffer-bar {
    background-color: rgba(124, 58, 237, 0.1);
  }
}
```

### CSS Variable Additions Needed

No new CSS variables needed — all existing tokens in `_variables.scss` cover this component's needs:
- Empty state icon: `--text-secondary`
- Empty state title: `--text-primary`, `--text-md`
- Empty state subtitle: `--text-secondary`, `--text-sm`
- Clear button: `--accent`
- Progress bar: `--accent` (#7c3aed)

### Detecting Active Filters in Events Table

The events-table component needs to determine if filters are active. Pattern:

```typescript
// In events-table.component.ts — ADD
private filters$ = this.store.select(selectEventsFilters);

hasActiveFilters = signal(false);

constructor() {
  // Update hasActiveFilters when filters change
  this.filters$.pipe(
    takeUntilDestroyed(),
  ).subscribe(filters => {
    this.hasActiveFilters.set(
      !!(filters.type || filters.userId || filters.description || filters.from || filters.to)
    );
  });
}

onClearFilters(): void {
  this.store.dispatch(EventsActions.changeFilter({ filter: {} }));
}
```

### Reusability for Future Stories

This EmptyStateComponent will be referenced by:
- **Story 4.5 (Row Insert Animation):** The `no-results` empty state may appear when new event is hidden by filters — the toast notification system handles this separately, but the empty state component is the visual fallback
- **Story 5.1 (Responsive Layout):** Empty state needs to adapt to mobile/tablet breakpoints (centered text works across all breakpoints, no special responsive handling needed)

### Project Structure Notes

```
src/frontend/src/app/
├── features/
│   ├── events-table/                  # MODIFY — add loading + empty state integration
│   │   ├── events-table.component.ts   # Add imports, hasActiveFilters, onClearFilters
│   │   ├── events-table.component.html # Add mat-progress-bar + empty state conditionals
│   │   ├── events-table.component.scss # Add progress bar styling
│   │   └── events-table.component.spec.ts # Add loading/empty state tests
│   ├── events-filter/                  # Existing — reference for clearFilters pattern
│   └── event-form/                     # Existing — no changes needed
├── store/events/                       # Existing — NO CHANGES NEEDED
│   ├── events.actions.ts               # changeFilter already exists
│   ├── events.reducer.ts               # loading state management exists
│   ├── events.effects.ts               # loadEvents effect exists
│   └── events.selectors.ts            # selectEventsLoading, selectEventsFilters exist
├── shared/
│   ├── components/
│   │   ├── empty-state/                # THIS STORY — create new
│   │   │   ├── empty-state.component.ts
│   │   │   ├── empty-state.component.html
│   │   │   ├── empty-state.component.scss
│   │   │   └── empty-state.component.spec.ts
│   │   ├── glass-panel/                # Existing — used by events-table
│   │   └── event-type-chip/            # Existing — no changes needed
│   └── models/
│       ├── event-filter.model.ts       # EventFilter interface — reference
│       └── event.model.ts              # EventType enum — not needed for this story
└── app.component.ts                    # NO CHANGES NEEDED
```

**Alignment with Architecture Doc:**
- EmptyStateComponent location: `shared/components/empty-state/` — matches architecture's shared component structure
- File naming: kebab-case throughout — matches enforcement rule #1
- Standalone component — matches enforcement rule #9
- CSS custom properties — matches enforcement rule #12
- NgRx state management — matches ADR-5

### Previous Story Intelligence

**From Story 3.5 (Events Filter Bar & Reactive Filtering — in-progress):**
- `hasActiveFilters` pattern: uses a boolean property updated on form `valueChanges` — events-table can use a similar approach with `selectEventsFilters` selector
- `clearFilters()` method: dispatches `EventsActions.changeFilter({ filter: {} })` — same dispatch for events-table's empty state clear button
- Filter state lives in NgRx store — accessible from any component via selectors

**From Story 3.4 (EventTypeChip Component — review):**
- Pure presentational component pattern with `@Input()` — EmptyStateComponent follows same pattern with `mode` input
- Standalone component with minimal imports — same architecture approach

**From Story 3.3 (Events Table Component — review):**
- `loading$` observable already bound to `selectEventsLoading` — just needs template usage
- `events$` observable already bound to `selectEvents` — check `.length === 0` for empty
- Table uses `<app-glass-panel>` wrapper — empty state renders INSIDE the same panel
- `MatSort` and `mat-paginator` integration — both should be hidden when empty state shows

**From Story 3.2 (NgRx Events Store — review):**
- `loadEvents` action → reducer sets `loading: true` synchronously → change detection renders `mat-progress-bar` in < 16ms (satisfies NFR-P5's 200ms requirement)
- `loadEventsSuccess` action → reducer sets `loading: false`, updates `items` — template switches from loading to content/empty

**From Story 1.6 (Angular SPA Foundation — review):**
- CSS custom properties in `_variables.scss` — all tokens available
- Material overrides in `_material-overrides.scss` — add progress bar accent color if needed
- `provideAnimationsAsync()` in `app.config.ts` — animations available for mat-progress-bar

### Git Intelligence

Recent commit pattern: `feat: {story-key} - {Story Title}`
```
99d4596 feat: 3-4-event-type-chip-component - EventTypeChip Component
ce3df04 feat: 3-3-events-table-component - Events Table Component
3f6c3db feat: 3-2-ngrx-events-store-and-data-fetching - NgRx Events Store & Data Fetching
```

Commit this story as: `feat: 3-6-loading-and-empty-states - Loading & Empty States`

### Latest Tech Notes

**Angular Material 19 — MatProgressBar:**
- Import `MatProgressBarModule` from `@angular/material/progress-bar`
- `mode="indeterminate"` — continuous animation with no definite progress percentage
- Bar color inherits from Angular Material theme's primary color — override with custom CSS for accent violet
- Built-in `aria-label` support — add `aria-label="Loading events"` for accessibility
- The progress bar renders as a thin horizontal line — perfect for above-table placement

**Angular 19 — Signal Inputs & Outputs:**
- `input()` function from `@angular/core` creates signal-based inputs (preferred over `@Input()` decorator in Angular 19)
- `output()` function from `@angular/core` creates output events (preferred over `@Output()` decorator)
- `@if` / `@else` control flow blocks replace `*ngIf` structural directives
- `takeUntilDestroyed()` from `@angular/core/rxjs-interop` for automatic cleanup

**EmptyStateComponent Design Pattern:**
- Two-variant approach: single component with `mode` input switching between states
- Host binding `role="status"` — screen readers announce content changes without interruption
- Ghost button for "Clear all filters" — low visual weight, clear affordance
- Icon sizing: 48px for empty state prominence — matches UX spec

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6 Loading & Empty States]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Loading & Empty State Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty State — No Data (First Use)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty State — No Results (Filters Active)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Loading States]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 State Management — NgRx Store]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6 Server-Side Pagination]
- [Source: _bmad-output/planning-artifacts/architecture.md#Loading States — NgRx property mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines rules #1, #5, #9, #12]
- [Source: _bmad-output/planning-artifacts/architecture.md#Angular Project structure — shared/components/empty-state/]
- [Source: _bmad-output/planning-artifacts/prd.md#FR12 Loading indicator]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P5 Loading < 200ms]
- [Source: src/frontend/src/app/store/events/events.selectors.ts — selectEventsLoading, selectEventsFilters, selectEvents]
- [Source: src/frontend/src/app/store/events/events.actions.ts — changeFilter action]
- [Source: src/frontend/src/app/store/events/events.reducer.ts — loading state management]
- [Source: src/frontend/src/app/features/events-table/ — existing table component to modify]
- [Source: src/frontend/src/app/features/events-filter/events-filter.component.ts — hasActiveFilters + clearFilters patterns]
- [Source: src/frontend/src/app/shared/components/glass-panel/ — GlassPanelComponent wrapper]
- [Source: src/frontend/src/styles/_variables.scss — CSS custom properties]
- [Source: src/frontend/src/styles/_material-overrides.scss — Material dark theme overrides]

## Change Log

- 2026-02-24: Implemented all 7 tasks for Loading & Empty States story. Created EmptyStateComponent with no-data and no-results modes, integrated mat-progress-bar loading indicator and empty state display logic into EventsTableComponent, added comprehensive unit tests (128 total pass), all accessibility requirements met, build/lint/tests verified.
- 2026-02-24: Code review fixes — (H1) `changeFilter` reducer now sets `loading: true` immediately so progress bar appears within 16ms of filter change, not after 300ms debounce. (H2) `changeFilter({ filter: {} })` now resets filters completely (empty object = replace, not merge). (M1) Table wrapper gets `.loading` CSS class during loading (opacity 0.4 + pointer-events none) to clearly indicate stale content. Added 2 new tests for loading class behavior and clear-filters UX flow.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed lint error: `@angular-eslint/template/no-negated-async` — changed `!(loading$ | async)` to `(loading$ | async) === false`
- Fixed type error in test: used `EventType.Click` enum instead of string `'Click'` for filter selector override

### Completion Notes List

- EmptyStateComponent created as standalone component with signal-based input/output (Angular 19 pattern)
- Two modes: `no-data` (outbox icon + subtitle) and `no-results` (search_off icon + clear filters button)
- Loading indicator uses `mat-progress-bar mode="indeterminate"` absolutely positioned above table content
- Progress bar styled with Glass-themed accent color via CSS custom properties
- `hasActiveFilters` signal in EventsTableComponent subscribes to `selectEventsFilters` selector
- `onClearFilters()` dispatches `EventsActions.changeFilter({ filter: {} })`
- Template uses `@if`/`@else` Angular 19 control flow blocks (no `*ngIf`)
- All accessibility: `role="status"` on host, `aria-label` on progress bar and clear button
- 128 total tests pass (6 new: 2 loading, 3 empty state, 1 clear filters)
- Build succeeds, lint 0 errors

### File List

- src/frontend/src/app/shared/components/empty-state/empty-state.component.ts (new)
- src/frontend/src/app/shared/components/empty-state/empty-state.component.html (new)
- src/frontend/src/app/shared/components/empty-state/empty-state.component.scss (new)
- src/frontend/src/app/shared/components/empty-state/empty-state.component.spec.ts (new)
- src/frontend/src/app/features/events-table/events-table.component.ts (modified)
- src/frontend/src/app/features/events-table/events-table.component.html (modified)
- src/frontend/src/app/features/events-table/events-table.component.scss (modified)
- src/frontend/src/app/features/events-table/events-table.component.spec.ts (modified)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)
- _bmad-output/implementation-artifacts/3-6-loading-and-empty-states.md (modified)
