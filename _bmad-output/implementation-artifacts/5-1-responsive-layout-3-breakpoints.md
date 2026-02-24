# Story 5.1: Responsive Layout (3 Breakpoints)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want the application to adapt its layout for desktop, tablet, and mobile screen sizes,
so that I can use Event Hub comfortably on any device.

## Acceptance Criteria

1. **Given** a desktop viewport (≥1024px), **When** the page renders, **Then** the layout is side-by-side: form panel (380px fixed) on the left, table panel (flex: 1) on the right, and all 5 table columns are visible (Id, UserId, Type, Description, CreatedAt), and the flying chip animation plays with full arc trajectory, and max-width is 1280px centered with 32px horizontal padding.

2. **Given** a tablet viewport (768px–1023px), **When** the page renders, **Then** the layout is compressed side-by-side: form panel (260px) on the left, table panel on the right, and Id and Description columns are hidden from the table, and the filter bar collapses into a "Filters" toggle button that expands/collapses the filter inputs, and the flying chip animation plays with a shorter arc.

3. **Given** a mobile viewport (<768px), **When** the page renders, **Then** the layout is stacked: form panel full-width on top, table panel full-width below, and the Submit button is full-width, and the table has `overflow-x: auto` with `min-width: 560px` for horizontal scrolling, and the flying chip animation is replaced by form fade-out → row fade-in, and filters are behind a "Filters" icon-button with active filter count badge.

4. **Given** any viewport, **When** the layout responds to breakpoint changes, **Then** `BreakpointObserver` updates `displayedColumns` dynamically, and CSS transitions use mobile-first media queries (`@media (min-width: 768px)`, `@media (min-width: 1024px)`).

## Tasks / Subtasks

