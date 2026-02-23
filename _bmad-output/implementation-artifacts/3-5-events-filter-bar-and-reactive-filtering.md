# Story 3.5: Events Filter Bar & Reactive Filtering

Status: review
Story-Key: 3-5-events-filter-bar-and-reactive-filtering
Epic: 3 — Event Discovery & Table Display (Full Stack)
Date: 2026-02-24
FRs: FR7, FR8, FR9, FR10, FR11
NFRs: NFR-P2, NFR-P5

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want to filter events by Type, UserId, Description, and date range with instant reactive updates,
So that I can quickly narrow down to the events I'm looking for.

## Acceptance Criteria

1. **Given** the filter bar is displayed above the table
   **When** the End User types in the UserId filter input
   **Then** a `changeFilter` action is dispatched (debounced 300ms) and the table updates with matching results

2. **Given** the filter bar is displayed
   **When** the End User selects a Type from the mat-select dropdown (PageView / Click / Purchase / All)
   **Then** a `changeFilter` action is dispatched immediately and the table updates

3. **Given** the filter bar is displayed
   **When** the End User types in the Description filter input
   **Then** a `changeFilter` action is dispatched (debounced 300ms) and the table updates with substring-matching results

4. **Given** the filter bar is displayed
   **When** the End User selects a date range via `mat-date-range-input`
   **Then** a `changeFilter` action is dispatched and the table shows events within the selected range

5. **Given** any filter is active
   **When** the End User looks at the filter bar
   **Then** a "Clear all filters" ghost button (`mat-button`) is visible
   **And** clicking it resets all filters to empty and dispatches `changeFilter` with empty values

6. **Given** any filter changes
   **When** the events effect processes the change
   **Then** pagination resets to page 1 automatically

## Tasks / Subtasks