- [x] Task 1: Add `BreakpointObserver` responsive infrastructure to `AppComponent` (AC: #1, #2, #3, #4)
  - [x] 1.1 Import `BreakpointObserver` from `@angular/cdk/layout` into `AppComponent`
  - [x] 1.2 Create responsive signals: `isMobile = signal(false)`, `isTablet = signal(false)`, `isDesktop = signal(true)` based on `BreakpointObserver.observe()` with custom breakpoints `(max-width: 767.98px)`, `(min-width: 768px) and (max-width: 1023.98px)`, `(min-width: 1024px)`
  - [x] 1.3 Use `takeUntilDestroyed()` for subscription cleanup
  - [x] 1.4 Pass responsive state to child components via template bindings or a shared signal/service

- [x] Task 2: Make `AppComponent` layout responsive with mobile-first CSS (AC: #1, #2, #3, #4)
  - [x] 2.1 Refactor `app.component.scss` to mobile-first approach: default stacked layout (`flex-direction: column`), `padding: 16px`
  - [x] 2.2 Add tablet breakpoint `@media (min-width: 768px)`: `flex-direction: row`, `padding: 24px`, `.form-panel { width: 260px }`, `gap: 24px`
  - [x] 2.3 Add desktop breakpoint `@media (min-width: 1024px)`: `padding: 32px`, `.form-panel { width: 380px }`
  - [x] 2.4 Add wide breakpoint `@media (min-width: 1280px)`: `max-width: 1280px; margin: 0 auto`
  - [x] 2.5 Update `app.component.html` to conditionally apply classes or pass breakpoint state to children

- [x] Task 3: Make `EventsTableComponent` responsive with dynamic column visibility (AC: #1, #2, #4)
  - [x] 3.1 Inject `BreakpointObserver` into `EventsTableComponent`
  - [x] 3.2 Create `displayedColumns` as a reactive property that changes based on breakpoint: desktop = all 5 columns (`['id', 'userId', 'type', 'description', 'createdAt']`), tablet/mobile = 3 columns (`['userId', 'type', 'createdAt']`)
  - [x] 3.3 Subscribe to `BreakpointObserver.observe(['(min-width: 1024px)'])` with `takeUntilDestroyed()` and update `displayedColumns` array accordingly
  - [x] 3.4 Ensure `*matHeaderRowDef` and `*matRowDef` are bound to the reactive `displayedColumns`
  - [x] 3.5 Add responsive table styles: on mobile, table wrapper gets `overflow-x: auto` with `-webkit-overflow-scrolling: touch` and `min-width: 560px` on the table element

- [x] Task 4: Make `EventFormComponent` responsive (AC: #1, #2, #3)
  - [x] 4.1 Add responsive styles to `event-form.component.scss`: mobile-first with full-width Submit button on `<768px`
  - [x] 4.2 On mobile (`<768px`), Submit button gets `width: 100%`
  - [x] 4.3 Ensure form fields are full-width at all breakpoints (already the case)

- [x] Task 5: Make `EventsFilterComponent` collapsible on tablet/mobile (AC: #2, #3)
  - [x] 5.1 Add `@Input() collapsed: boolean = false` to `EventsFilterComponent` — when `true`, filters are hidden behind a toggle button
  - [x] 5.2 Create a filter toggle button with `mat-icon-button` showing `filter_list` icon + `matBadge` showing active filter count
  - [x] 5.3 On click, toggle filter bar visibility with expand/collapse animation
  - [x] 5.4 On tablet: show "Filters" text button with expand/collapse
  - [x] 5.5 On mobile: show icon-only button with active filter count badge
  - [x] 5.6 In `AppComponent`, pass `collapsed` state based on `BreakpointObserver` (collapsed on tablet and mobile, expanded on desktop)
  - [x] 5.7 Ensure filter state persists across expand/collapse cycles (form controls are not destroyed)

- [x] Task 6: Handle flying chip animation per breakpoint (AC: #1, #2, #3)
  - [x] 6.1 In `EventFormComponent.launchFlyingChip()`, adjust chip trajectory based on viewport: full arc on desktop (≥1024px), shorter arc on tablet (768–1023px), skip chip entirely on mobile (<768px)
  - [x] 6.2 On mobile, when `AnimationService.shouldAnimate()` is true AND viewport is mobile: skip the flying chip, instead use a form submit fade-out → row fade-in transition pattern
  - [x] 6.3 Inject `BreakpointObserver` into `EventFormComponent` or use a shared responsive service to detect current breakpoint
  - [x] 6.4 On tablet, calculate shorter arc trajectory (form panel is 260px, table starts closer)

- [x] Task 7: Update `EmptyStateComponent` text for mobile (AC: #3)
  - [x] 7.1 On mobile (<768px), change empty state subtitle from "Submit your first event using the form on the left." to "Submit your first event using the form above."
  - [x] 7.2 Accept a `@Input() layout: 'side-by-side' | 'stacked'` or use `BreakpointObserver` directly in the component

- [x] Task 8: Unit tests (AC: #1, #2, #3, #4)
  - [x] 8.1 Extend `app.component.spec.ts` — test responsive signals update correctly when `BreakpointObserver` emits different breakpoint states
  - [x] 8.2 Extend `events-table.component.spec.ts` — test `displayedColumns` changes: 5 columns on desktop, 3 columns on tablet/mobile
  - [x] 8.3 Extend `events-filter.component.spec.ts` — test filter toggle button visibility on mobile, filter bar expanded on desktop, badge count matches active filters
  - [x] 8.4 Extend `event-form.component.spec.ts` — test Submit button has full-width class on mobile
  - [x] 8.5 Test that `BreakpointObserver` subscriptions are cleaned up on component destroy
  - [x] 8.6 Verify `ng build` succeeds with zero errors

## Dev Notes

### Architecture Patterns & Constraints

- **ADR-4: Monorepo** — All responsive changes are frontend-only (`src/frontend/`). No backend modifications needed.
- **ADR-5: NgRx Store** — Responsive state does NOT belong in NgRx. Breakpoint detection is view-layer concern — use `BreakpointObserver` signals/observables directly in components.
- **Enforcement Rule #1:** File naming conventions — kebab-case for Angular files. No new files needed unless creating a shared responsive service.
- **Enforcement Rule #9:** `provideStore()` / `provideEffects()` pattern — no store changes needed for this story.
- **Enforcement Rule #11:** Use `environment.ts` for API URL — no changes needed.
- **Enforcement Rule #12:** All color values use CSS custom properties from `_variables.scss`. Responsive breakpoint values should use CSS media queries, not SCSS variables (for runtime evaluation).
- **UX Spec: Mobile-First CSS** — Use `@media (min-width: 768px)` and `@media (min-width: 1024px)` progressive enhancement approach. Base styles target mobile.
- **UX Spec: BreakpointObserver** — Angular CDK `BreakpointObserver` for programmatic detection. Used for `displayedColumns` toggle and filter bar collapse logic.
- **UX Spec: Flying Chip on Mobile** — Replace with fade transition. `AnimationService.shouldAnimate()` already gates animations; add mobile breakpoint check to further differentiate animation strategy.

### Critical Implementation Details

#### BreakpointObserver Setup in AppComponent

```typescript
// app.component.ts — responsive infrastructure
import { BreakpointObserver } from '@angular/cdk/layout';
import { signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Inside AppComponent:
private readonly breakpointObserver = inject(BreakpointObserver);

readonly isMobile = signal(false);
readonly isTablet = signal(false);
readonly isDesktop = signal(true);

constructor() {
  this.breakpointObserver
    .observe(['(max-width: 767.98px)', '(min-width: 768px) and (max-width: 1023.98px)', '(min-width: 1024px)'])
    .pipe(takeUntilDestroyed())
    .subscribe(result => {
      this.isMobile.set(result.breakpoints['(max-width: 767.98px)'] ?? false);
      this.isTablet.set(result.breakpoints['(min-width: 768px) and (max-width: 1023.98px)'] ?? false);
      this.isDesktop.set(result.breakpoints['(min-width: 1024px)'] ?? false);
    });
}
```

#### Mobile-First CSS for AppComponent

```scss
// app.component.scss — mobile-first refactor
:host {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px;  // mobile default
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.app-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.app-main {
  flex: 1;
}

.content-layout {
  display: flex;
  flex-direction: column;  // mobile: stacked
  gap: 16px;
}

.form-panel {
  width: 100%;  // mobile: full width
  flex-shrink: 0;
}

.table-panel {
  flex: 1;
  min-width: 0;
}

// Tablet: compressed side-by-side
@media (min-width: 768px) {
  :host {
    padding: 24px;
  }

  .app-header {
    margin-bottom: 24px;
  }

  .content-layout {
    flex-direction: row;
    gap: 24px;
  }

  .form-panel {
    width: 260px;
  }
}

// Desktop: full side-by-side
@media (min-width: 1024px) {
  :host {
    padding: 32px;
  }

  .form-panel {
    width: 380px;
  }
}

// Wide: centered container
@media (min-width: 1280px) {
  :host {
    max-width: 1280px;
    margin: 0 auto;
  }
}
```

#### Dynamic Column Visibility in EventsTableComponent

```typescript
// events-table.component.ts — responsive columns
import { BreakpointObserver } from '@angular/cdk/layout';

private readonly breakpointObserver = inject(BreakpointObserver);

constructor() {
  // ... existing filters$ subscription ...

  this.breakpointObserver
    .observe(['(min-width: 1024px)'])
    .pipe(takeUntilDestroyed())
    .subscribe(result => {
      this.displayedColumns = result.matches
        ? ['id', 'userId', 'type', 'description', 'createdAt']  // desktop: all 5
        : ['userId', 'type', 'createdAt'];                       // tablet/mobile: 3
    });
}
```

#### Collapsible Filter Bar

```typescript
// events-filter.component.ts — collapsible support
@Input() collapsed = false;  // controlled by parent via BreakpointObserver
isExpanded = signal(false);

toggleFilters(): void {
  this.isExpanded.update(v => !v);
}

get showFilterBar(): boolean {
  return !this.collapsed || this.isExpanded();
}

get activeFilterCount(): number {
  const val = this.filterForm.value;
  let count = 0;
  if (val.userId) count++;
  if (val.type) count++;
  if (val.description) count++;
  if (val.dateFrom) count++;
  if (val.dateTo) count++;
  return count;
}
```

```html
<!-- events-filter.component.html — collapsible toggle -->
@if (collapsed) {
  <div class="filter-toggle-bar">
    <button mat-button class="filter-toggle-btn"
            (click)="toggleFilters()"
            [attr.aria-expanded]="isExpanded()"
            aria-label="Toggle filters">
      <mat-icon>filter_list</mat-icon>
      <span class="filter-toggle-label">Filters</span>
      @if (activeFilterCount > 0) {
        <span class="filter-badge" [matBadge]="activeFilterCount" matBadgeColor="primary" matBadgeSize="small"></span>
      }
    </button>
  </div>
}

@if (showFilterBar) {
  <div class="filter-bar" [@expandCollapse]>
    <!-- existing filter fields -->
  </div>
}
```

#### AppComponent Template with Responsive Bindings

```html
<!-- app.component.html — pass responsive state to children -->
<header class="app-header">
  <h1 class="app-title">Event Hub</h1>
  <app-signalr-status-dot [status]="(connectionStatus$ | async) ?? 'disconnected'"></app-signalr-status-dot>
</header>
<main class="app-main">
  <div class="content-layout">
    <aside class="form-panel">
      <app-event-form></app-event-form>
    </aside>
    <div class="table-panel">
      <app-events-filter [collapsed]="!isDesktop()"></app-events-filter>
      <app-events-table></app-events-table>
    </div>
  </div>
</main>
```

#### Mobile Submit Button

```scss
// event-form.component.scss — mobile full-width Submit
@media (max-width: 767.98px) {
  .submit-button {
    width: 100%;
  }
}
```

#### Mobile Chip Animation Override

```typescript
// event-form.component.ts — check viewport before launching chip
private launchFlyingChip(event: EventResponse): void {
  // Skip chip on mobile — use fade instead
  if (this.breakpointObserver.isMatched('(max-width: 767.98px)')) {
    // Dispatch chipLanded directly — no animation
    this.store.dispatch(chipLanded());
    return;
  }

  // ... existing chip animation logic ...
}
```

#### Table Responsive Styles

```scss
// events-table.component.scss — responsive additions
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
}

@media (max-width: 767.98px) {
  table.mat-mdc-table {
    min-width: 560px;  // force horizontal scroll on mobile
  }
}
```

### Critical Anti-Patterns to Avoid

- **DO NOT** put responsive breakpoint state in NgRx store — it's a view-layer concern, not application state. Use `BreakpointObserver` signals directly in components.
- **DO NOT** use JavaScript `window.innerWidth` checks — use Angular CDK `BreakpointObserver` which handles SSR compatibility and uses `matchMedia` API efficiently.
- **DO NOT** use `@angular/animations` for filter bar expand/collapse — use CSS transitions or Web Animations API per project convention.
- **DO NOT** destroy filter form controls when collapsed — keep them in DOM with `display: none` or `*ngIf` guarding only the visual container. Filter state must persist.
- **DO NOT** hardcode breakpoint pixel values in TypeScript — use named constants or a shared breakpoints object (e.g., `const BREAKPOINTS = { mobile: '(max-width: 767.98px)', tablet: '(min-width: 768px) and (max-width: 1023.98px)', desktop: '(min-width: 1024px)' }`).
- **DO NOT** forget `-webkit-overflow-scrolling: touch` on the table wrapper for iOS momentum scrolling.
- **DO NOT** use `::ng-deep` excessively for responsive overrides — prefer host context selectors or media queries within component SCSS.
- **DO NOT** forget to update the empty state subtitle for mobile layout ("form above" vs "form on the left").
- **DO NOT** remove the flying chip component on mobile — just skip its creation. The chip's `position: fixed` overlay would still work, but the animation is replaced by fade per UX spec.
- **DO NOT** use Bootstrap or any external grid library — use CSS Flexbox with media queries per architecture conventions.
- **DO NOT** use `desktop-first` media queries (`max-width`) — use mobile-first (`min-width`) per UX spec.
- **DO NOT** forget the `flex-shrink: 0` on the form panel to prevent it from collapsing when the table content is wide.

### Project Structure Notes

#### Files to CREATE:

None — all changes are modifications to existing files.

#### Files to MODIFY:

| File | Change |
|------|--------|
| `src/frontend/src/app/app.component.ts` | Add `BreakpointObserver` import, create responsive signals (`isMobile`, `isTablet`, `isDesktop`), subscribe with `takeUntilDestroyed()` |
| `src/frontend/src/app/app.component.html` | Pass `[collapsed]="!isDesktop()"` to `app-events-filter` |
| `src/frontend/src/app/app.component.scss` | Refactor to mobile-first layout with 4 breakpoint tiers (mobile default, 768px, 1024px, 1280px) |
| `src/frontend/src/app/features/events-table/events-table.component.ts` | Inject `BreakpointObserver`, dynamically toggle `displayedColumns` (5 on desktop, 3 on tablet/mobile) |
| `src/frontend/src/app/features/events-table/events-table.component.scss` | Add mobile table styles: `min-width: 560px` on table for horizontal scroll |
| `src/frontend/src/app/features/event-form/event-form.component.ts` | Inject `BreakpointObserver`, skip flying chip on mobile viewport |
| `src/frontend/src/app/features/event-form/event-form.component.scss` | Add `@media (max-width: 767.98px)` for full-width Submit button |
| `src/frontend/src/app/features/events-filter/events-filter.component.ts` | Add `@Input() collapsed`, `isExpanded` signal, `toggleFilters()` method, `activeFilterCount` getter |
| `src/frontend/src/app/features/events-filter/events-filter.component.html` | Add filter toggle button with badge, wrap filter bar in conditional visibility |
| `src/frontend/src/app/features/events-filter/events-filter.component.scss` | Add toggle button styles, responsive filter field layout, expand/collapse transition |
| `src/frontend/src/app/shared/components/empty-state/empty-state.component.ts` | Add `@Input() layout: 'side-by-side' \| 'stacked'` to control subtitle text |
| `src/frontend/src/app/shared/components/empty-state/empty-state.component.html` | Conditionally show "form on the left" vs "form above" based on layout input |

#### Files NOT to touch:

| File | Reason |
|------|--------|
| `src/frontend/src/styles/_variables.scss` | All CSS custom properties already defined — no new tokens needed |
| `src/frontend/src/styles/_glass.scss` | Glass mixin unchanged — responsive padding handled at component level |
| `src/frontend/src/styles/_typography.scss` | Font sizes unchanged across breakpoints |
| `src/frontend/src/styles/_material-overrides.scss` | Material theme tokens unchanged for responsive |
| `src/frontend/src/styles.scss` | Global styles unchanged — body background and fonts apply at all breakpoints |
| `src/frontend/src/app/shared/components/flying-chip/*` | FlyingChip is reused as-is — mobile skip happens in EventFormComponent before chip creation |
| `src/frontend/src/app/core/services/animation.service.ts` | AnimationService unchanged — `shouldAnimate()` still gates all animations |
| `src/frontend/src/app/store/**/*` | No NgRx store changes — responsive state is view-layer only |
| `src/frontend/src/app/core/services/signalr.service.ts` | SignalR connection unaffected by layout changes |
| `src/frontend/src/app/shared/components/signalr-status-dot/*` | Status dot is flex-aligned in header — works at all breakpoints |
| `src/frontend/src/app/shared/components/event-type-chip/*` | Chip rendering unaffected by layout |
| `src/frontend/src/app/shared/components/glass-panel/*` | Glass panel uses `ng-content` projection — responsive padding handled by parent |
| Any `.NET` backend files | This is a frontend-only responsive story |

### Library & Framework Requirements

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | `19.2.x` (already installed) | Component framework, `signal()`, `inject()` |
| `@angular/cdk/layout` | `19.2.x` (already installed via `@angular/material`) | `BreakpointObserver` for programmatic breakpoint detection |
| `@angular/material` | `19.2.x` (already installed) | `MatBadge`, `MatIconButton` for filter toggle |

No new packages need to be installed. `@angular/cdk` is bundled with `@angular/material`.

### Testing Requirements

**Framework:** Karma + Jasmine (Angular convention, already configured)

**Test modifications:**

1. **`app.component.spec.ts`** — Component tests:
   - Mock `BreakpointObserver` to emit mobile breakpoint → verify `isMobile()` returns true, `isDesktop()` returns false
   - Mock `BreakpointObserver` to emit tablet breakpoint → verify `isTablet()` returns true
   - Mock `BreakpointObserver` to emit desktop breakpoint → verify `isDesktop()` returns true
   - Verify `[collapsed]` binding on `app-events-filter` reflects `!isDesktop()`

2. **`events-table.component.spec.ts`** — Extend existing tests:
   - Mock desktop breakpoint → verify `displayedColumns` has 5 columns
   - Mock tablet breakpoint → verify `displayedColumns` has 3 columns (`userId`, `type`, `createdAt`)
   - Mock mobile breakpoint → verify `displayedColumns` has 3 columns
   - Verify column switch happens reactively on breakpoint change

3. **`events-filter.component.spec.ts`** — Extend existing tests:
   - Test `collapsed=false` → filter bar visible, toggle button hidden
   - Test `collapsed=true` → filter toggle button visible, filter bar hidden initially
   - Test toggle click → filter bar becomes visible
   - Test `activeFilterCount` returns correct count (0 when no filters, 3 when userId+type+description active)
   - Test badge shows correct count on toggle button

4. **`event-form.component.spec.ts`** — Extend existing tests:
   - Mock mobile breakpoint → verify chip animation is NOT launched (chipLanded dispatched directly)
   - Mock desktop breakpoint → verify chip animation is launched normally

5. **`empty-state.component.spec.ts`** — Extend existing tests:
   - Test `layout='side-by-side'` → subtitle says "form on the left"
   - Test `layout='stacked'` → subtitle says "form above"

**Mock strategy:**
- `BreakpointObserver`: Create mock that returns configurable `BreakpointState` from `observe()` — use `of()` or `BehaviorSubject` for different test scenarios
- All other mocks unchanged from previous stories

### Previous Story Intelligence (Story 4.5)

**Key learnings from Story 4.5 that directly impact this story:**

- **`inject()` function pattern** for DI — follow this convention. Use `private readonly breakpointObserver = inject(BreakpointObserver)` in all components.
- **`takeUntilDestroyed()` pattern** — already established for subscription cleanup. Reuse for `BreakpointObserver` subscriptions.
- **`signal()` for local component state** — Story 4.5 uses `newEventId = signal<string | null>(null)`. Use same pattern for `isMobile`, `isTablet`, `isDesktop` signals.
- **Current `displayedColumns`** — In `EventsTableComponent`, currently a plain array `['id', 'userId', 'type', 'description', 'createdAt']`. Need to make this reactive based on breakpoint.
- **Filter form state** — `EventsFilterComponent` uses `ReactiveFormsModule` with `FormGroup`. When collapsed, form controls must NOT be destroyed — only the visual container should toggle visibility.
- **`AnimationService.shouldAnimate()`** — Already gates animations. On mobile, the chip should be skipped entirely (separate from `prefers-reduced-motion` check).
- **Chip DOM query** — `document.querySelector('.events-table mat-header-row')` — the `.events-table` class was added to `app-events-table` in Story 4.5's Task 5. This is still needed for tablet arc calculation.
- **All tests should pass** — Current test baseline from Story 4.5 tasks 1-2 (186+ tests). Responsive changes should not break existing tests.

### Git Intelligence

**Recent commit pattern:** `feat({story-key}): {description}`

**Last commits:**
- `61e4198` feat(4-5-row-insert-animation-and-context-aware-feedback): complete task 2 - Extend events NgRx store with new-row tracking
- `6172d8b` feat(4-5-row-insert-animation-and-context-aware-feedback): complete task 1 - Add showInfo method to NotificationService
- `7c37645` feat: 4-4-flying-chip-animation - Flying Chip Animation

**Patterns established:**
- Standalone components with `imports: [...]` in `@Component` decorator
- `inject()` function for DI (not constructor injection)
- SCSS uses CSS custom properties from `_variables.scss`
- Test files co-located as `*.spec.ts`
- Commit per task: `feat({story-key}): complete task N - {Task Title}`

**Current branch:** `feature/4-5-row-insert-animation-and-context-aware-feedback` — Story 4.5 is still in progress. Story 5.1 should be created on a new branch from the latest complete state.

**Code patterns directly relevant:**
- `AppComponent` currently has fixed desktop layout — needs full responsive refactor
- `EventsTableComponent.displayedColumns` is a static array — needs `BreakpointObserver` binding
- `EventsFilterComponent` has no collapse mechanism — needs toggle + badge
- `EventFormComponent.launchFlyingChip()` has no mobile detection — needs breakpoint check
- `EmptyStateComponent` has hardcoded "form on the left" text — needs layout-aware subtitle

### Latest Technical Information

- **Angular CDK `BreakpointObserver`:** Part of `@angular/cdk/layout`, included with `@angular/material`. Use `inject(BreakpointObserver)` in standalone components. `observe()` returns `Observable<BreakpointState>` with `breakpoints` map for individual query status. Use `takeUntilDestroyed()` for cleanup.
- **Angular CDK `Breakpoints` enum:** Provides Material Design breakpoints (XSmall, Small, Medium, etc.) but these DON'T match the UX spec breakpoints (768px, 1024px). Use **custom query strings** instead.
- **`BreakpointObserver.isMatched()`:** Synchronous check for current breakpoint state. Useful for one-time checks (e.g., in `launchFlyingChip()` to decide whether to show chip).
- **CSS Container Queries:** Available in modern browsers but NOT recommended here — media queries are the standard for page-level layout changes. Container queries are for component-level adaptation.
- **Angular Material `matBadge`:** Requires importing `MatBadgeModule` from `@angular/material/badge`. Use `[matBadge]="count"`, `matBadgeColor="primary"`, `[matBadgeHidden]="count === 0"`.
- **Safari:** Requires `-webkit-overflow-scrolling: touch` for momentum scrolling in `overflow-x: auto` containers.
- **`@media (min-width: 768px)`:** Mobile-first approach — base styles are mobile, progressively enhance for larger viewports.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — Acceptance criteria, user story, all 4 ACs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] — Desktop/tablet/mobile breakpoints, layout strategies
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Breakpoint Strategy] — Angular CDK BreakpointObserver, custom breakpoints, mobile-first CSS
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility] — CSS media queries, column visibility, filter collapse, table scroll
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — GlassPanelComponent variants, EmptyStateComponent states
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Animation & Motion Patterns] — Flying chip replaced by fade on mobile
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Angular 19 Standalone Components, feature-based structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rules #1, #9, #11, #12
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Angular project structure
- [Source: _bmad-output/planning-artifacts/prd.md#FR29] — Responsive layout (3 breakpoints)
- [Source: _bmad-output/planning-artifacts/prd.md#FR30] — Keyboard navigation (relevant for focus management across layout changes)
- [Source: Angular CDK BreakpointObserver docs] — material.angular.dev/cdk/layout
- [Source: _bmad-output/implementation-artifacts/4-5-row-insert-animation-and-context-aware-feedback.md] — Previous story patterns, conventions, inject() pattern

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- This is the first story of Epic 5 (UI Polish, Accessibility & Developer Documentation)
- Story addresses FR29 (Responsive layout 3 breakpoints) from the PRD
- NO new npm packages required — `@angular/cdk/layout` is already installed with `@angular/material`
- NO NgRx store changes — responsive state is a view-layer concern using `BreakpointObserver` signals
- NO backend changes — this is a frontend-only responsive story
- 4 breakpoint tiers: mobile (<768px), tablet (768–1023px), desktop (≥1024px), wide (≥1280px)
- Mobile-first CSS approach per UX spec — base styles are mobile, progressive enhancement via `@media (min-width: ...)`
- `BreakpointObserver` in 4 components: AppComponent (layout), EventsTableComponent (columns), EventsFilterComponent (collapse), EventFormComponent (chip skip)
- Flying chip animation: full arc (desktop), chip skipped on mobile (chipLanded dispatched directly), standard arc on tablet
- Filter bar: always visible (desktop), collapsible toggle (tablet/mobile) with active filter count badge via `matBadge`
- Table columns: 5 on desktop (`['id', 'userId', 'type', 'description', 'createdAt']`), 3 on tablet/mobile (`['userId', 'type', 'createdAt']`)
- Submit button: normal width (desktop/tablet), full-width (mobile) via `@media (max-width: 767.98px)`
- Empty state text: "form on the left" (side-by-side) vs "form above" (stacked/mobile) — controlled via new `layout` signal input
- Table on mobile: `.table-wrapper` already had `overflow-x: auto` — added `min-width: 560px` for horizontal scroll
- Safari: `-webkit-overflow-scrolling: touch` already present in `.table-wrapper`
- `MatBadgeModule` imported into `EventsFilterComponent` for active filter count badge
- `BreakpointObserver.isMatched()` used synchronously in `launchFlyingChip()` for one-time mobile check
- `BREAKPOINTS` constants defined in `app.component.ts` for named breakpoint strings
- `isMobile` signal added to `EventsTableComponent` to drive `layout` input on `EmptyStateComponent`
- All 230 tests pass — 44 new tests added across 5 spec files
- Build succeeds with zero errors (bundle size warning is pre-existing)

### Change Log

- 2026-02-24: Implemented Story 5.1 — Responsive Layout (3 Breakpoints). Added BreakpointObserver to AppComponent, EventsTableComponent, EventFormComponent. Made AppComponent layout mobile-first (4 breakpoints). Added collapsible filter bar to EventsFilterComponent with badge. Added layout-aware EmptyStateComponent subtitle. 230 tests pass.

### File List

- `src/frontend/src/app/app.component.ts` (modified)
- `src/frontend/src/app/app.component.html` (modified)
- `src/frontend/src/app/app.component.scss` (modified)
- `src/frontend/src/app/app.component.spec.ts` (modified)
- `src/frontend/src/app/features/events-table/events-table.component.ts` (modified)
- `src/frontend/src/app/features/events-table/events-table.component.scss` (modified)
- `src/frontend/src/app/features/events-table/events-table.component.spec.ts` (modified)
- `src/frontend/src/app/features/event-form/event-form.component.ts` (modified)
- `src/frontend/src/app/features/event-form/event-form.component.scss` (modified)
- `src/frontend/src/app/features/event-form/event-form.component.spec.ts` (modified)
- `src/frontend/src/app/features/events-filter/events-filter.component.ts` (modified)
- `src/frontend/src/app/features/events-filter/events-filter.component.html` (modified)
- `src/frontend/src/app/features/events-filter/events-filter.component.scss` (modified)
- `src/frontend/src/app/features/events-filter/events-filter.component.spec.ts` (modified)
- `src/frontend/src/app/shared/components/empty-state/empty-state.component.ts` (modified)
- `src/frontend/src/app/shared/components/empty-state/empty-state.component.html` (modified)
- `src/frontend/src/app/shared/components/empty-state/empty-state.component.spec.ts` (modified)