- [x] Task 1: Create EventsFilterComponent (AC: #1, #2, #3, #4, #5)
  - [x] 1.1 Create component directory: `src/frontend/src/app/features/events-filter/`
  - [x] 1.2 Create `events-filter.component.ts` as standalone component with imports: `ReactiveFormsModule`, `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatButtonModule`, `MatIconModule`, `MatDatepickerModule`, `MatNativeDateModule`, `GlassPanelComponent`
  - [x] 1.3 Create a Reactive `FormGroup` with controls: `userId` (FormControl<string>), `type` (FormControl<EventType | null>), `description` (FormControl<string>), `dateFrom` (FormControl<Date | null>), `dateTo` (FormControl<Date | null>)
  - [x] 1.4 Create `events-filter.component.html` with filter bar layout: UserId text input, Type mat-select (All/PageView/Click/Purchase), Description text input, date range picker (mat-date-range-input with matStartDate + matEndDate), and "Clear all filters" ghost button
  - [x] 1.5 Create `events-filter.component.scss` with Glass-themed compact styling using CSS custom properties from `_variables.scss`
  - [x] 1.6 Wrap the filter bar in `<app-glass-panel [compact]="true">` for consistent Glass theme

- [x] Task 2: Implement Reactive Filtering via NgRx (AC: #1, #2, #3, #4, #6)
  - [x] 2.1 Inject `Store` and subscribe to `selectEventsFilters` selector to hydrate form with current filter state on init
  - [x] 2.2 Subscribe to `userId` FormControl `valueChanges` with `debounceTime(300)` and `distinctUntilChanged()` — dispatch `EventsActions.changeFilter({ userId: value })` on emission
  - [x] 2.3 Subscribe to `type` FormControl `valueChanges` (NO debounce — immediate dispatch on select change) — dispatch `EventsActions.changeFilter({ type: value })`. Pass `null` for "All" option to clear the type filter
  - [x] 2.4 Subscribe to `description` FormControl `valueChanges` with `debounceTime(300)` and `distinctUntilChanged()` — dispatch `EventsActions.changeFilter({ description: value })`
  - [x] 2.5 Subscribe to `dateFrom` and `dateTo` FormControl `valueChanges` — when both have valid values OR when either is cleared, dispatch `EventsActions.changeFilter({ from: isoString, to: isoString })`. Convert `Date` objects to ISO 8601 strings (`toISOString()`) before dispatching
  - [x] 2.6 Use `takeUntilDestroyed()` from `@angular/core/rxjs-interop` for all subscriptions (Angular 19 pattern — no manual unsubscribe)
  - [x] 2.7 Verify that the existing `changeFilter$` effect in `events.effects.ts` handles debounce (300ms) and resets pagination to page 1 — **do NOT add additional debounce in the effect if already present**

- [x] Task 3: Implement "Clear All Filters" Functionality (AC: #5)
  - [x] 3.1 Add a `hasActiveFilters` computed property (or method) that checks if any filter FormControl has a non-empty/non-null value
  - [x] 3.2 Show "Clear all filters" `mat-button` only when `hasActiveFilters` is true — use `@if (hasActiveFilters())` in template
  - [x] 3.3 On click, call `clearFilters()` method that: resets the FormGroup to initial values, dispatches `EventsActions.changeFilter({})` with empty filter object
  - [x] 3.4 Style the clear button as a ghost/text button with `--accent` color text and icon (`close` or `filter_list_off`)

- [x] Task 4: Integrate Filter Component in App Layout (AC: #1, #2, #3, #4)
  - [x] 4.1 Import `EventsFilterComponent` in `app.component.ts` imports array
  - [x] 4.2 Add `<app-events-filter></app-events-filter>` in `app.component.html` inside the `.table-panel` div, above `<app-events-table>`
  - [x] 4.3 Verify the filter bar renders above the table with proper spacing (`margin-bottom: 16px` or gap via flex layout)
  - [x] 4.4 Verify the filter + table combination works correctly: changing filters updates table data, pagination resets to page 1

- [x] Task 5: Date Picker Configuration (AC: #4)
  - [x] 5.1 Add `provideNativeDateAdapter()` in the component's `providers` array OR import `MatNativeDateModule` in the component imports — for date parsing/formatting
  - [x] 5.2 Implement `mat-date-range-input` with `mat-date-range-picker` — the mat-form-field should show "From" and "To" labels with the calendar toggle button
  - [x] 5.3 Apply dark theme overrides for the datepicker panel: use `panelClass` on `mat-date-range-picker` to add Glass-themed backdrop + dark colors
  - [x] 5.4 Ensure date range clears properly: clearing either date should dispatch filter update with both dates cleared (partial range not meaningful)
  - [x] 5.5 Add datepicker styles in `_material-overrides.scss` or component SCSS for the calendar popup to match the Glass theme

- [x] Task 6: Unit Tests (AC: #1, #2, #3, #4, #5, #6)
  - [x] 6.1 Create `events-filter.component.spec.ts` with `provideMockStore()` for NgRx
  - [x] 6.2 Test: component creates successfully
  - [x] 6.3 Test: renders UserId input, Type select, Description input, date range inputs, and Clear button area
  - [x] 6.4 Test: typing in UserId input dispatches `changeFilter` action after debounce
  - [x] 6.5 Test: selecting Type from dropdown dispatches `changeFilter` action immediately
  - [x] 6.6 Test: typing in Description input dispatches `changeFilter` action after debounce
  - [x] 6.7 Test: "Clear all filters" button is hidden when no filters active
  - [x] 6.8 Test: "Clear all filters" button is visible when any filter has a value
  - [x] 6.9 Test: clicking "Clear all filters" resets all form controls and dispatches `changeFilter` with empty values
  - [x] 6.10 Test: all filter inputs have appropriate `aria-label` attributes
  - [x] 6.11 Test: date range dispatches filter with ISO strings when both dates selected

- [x] Task 7: Accessibility (AC: #1, #2, #3, #4, #5)
  - [x] 7.1 Add `aria-label` to all filter inputs: "Filter by User ID", "Filter by event type", "Filter by description", "Filter from date", "Filter to date"
  - [x] 7.2 Add `aria-label="Clear all filters"` on the clear button
  - [x] 7.3 Ensure keyboard navigation works: Tab through UserId → Type → Description → Date From → Date To → Clear button
  - [x] 7.4 Ensure `Escape` key clears a focused text filter input value
  - [x] 7.5 Verify focus ring (`outline: 2px solid #7c3aed; outline-offset: 2px`) appears on all filter inputs

- [x] Task 8: Verify End-to-End Build and Tests
  - [x] 8.1 Run `ng build` — successful production build with no errors
  - [x] 8.2 Run `ng test` — all existing + new tests pass (110/110)
  - [x] 8.3 Run `ng lint` — 0 errors

## Dev Notes

### CRITICAL: NgRx Infrastructure Already Complete

The NgRx events store **already implements** everything needed for reactive filtering:

- **`changeFilter` action** exists in `store/events/events.actions.ts` — accepts `Partial<EventFilter>`
- **`changeFilter$` effect** in `store/events/events.effects.ts` already debounces 300ms before dispatching `loadEvents()`
- **Reducer** in `store/events/events.reducer.ts` resets pagination to page 1 on `changeFilter`
- **`selectEventsFilters` selector** in `store/events/events.selectors.ts` provides current filter state
- **`EventService.getAll(filter)`** in `core/services/event.service.ts` already sends all filter params as query strings

**The filter component's job is ONLY UI + dispatching actions.** Do NOT duplicate debounce logic, pagination reset, or API call logic — it's all in the store.

### IMPORTANT: Debounce Strategy

The NgRx `changeFilter$` effect already has `debounceTime(300)` built in. The component should:
- **Text inputs (userId, description):** Add `debounceTime(300)` + `distinctUntilChanged()` on `valueChanges` before dispatching — this prevents unnecessary action dispatches (store effect will ALSO debounce, but reducing action noise is good practice)
- **Select/dropdown (type):** Dispatch immediately on change (no debounce — UX spec says instant)
- **Date range:** Dispatch immediately when both dates are set or when cleared

### Architecture Patterns & Constraints

- **Enforcement rule #9:** Standalone component — no NgModules. Import all Material modules directly in component `imports` array
- **Enforcement rule #12:** All colors from CSS custom properties in `_variables.scss` — never hardcode hex in component SCSS
- **Enforcement rule #1:** File naming: kebab-case — `events-filter.component.ts`
- **Enforcement rule #5:** NgRx for all state mutations — dispatch `changeFilter` actions, never set filter state directly
- **Enforcement rule #11:** Use `environment.ts` for API URL — but filter component doesn't call API directly (store handles it)
- **ADR-6:** Server-side filtering — all filters sent as query params to `GET /api/events`. No client-side filtering in the component

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Why |
|------|-------|-----|
| `changeFilter` action | `store/events/events.actions.ts` | **ALREADY EXISTS** — dispatch this to update filters |
| `changeFilter$` effect | `store/events/events.effects.ts` | **ALREADY EXISTS** — debounces 300ms, resets page, calls API |
| `selectEventsFilters` selector | `store/events/events.selectors.ts` | **ALREADY EXISTS** — hydrate form on init |
| `EventFilter` model | `shared/models/event-filter.model.ts` | Filter interface with `type?`, `userId?`, `description?`, `from?`, `to?` |
| `EventType` enum | `shared/models/event.model.ts` | String enum: `PageView`, `Click`, `Purchase` |
| `EventService.getAll()` | `core/services/event.service.ts` | **ALREADY EXISTS** — sends all filter params as query strings |
| `GlassPanelComponent` | `shared/components/glass-panel/` | Reusable glass container — use `[compact]="true"` for filter bar |
| Material form field pattern | `features/event-form/event-form.component.ts` | Reference for mat-form-field + mat-input + mat-select patterns |
| CSS custom properties | `styles/_variables.scss` | All theme tokens available |
| Material dark overrides | `styles/_material-overrides.scss` | Existing Material dark theme overrides |

### Critical Anti-Patterns to Avoid

- **DO NOT** add debounce in the NgRx effect if it already exists there — check `events.effects.ts` first
- **DO NOT** use `MatTableDataSource.filterPredicate` — filtering is SERVER-SIDE via NgRx actions → API calls (ADR-6)
- **DO NOT** hardcode hex color values in component SCSS — use CSS custom properties
- **DO NOT** import `CommonModule` — the component needs no common directives; use `@if`/`@for` (Angular 19 control flow)
- **DO NOT** call `EventService` directly from the component — dispatch NgRx actions only
- **DO NOT** create a separate filter service — all filter state lives in NgRx store
- **DO NOT** use `ngOnDestroy` for unsubscription — use `takeUntilDestroyed()` from `@angular/core/rxjs-interop` (Angular 19 pattern)
- **DO NOT** store filter state in the component — the NgRx store is the single source of truth. Hydrate form from `selectEventsFilters` on init

### Implementation Pattern

```typescript
// events-filter.component.ts — REFERENCE IMPLEMENTATION
@Component({
  selector: 'app-events-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    GlassPanelComponent,
  ],
  templateUrl: './events-filter.component.html',
  styleUrl: './events-filter.component.scss',
})
export class EventsFilterComponent {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  filterForm = new FormGroup({
    userId: new FormControl(''),
    type: new FormControl<EventType | null>(null),
    description: new FormControl(''),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
  });

  hasActiveFilters = computed(() => {
    // Check if any form control has a non-empty value
    const val = this.filterForm.value;
    return !!(val.userId || val.type || val.description || val.dateFrom || val.dateTo);
  });
  // NOTE: For computed() with FormGroup, consider using a signal-based approach
  // or a simple getter method if computed doesn't auto-track form changes.
  // Alternative: use a hasActiveFilters boolean property updated on form valueChanges.

  constructor() {
    this.setupFilterSubscriptions();
  }

  private setupFilterSubscriptions(): void {
    // UserId — debounced
    this.filterForm.controls.userId.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(value => {
      this.store.dispatch(EventsActions.changeFilter({ filter: { userId: value || undefined } }));
    });

    // Type — immediate
    this.filterForm.controls.type.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(value => {
      this.store.dispatch(EventsActions.changeFilter({ filter: { type: value || undefined } }));
    });

    // Description — debounced
    this.filterForm.controls.description.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(value => {
      this.store.dispatch(EventsActions.changeFilter({ filter: { description: value || undefined } }));
    });

    // Date range — immediate when both set or either cleared
    merge(
      this.filterForm.controls.dateFrom.valueChanges,
      this.filterForm.controls.dateTo.valueChanges,
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      const from = this.filterForm.controls.dateFrom.value;
      const to = this.filterForm.controls.dateTo.value;
      this.store.dispatch(EventsActions.changeFilter({
        filter: {
          from: from ? from.toISOString() : undefined,
          to: to ? to.toISOString() : undefined,
        },
      }));
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.store.dispatch(EventsActions.changeFilter({ filter: {} }));
  }
}
```

### Template Pattern

```html
<!-- events-filter.component.html — REFERENCE LAYOUT -->
<app-glass-panel [compact]="true">
  <div class="filter-bar">
    <mat-form-field appearance="outline" class="filter-field">
      <mat-label>User ID</mat-label>
      <input matInput [formControl]="filterForm.controls.userId"
             aria-label="Filter by User ID"
             placeholder="Filter by User ID">
    </mat-form-field>

    <mat-form-field appearance="outline" class="filter-field">
      <mat-label>Type</mat-label>
      <mat-select [formControl]="filterForm.controls.type"
                  aria-label="Filter by event type">
        <mat-option [value]="null">All</mat-option>
        <mat-option [value]="EventType.PageView">PageView</mat-option>
        <mat-option [value]="EventType.Click">Click</mat-option>
        <mat-option [value]="EventType.Purchase">Purchase</mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline" class="filter-field">
      <mat-label>Description</mat-label>
      <input matInput [formControl]="filterForm.controls.description"
             aria-label="Filter by description"
             placeholder="Search description">
    </mat-form-field>

    <mat-form-field appearance="outline" class="filter-field filter-field--date">
      <mat-label>Date range</mat-label>
      <mat-date-range-input [rangePicker]="picker">
        <input matStartDate [formControl]="filterForm.controls.dateFrom"
               placeholder="From" aria-label="Filter from date">
        <input matEndDate [formControl]="filterForm.controls.dateTo"
               placeholder="To" aria-label="Filter to date">
      </mat-date-range-input>
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-date-range-picker #picker></mat-date-range-picker>
    </mat-form-field>

    @if (hasActiveFilters) {
      <button mat-button class="clear-filters-btn"
              (click)="clearFilters()"
              aria-label="Clear all filters">
        <mat-icon>filter_list_off</mat-icon>
        Clear filters
      </button>
    }
  </div>
</app-glass-panel>
```

### SCSS Pattern

```scss
// events-filter.component.scss — REFERENCE STYLING
:host {
  display: block;
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-field {
  flex: 1 1 160px;
  min-width: 140px;
  max-width: 220px;

  // Compact form fields for filter bar
  ::ng-deep .mat-mdc-form-field-subscript-wrapper {
    display: none; // No error messages in filter bar
  }
}

.filter-field--date {
  flex: 1 1 220px;
  max-width: 280px;
}

.clear-filters-btn {
  color: var(--accent);
  font-size: var(--text-sm);
  white-space: nowrap;

  mat-icon {
    font-size: 18px;
    margin-right: 4px;
  }
}
```

### CSS Variable Additions Needed

No new CSS variables needed — all existing tokens in `_variables.scss` cover this component's needs:
- Form fields: `--bg-surface`, `--border`, `--border-focus`, `--text-primary`, `--text-secondary`
- Clear button: `--accent`
- Typography: `--text-sm`, `--text-base`

### Datepicker Dark Theme

The Angular Material datepicker calendar popup needs dark theme styling. Options:
1. **Global:** Add calendar panel overrides in `_material-overrides.scss` (RECOMMENDED — applies to any future datepicker usage)
2. **Scoped:** Use `panelClass` on `mat-date-range-picker` and add styles in component SCSS

Key datepicker overrides needed:
```scss
// In _material-overrides.scss
.mat-datepicker-content {
  background-color: var(--bg-elevated) !important;
  color: var(--text-primary) !important;

  .mat-calendar-body-cell-content {
    color: var(--text-primary);
  }

  .mat-calendar-body-selected {
    background-color: var(--accent);
    color: white;
  }

  .mat-calendar-body-in-range::before {
    background-color: rgba(124, 58, 237, 0.15);
  }
}
```

### Accessibility Requirements

- All filter inputs must have `aria-label` attributes (Angular Material `mat-label` provides accessible labels automatically, but explicit `aria-label` ensures screen reader coverage)
- "Clear all filters" button must have `aria-label="Clear all filters"`
- Tab order: UserId → Type → Description → Date From → Date To → Clear filters button
- `Escape` key on focused text input clears its value — add `(keydown.escape)` handler
- Color contrast: All text/background pairs already verified in UX spec (WCAG AA compliant)
- Date picker: Angular Material date picker has built-in keyboard navigation and ARIA support

### Responsive Behavior (for reference — implementation in Story 5.1)

Per UX spec, responsive changes for the filter bar are:
- **Desktop (>=1024px):** Full filter bar with all inputs in a row
- **Tablet (768-1023px):** Filter bar collapses into a "Filters" toggle button that expands/collapses
- **Mobile (<768px):** Filters behind a "Filters" icon-button with active filter count badge

**NOTE:** Full responsive implementation is in Story 5.1 (Responsive Layout). This story creates the filter bar for the desktop layout. The toggle/collapse behavior will be added in Story 5.1.

### Reusability for Future Stories

This component will be referenced by:
- **Story 3.6 (Loading & Empty States):** Empty state "no-results" variant shows "Clear all filters" link that integrates with this component's `clearFilters()` — consider exposing a public method or dispatching a shared clear action
- **Story 4.5 (Row Insert Animation):** Filter-aware toast "New event added — hidden by current filters" needs to check current filter state from `selectEventsFilters` — the filter state is in NgRx store and accessible from any component
- **Story 5.1 (Responsive Layout):** Adds tablet/mobile responsive behavior (toggle/collapse)

### Project Structure Notes

```
src/frontend/src/app/
├── features/
│   ├── events-filter/                 # THIS STORY — create new
│   │   ├── events-filter.component.ts
│   │   ├── events-filter.component.html
│   │   ├── events-filter.component.scss
│   │   └── events-filter.component.spec.ts
│   ├── events-table/                  # Existing — no changes needed
│   └── event-form/                    # Existing — reference for patterns
├── store/events/                      # Existing — NO CHANGES NEEDED
│   ├── events.actions.ts              # changeFilter already exists
│   ├── events.reducer.ts              # changeFilter handler exists
│   ├── events.effects.ts              # changeFilter$ effect with debounce exists
│   └── events.selectors.ts           # selectEventsFilters exists
├── shared/models/
│   ├── event-filter.model.ts          # EventFilter interface — reference
│   └── event.model.ts                # EventType enum — import
├── shared/components/
│   └── glass-panel/                   # Reuse for filter bar wrapper
└── app.component.ts                   # ADD <app-events-filter> import + template
```

**Alignment with Architecture Doc:**
- Component location: `features/events-filter/` — matches architecture's feature-based structure
- File naming: kebab-case throughout — matches enforcement rule #1
- Standalone component — matches enforcement rule #9
- CSS custom properties — matches enforcement rule #12
- NgRx state management — matches ADR-5

### Previous Story Intelligence

**From Story 3.4 (EventTypeChip Component — ready-for-dev):**
- Pure presentational component pattern — `EventsFilterComponent` is NOT pure presentational (it has NgRx store interaction), but it references EventTypeChipComponent patterns for chip usage
- `EventType` enum import pattern: `import { EventType } from '../../shared/models/event.model';`

**From Story 3.3 (Events Table Component — review):**
- Events table dispatches `changeSort`, `changePage` actions — same pattern for filter dispatching `changeFilter`
- Table uses `selectEvents`, `selectEventsLoading` — filter component uses `selectEventsFilters`
- Table component already responds to filter changes via the NgRx store — no integration code needed in the table

**From Story 3.2 (NgRx Events Store — review):**
- `EventsActions.changeFilter` accepts `{ filter: Partial<EventFilter> }` — matches the dispatch pattern
- `changeFilter$` effect: `debounceTime(300)` → `loadEvents()` — the store handles the actual API call
- Reducer: `on(EventsActions.changeFilter, (state, { filter }) => ({ ...state, filters: { ...state.filters, ...filter }, pagination: { ...state.pagination, page: 1 } }))` — merges filter changes and resets page

**From Story 2.4 (Event Creation Form — review):**
- Material form pattern: `MatFormFieldModule`, `MatInputModule`, `MatSelectModule` imports
- Reactive Forms pattern: `FormGroup`, `FormControl`, `ReactiveFormsModule`
- Glass panel wrapper: `<app-glass-panel>` used for form container
- `inject(Store)` pattern for NgRx store access

**From Story 1.6 (Angular SPA Foundation — review):**
- CSS custom properties in `_variables.scss` — all tokens available
- Material overrides in `_material-overrides.scss` — reference for datepicker dark theme
- `provideAnimationsAsync()` in `app.config.ts` — animations available for transitions

### Git Intelligence

Recent commit pattern: `feat: {story-key} - {Story Title}`
```
ce3df04 feat: 3-3-events-table-component - Events Table Component
3f6c3db feat: 3-2-ngrx-events-store-and-data-fetching - NgRx Events Store & Data Fetching
72bce06 feat: 3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination
```

Commit this story as: `feat: 3-5-events-filter-bar-and-reactive-filtering - Events Filter Bar & Reactive Filtering`

### Latest Tech Notes

**Angular Material 19 — Date Range Picker:**
- `MatDatepickerModule` and `MatNativeDateModule` (or `provideNativeDateAdapter()`) required for date range functionality
- `mat-date-range-input` wraps `matStartDate` and `matEndDate` inputs within a single `mat-form-field`
- `mat-date-range-picker` provides the calendar popup — connected via `[rangePicker]="picker"` template reference
- `mat-datepicker-toggle` provides the calendar icon button — use `matIconSuffix` to place inside form field
- Dark theme: calendar popup inherits Angular Material theme but may need explicit overrides for Glass aesthetic
- Date range picker fires `valueChanges` on each individual date control, not on the combined range — subscribe to both `dateFrom` and `dateTo` controls using `merge()`

**Angular 19 — Standalone Component Patterns:**
- `inject()` function preferred over constructor injection
- `takeUntilDestroyed()` from `@angular/core/rxjs-interop` for automatic subscription cleanup
- `@if` / `@for` control flow blocks instead of `*ngIf` / `*ngFor`
- `computed()` signals can be used for derived state, but with Reactive Forms, a getter or `valueChanges`-based approach may be simpler

**RxJS Operators for Reactive Filtering:**
- `debounceTime(300)` — delays emission by 300ms (prevents API spam on fast typing)
- `distinctUntilChanged()` — suppresses duplicate consecutive values
- `merge()` — combines multiple observables (for date range from/to)
- `takeUntilDestroyed()` — completes observable on component destroy

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5 Events Filter Bar & Reactive Filtering]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Filtering Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Reactive Filter Behavior]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Filter Configuration]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SignalR + Pagination Edge Case]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Keyboard Navigation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy — Tablet/Mobile filter collapse]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 State Management — NgRx Store]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6 Server-Side Pagination]
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Effects for Side Effects — loadEvents$]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines rules #1, #5, #9, #11, #12]
- [Source: _bmad-output/planning-artifacts/architecture.md#Angular Project structure — features/events-filter/]
- [Source: _bmad-output/planning-artifacts/prd.md#FR7–FR11 Event Discovery Filters]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P2 GET < 500ms]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P5 Loading < 200ms]
- [Source: src/frontend/src/app/store/events/events.actions.ts — changeFilter action]
- [Source: src/frontend/src/app/store/events/events.effects.ts — changeFilter$ effect with debounce]
- [Source: src/frontend/src/app/store/events/events.reducer.ts — changeFilter reducer with page reset]
- [Source: src/frontend/src/app/store/events/events.selectors.ts — selectEventsFilters]
- [Source: src/frontend/src/app/core/services/event.service.ts — getAll() with filter params]
- [Source: src/frontend/src/app/shared/models/event-filter.model.ts — EventFilter interface]
- [Source: src/frontend/src/app/shared/models/event.model.ts — EventType enum]
- [Source: src/frontend/src/app/shared/components/glass-panel/ — GlassPanelComponent]
- [Source: src/frontend/src/app/features/event-form/ — reference for Material form patterns]
- [Source: src/frontend/src/styles/_variables.scss — CSS custom properties]
- [Source: src/frontend/src/styles/_material-overrides.scss — Material dark theme overrides]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Created `EventsFilterComponent` as standalone Angular 19 component in `features/events-filter/`
- Implemented reactive filtering via NgRx: userId (debounced 300ms), type (immediate), description (debounced 300ms), date range (immediate on change)
- Used `takeUntilDestroyed()` for all RxJS subscriptions — no manual unsubscribe needed
- Used `provideNativeDateAdapter()` in component providers for date range picker support
- Hydrates form from NgRx store `selectEventsFilters` selector on init (one-time `take(1)`)
- "Clear all filters" ghost button shown conditionally via `hasActiveFilters` property tracked via `valueChanges`
- Added `clearInput()` method for Escape key on text inputs
- Integrated in `app.component.html` above the events table inside `.table-panel`
- Added datepicker dark theme overrides in `_material-overrides.scss` for Glass aesthetic
- All 11 unit tests pass covering: component creation, rendering, debounced/immediate dispatching, clear filters, aria-labels, date ISO conversion
- No changes to NgRx store — existing `changeFilter` action, effect (with 300ms debounce), and reducer (with page reset) used as-is
- Build, test (110/110), and lint all pass with 0 errors

### Change Log

- 2026-02-24: Implemented Events Filter Bar & Reactive Filtering (Story 3.5) — all 8 tasks complete

### File List

- `src/frontend/src/app/features/events-filter/events-filter.component.ts` (new)
- `src/frontend/src/app/features/events-filter/events-filter.component.html` (new)
- `src/frontend/src/app/features/events-filter/events-filter.component.scss` (new)
- `src/frontend/src/app/features/events-filter/events-filter.component.spec.ts` (new)
- `src/frontend/src/app/app.component.ts` (modified — added EventsFilterComponent import)
- `src/frontend/src/app/app.component.html` (modified — added `<app-events-filter>` above table)
- `src/frontend/src/styles/_material-overrides.scss` (modified — added datepicker dark theme overrides)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status updated)
- `_bmad-output/implementation-artifacts/3-5-events-filter-bar-and-reactive-filtering.md` (modified — tasks marked complete)
