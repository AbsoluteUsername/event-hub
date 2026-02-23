# Story 3.3: Events Table Component

Status: review
Story-Key: 3-3-events-table-component
Epic: 3 — Event Discovery & Table Display (Full Stack)
Date: 2026-02-24

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want to view stored events in a sortable, paginated table with all event fields displayed,
So that I can browse and explore event data efficiently.

## Acceptance Criteria

1. **Given** events are loaded from the API
   **When** the table renders
   **Then** it displays 5 columns: Id, UserId, Type, Description, CreatedAt
   **And** Id column shows truncated GUID (first 8 characters + "…") in JetBrains Mono font with `matTooltip` showing the full GUID on hover
   **And** UserId column uses JetBrains Mono font
   **And** Type column renders `EventTypeChipComponent` (color-coded pill)
   **And** CreatedAt column displays ISO 8601 UTC format in JetBrains Mono font

2. **Given** the table is displayed
   **When** the End User clicks a column header
   **Then** `MatSort` toggles sort direction (asc → desc → unsorted → default)
   **And** a `changeSort` NgRx action is dispatched
   **And** the table re-fetches from the API with new sort params

3. **Given** the table is displayed
   **When** the End User interacts with `mat-paginator`
   **Then** page size options are [10, 20, 50] with default 20
   **And** paginator shows "Items per page: [20 ▼]  1–20 of N  [‹] [›]"
   **And** a `changePage` NgRx action is dispatched on page change

4. **Given** the page loads for the first time
   **When** the events store initializes
   **Then** `loadEvents` is dispatched automatically
   **And** the table displays the first page sorted by CreatedAt descending

## Tasks / Subtasks

- [x] Task 1: Create EventTypeChipComponent (AC: #1)
  - [x] 1.1 Create `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.ts` as standalone component
  - [x] 1.2 `@Input() type: 'PageView' | 'Click' | 'Purchase'` — renders pill-shaped chip with color-coded background/text/border per type
  - [x] 1.3 PageView: bg `#1e3a5f`, text `#60a5fa`, border `1px solid #3b82f6`
  - [x] 1.4 Click: bg `#451a03`, text `#fbbf24`, border `1px solid #f59e0b`
  - [x] 1.5 Purchase: bg `#052e16`, text `#4ade80`, border `1px solid #22c55e`
  - [x] 1.6 Pill shape: `border-radius: 20px`, padding `4px 12px`, `font-size: var(--text-sm)`, `font-weight: 500`
  - [x] 1.7 Add `aria-label="Event type: {type}"` for accessibility
  - [x] 1.8 Create `event-type-chip.component.scss` with type-specific styles using `:host` CSS classes

- [x] Task 2: Create EventsTableComponent shell (AC: #1, #4)
  - [x] 2.1 Create `src/frontend/src/app/features/events-table/events-table.component.ts` as standalone component
  - [x] 2.2 Import: `MatTableModule`, `MatSortModule`, `MatPaginatorModule`, `MatTooltipModule`, `GlassPanelComponent`, `EventTypeChipComponent`, `AsyncPipe`, `DatePipe`
  - [x] 2.3 Inject `Store<AppState>` and create observables: `events$ = store.select(selectEvents)`, `totalCount$ = store.select(selectEventsTotalCount)`, `loading$ = store.select(selectEventsLoading)`, `pagination$ = store.select(selectEventsPagination)`, `sort$ = store.select(selectEventsSort)`
  - [x] 2.4 Define `displayedColumns = ['id', 'userId', 'type', 'description', 'createdAt']`
  - [x] 2.5 Dispatch `loadEvents()` action in `ngOnInit()` for initial data load

- [x] Task 3: Implement table template (AC: #1)
  - [x] 3.1 Create `events-table.component.html` with `<app-glass-panel>` wrapper
  - [x] 3.2 Add section title "Events" styled with `font-size: var(--text-lg)`, `font-weight: 600`
  - [x] 3.3 Use `<table mat-table [dataSource]="events$ | async" matSort>` — data source is the NgRx observable, NOT `MatTableDataSource`
  - [x] 3.4 Define `id` column: `<span class="mono truncated-id" [matTooltip]="element.id">{{ element.id | slice:0:8 }}…</span>`
  - [x] 3.5 Define `userId` column: `<span class="mono">{{ element.userId }}</span>`
  - [x] 3.6 Define `type` column: `<app-event-type-chip [type]="element.type"></app-event-type-chip>`
  - [x] 3.7 Define `description` column: plain text
  - [x] 3.8 Define `createdAt` column: `<span class="mono">{{ element.createdAt | date:'yyyy-MM-ddTHH:mm:ssZ' }}</span>` in ISO 8601 UTC
  - [x] 3.9 Each `mat-header-cell` uses `mat-sort-header` directive for sorting
  - [x] 3.10 Wrap table in a scrollable container div for horizontal overflow on smaller viewports

- [x] Task 4: Implement sorting (AC: #2)
  - [x] 4.1 Add `@ViewChild(MatSort) sort!: MatSort` in component
  - [x] 4.2 Listen to `(matSortChange)` event on `<table>` element
  - [x] 4.3 On sort change, dispatch `changeSort({ sortBy: event.active, sortDir: event.direction || 'desc' })` NgRx action
  - [x] 4.4 Handle empty direction (unsorted → reset to default `createdAt desc`)
  - [x] 4.5 Programmatically set initial sort state to match store defaults (`createdAt`, `desc`)

- [x] Task 5: Implement pagination (AC: #3)
  - [x] 5.1 Add `<mat-paginator>` below table with `[pageSizeOptions]="[10, 20, 50]"` and `[pageSize]="20"`
  - [x] 5.2 Bind `[length]` to `totalCount$ | async`
  - [x] 5.3 Bind `[pageIndex]` to `(pagination$ | async)?.page - 1` (mat-paginator is 0-based, API is 1-based)
  - [x] 5.4 Listen to `(page)` event: dispatch `changePage({ page: event.pageIndex + 1, pageSize: event.pageSize })` (convert back to 1-based)
  - [x] 5.5 Style paginator with Glass theme overrides (dark background, accent color)

- [x] Task 6: Implement component styling (AC: #1)
  - [x] 6.1 Create `events-table.component.scss`
  - [x] 6.2 `.mono` class: `font-family: 'JetBrains Mono', monospace; font-size: var(--mono-sm)`
  - [x] 6.3 `.truncated-id`: `max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block`
  - [x] 6.4 Table header cells: `color: var(--text-secondary); font-weight: 500; font-size: var(--text-sm)`
  - [x] 6.5 Table body cells: `color: var(--text-primary); font-size: var(--text-base); padding: 12px 16px`
  - [x] 6.6 Row hover: `background: var(--bg-elevated)` with `150ms ease-out` transition
  - [x] 6.7 Table border/divider: `border-bottom: 1px solid var(--border)` on rows
  - [x] 6.8 Apply Glass theme overrides for `mat-paginator` and `mat-sort-header`
  - [x] 6.9 `.table-wrapper` with `overflow-x: auto` for responsive horizontal scroll

- [x] Task 7: Integrate into app shell (AC: #1, #4)
  - [x] 7.1 Update `app.component.ts` — add `EventsTableComponent` to `imports` array
  - [x] 7.2 Update `app.component.html` — add `<app-events-table>` inside `.content-layout` as a `.table-panel` div next to `.form-panel`
  - [x] 7.3 Update `app.component.scss` — add `.table-panel { flex: 1; min-width: 0; }` for the table area

- [x] Task 8: Unit Tests — EventsTableComponent (AC: #1, #2, #3, #4)
  - [x] 8.1 Create `events-table.component.spec.ts`
  - [x] 8.2 Use `provideMockStore` with initial state containing sample events
  - [x] 8.3 Test: table renders 5 columns (id, userId, type, description, createdAt)
  - [x] 8.4 Test: Id column shows truncated GUID (first 8 chars + "…")
  - [x] 8.5 Test: EventTypeChipComponent renders for Type column
  - [x] 8.6 Test: sort change dispatches `changeSort` action
  - [x] 8.7 Test: page change dispatches `changePage` action
  - [x] 8.8 Test: `loadEvents` is dispatched on component init
  - [x] 8.9 Test: paginator shows correct totalCount from store

- [x] Task 9: Unit Tests — EventTypeChipComponent (AC: #1)
  - [x] 9.1 Create `event-type-chip.component.spec.ts`
  - [x] 9.2 Test: renders "PageView" with correct aria-label
  - [x] 9.3 Test: renders "Click" with correct aria-label
  - [x] 9.4 Test: renders "Purchase" with correct aria-label
  - [x] 9.5 Test: applies correct CSS class per type

- [x] Task 10: Verify End-to-End Build and Tests
  - [x] 10.1 Run `ng build` — successful production build
  - [x] 10.2 Run `ng test` — all existing + new tests pass
  - [x] 10.3 Run `ng lint` — 0 errors

## Dev Notes

### Architecture Patterns & Constraints

- **Server-Side Pagination (ADR-6):** ALL filtering, sorting, and pagination happens on the server. The Angular table component renders data from NgRx store and dispatches actions for parameter changes. It does NOT use `MatTableDataSource` for filtering/sorting — that's client-side and violates ADR-6
- **NgRx Store (ADR-5):** Table reads data from NgRx selectors. Sort/page interactions dispatch NgRx actions → effects → API calls → store updates → table re-renders
- **Clean Architecture enforcement rule #5:** Use NgRx actions for ALL state mutations — never modify store directly
- **Enforcement rule #12:** Place SCSS tokens in `src/styles/_variables.scss` — never inline magic color values. Use CSS custom properties (`--text-primary`, `--mono-sm`, `--border`, etc.)
- **Enforcement rule #1:** Follow file naming conventions exactly — kebab-case for Angular files
- **Enforcement rule #9:** Use standalone component APIs — never legacy module-based patterns
- **NFR-P5:** Loading indicator must appear within 200ms of data fetch initiation — handled by NgRx synchronous dispatch of `loading: true` in reducer (Story 3.6 will add the visual indicator)

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Why |
|------|-------|-----|
| `GlassPanelComponent` | `src/frontend/src/app/shared/components/glass-panel/` | Wrap the entire events table section — provides glass morphism container. Already has default (24px padding) and compact variants |
| `EventService.getAll()` | `src/frontend/src/app/core/services/event.service.ts` | Already implements `getAll(filter: EventFilter): Observable<PagedResult<EventResponse>>` — used by NgRx effects, NOT called from component |
| `EventResponse` model | `src/frontend/src/app/shared/models/event.model.ts` | `{ id, userId, type, description, createdAt }` — use directly for table row type |
| `EventType` enum | `src/frontend/src/app/shared/models/event.model.ts` | `PageView, Click, Purchase` — used by EventTypeChipComponent |
| `PagedResult<T>` model | `src/frontend/src/app/shared/models/paged-result.model.ts` | `{ items, totalCount, page, pageSize }` — NgRx store state shape |
| `EventFilter` interface | `src/frontend/src/app/shared/models/event-filter.model.ts` | Query params model — used by store and effects |
| NgRx events store (Story 3.2) | `src/frontend/src/app/store/events/` | `events.actions.ts`, `events.reducer.ts`, `events.selectors.ts`, `events.effects.ts` — MUST be implemented before this story |
| App shell layout | `src/frontend/src/app/app.component.*` | `.content-layout` already uses `display: flex; gap: 24px` and `.form-panel` at 380px — just add `.table-panel` next to it |
| CSS variables | `src/frontend/src/styles/_variables.scss` | All color tokens, typography tokens, spacing — reuse, never hardcode |
| Glass SCSS mixin | `src/frontend/src/styles/_glass.scss` | `@mixin glass-panel($padding)` with backdrop-filter — used by GlassPanelComponent |
| `EventFormComponent` pattern | `src/frontend/src/app/features/event-form/` | Reference for standalone component structure, NgRx store injection, async pipe usage, Glass theme styling |
| `SubmissionEffects` error pattern | `src/frontend/src/app/store/submission/submission.effects.ts` | `extractErrorMessage()` parses `{"errors": {"field": "message"}}` — reuse in EventsEffects |
| `NotificationService` | `src/frontend/src/app/core/services/notification.service.ts` | `showSuccess()`, `showError()`, `showInfo()` — for error toasts in effects |

### Critical Anti-Patterns to Avoid

- **DO NOT** use `MatTableDataSource` — that's for client-side operations. Pass `EventResponse[]` observable directly to `[dataSource]="events$ | async"` on `mat-table`
- **DO NOT** implement client-side filtering/sorting/pagination — ALL happens server-side via NgRx effects + API (ADR-6)
- **DO NOT** call `EventService.getAll()` from the component — the component dispatches NgRx actions, effects handle API calls
- **DO NOT** hardcode color values in component SCSS — use CSS custom properties from `_variables.scss`
- **DO NOT** create a new glass panel CSS — use existing `<app-glass-panel>` wrapper component
- **DO NOT** use `*ngIf` or `*ngFor` — use Angular 19 `@if` and `@for` control flow syntax
- **DO NOT** import `CommonModule` — import specific pipes (`AsyncPipe`, `DatePipe`, `SlicePipe`) individually
- **DO NOT** use `@Effect()` decorator or `StoreModule.forRoot()` — these are removed/deprecated
- **DO NOT** subscribe to NgRx store in component — use `async` pipe in template for automatic subscription management
- **DO NOT** pass `MatSort`/`MatPaginator` to `MatTableDataSource` — there IS no `MatTableDataSource`. Sort and page events dispatch NgRx actions directly
- **DO NOT** use `element.createdAt | date:'short'` — use ISO 8601 UTC format: `'yyyy-MM-ddTHH:mm:ssZ'`
- **DO NOT** forget the 0-based vs 1-based page index conversion: `mat-paginator` is 0-based, API is 1-based

### Implementation Patterns

#### Table Component with Server-Side Data (NgRx)

```typescript
// events-table.component.ts — key structure
@Component({
  selector: 'app-events-table',
  standalone: true,
  imports: [
    MatTableModule, MatSortModule, MatPaginatorModule, MatTooltipModule,
    GlassPanelComponent, EventTypeChipComponent,
    AsyncPipe, DatePipe, SlicePipe,
  ],
  templateUrl: './events-table.component.html',
  styleUrl: './events-table.component.scss',
})
export class EventsTableComponent implements OnInit {
  private readonly store = inject(Store<AppState>);

  readonly events$ = this.store.select(selectEvents);
  readonly totalCount$ = this.store.select(selectEventsTotalCount);
  readonly loading$ = this.store.select(selectEventsLoading);
  readonly pagination$ = this.store.select(selectEventsPagination);
  readonly sort$ = this.store.select(selectEventsSort);

  displayedColumns = ['id', 'userId', 'type', 'description', 'createdAt'];

  ngOnInit(): void {
    this.store.dispatch(loadEvents());
  }

  onSortChange(sortState: Sort): void {
    if (sortState.direction) {
      this.store.dispatch(changeSort({
        sortBy: sortState.active,
        sortDir: sortState.direction as 'asc' | 'desc',
      }));
    } else {
      // Reset to default sort when user clears sort
      this.store.dispatch(changeSort({ sortBy: 'createdAt', sortDir: 'desc' }));
    }
  }

  onPageChange(event: PageEvent): void {
    this.store.dispatch(changePage({
      page: event.pageIndex + 1,  // Convert 0-based to 1-based
      pageSize: event.pageSize,
    }));
  }
}
```

#### Table Template Pattern (Server-Side Data)

```html
<app-glass-panel>
  <h2 class="section-title">Events</h2>

  <div class="table-wrapper">
    <table mat-table [dataSource]="(events$ | async) ?? []" matSort
           (matSortChange)="onSortChange($event)"
           matSortActive="createdAt" matSortDirection="desc">

      <!-- Id Column -->
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Id</th>
        <td mat-cell *matCellDef="let row">
          <span class="mono truncated-id" [matTooltip]="row.id">
            {{ row.id | slice:0:8 }}…
          </span>
        </td>
      </ng-container>

      <!-- UserId Column -->
      <ng-container matColumnDef="userId">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>UserId</th>
        <td mat-cell *matCellDef="let row">
          <span class="mono">{{ row.userId }}</span>
        </td>
      </ng-container>

      <!-- Type Column -->
      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
        <td mat-cell *matCellDef="let row">
          <app-event-type-chip [type]="row.type" />
        </td>
      </ng-container>

      <!-- Description Column -->
      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Description</th>
        <td mat-cell *matCellDef="let row">{{ row.description }}</td>
      </ng-container>

      <!-- CreatedAt Column -->
      <ng-container matColumnDef="createdAt">
        <th mat-header-cell *matHeaderCellDef mat-sort-header>Created At</th>
        <td mat-cell *matCellDef="let row">
          <span class="mono">{{ row.createdAt }}</span>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  </div>

  <mat-paginator
    [length]="(totalCount$ | async) ?? 0"
    [pageSize]="20"
    [pageSizeOptions]="[10, 20, 50]"
    [pageIndex]="((pagination$ | async)?.page ?? 1) - 1"
    (page)="onPageChange($event)"
    showFirstLastButtons>
  </mat-paginator>
</app-glass-panel>
```

**Note on mat-table structural directives:** `*matHeaderCellDef`, `*matCellDef`, `*matHeaderRowDef`, `*matRowDef` are Angular Material structural directives that remain unchanged — they are NOT the same as `*ngIf`/`*ngFor`. These are mat-table-specific and required.

#### EventTypeChipComponent Pattern

```typescript
// shared/components/event-type-chip/event-type-chip.component.ts
@Component({
  selector: 'app-event-type-chip',
  standalone: true,
  template: `
    <span class="chip" [class]="'chip-' + type.toLowerCase()"
          [attr.aria-label]="'Event type: ' + type">
      {{ type }}
    </span>
  `,
  styleUrl: './event-type-chip.component.scss',
})
export class EventTypeChipComponent {
  @Input({ required: true }) type!: string;
}
```

```scss
// event-type-chip.component.scss
.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: var(--text-sm);
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
}

.chip-pageview {
  background: #1e3a5f;
  color: #60a5fa;
  border-color: #3b82f6;
}

.chip-click {
  background: #451a03;
  color: #fbbf24;
  border-color: #f59e0b;
}

.chip-purchase {
  background: #052e16;
  color: #4ade80;
  border-color: #22c55e;
}
```

#### Glass Theme Overrides for Table

```scss
// events-table.component.scss — key styles
:host {
  display: block;
}

.section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}

.truncated-id {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  font-size: var(--mono-sm);
}

// mat-table Glass overrides
table.mat-mdc-table {
  background: transparent;
  width: 100%;
}

.mat-mdc-header-cell {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: var(--text-sm);
  border-bottom-color: var(--border);
}

.mat-mdc-cell {
  color: var(--text-primary);
  font-size: var(--text-base);
  border-bottom-color: var(--border);
}

.mat-mdc-row:hover {
  background: var(--bg-elevated);
  transition: background 150ms ease-out;
}

// mat-paginator Glass overrides
.mat-mdc-paginator {
  background: transparent;
  color: var(--text-secondary);
}
```

#### Unit Test Pattern (following existing codebase)

```typescript
// events-table.component.spec.ts
describe('EventsTableComponent', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EventsTableComponent],
      providers: [
        provideMockStore({
          initialState: {
            events: {
              items: [
                { id: '550e8400-e29b-41d4-a716-446655440000', userId: 'olena', type: 'PageView', description: 'Viewed homepage', createdAt: '2026-02-24T14:30:00Z' },
              ],
              totalCount: 1,
              loading: false,
              error: null,
              filters: {},
              pagination: { page: 1, pageSize: 20 },
              sort: { sortBy: 'createdAt', sortDir: 'desc' },
            },
            // other store slices...
          },
        }),
      ],
    });
    store = TestBed.inject(MockStore);
  });

  it('should dispatch loadEvents on init', () => {
    spyOn(store, 'dispatch');
    const fixture = TestBed.createComponent(EventsTableComponent);
    fixture.detectChanges();
    expect(store.dispatch).toHaveBeenCalledWith(loadEvents());
  });
});
```

### Project Structure Notes

```
src/frontend/src/app/
├── features/
│   ├── event-form/              # EXISTING — reference for patterns
│   └── events-table/            # NEW — this story
│       ├── events-table.component.ts
│       ├── events-table.component.html
│       ├── events-table.component.scss
│       └── events-table.component.spec.ts
├── shared/components/
│   ├── glass-panel/             # EXISTING — reuse as wrapper
│   └── event-type-chip/         # NEW — this story (Task 1)
│       ├── event-type-chip.component.ts
│       ├── event-type-chip.component.scss
│       └── event-type-chip.component.spec.ts
├── store/events/                # PREREQUISITE — Story 3.2 must be complete
│   ├── events.actions.ts        # Created by Story 3.2
│   ├── events.reducer.ts        # Updated by Story 3.2
│   ├── events.selectors.ts      # Created by Story 3.2
│   └── events.effects.ts        # Created by Story 3.2
├── app.component.ts             # UPDATE — add EventsTableComponent import
├── app.component.html           # UPDATE — add <app-events-table> to layout
└── app.component.scss           # UPDATE — add .table-panel style
```

**Alignment with Architecture Doc:**
- Component location: `features/events-table/` — matches architecture's Angular Project structure
- Shared component: `shared/components/event-type-chip/` — matches architecture's shared components location
- Store integration: dispatches actions via `store.dispatch()`, reads via `store.select()` — matches NgRx patterns
- Glass theme: uses `<app-glass-panel>` wrapper + CSS custom properties — matches established UI pattern
- File naming: kebab-case throughout — matches enforcement rule #1

### Previous Story Intelligence

**From Story 3.2 (NgRx Events Store — ready-for-dev, MUST be complete first):**
- Creates all NgRx events store files: `events.actions.ts`, `events.selectors.ts`, `events.effects.ts`
- Updates `events.reducer.ts` shell with full state management
- Registers `EventsEffects` in `app.config.ts`
- Actions available: `loadEvents`, `loadEventsSuccess`, `loadEventsFailure`, `changeFilter`, `changePage`, `changeSort`
- Selectors available: `selectEvents`, `selectEventsTotalCount`, `selectEventsLoading`, `selectEventsFilters`, `selectEventsPagination`, `selectEventsSort`, `selectEventsQueryParams`
- Effects handle: `loadEvents$` (API call with switchMap), `changeFilter$` (debounce 300ms), `changePage$` (immediate), `changeSort$` (immediate)
- State shape: `{ items: EventResponse[], totalCount, loading, error, filters, pagination: { page, pageSize }, sort: { sortBy, sortDir } }`

**From Story 3.1 (API GET Endpoint — review status):**
- Backend `GET /api/events` with query params: `type, userId, description, from, to, page, pageSize, sortBy, sortDir`
- Response shape: `{ items: EventResponse[], totalCount: number, page: number, pageSize: number }`
- `EventService.getAll(filter)` already exists and builds HttpParams correctly
- `EventFilter` model already defined in `shared/models/event-filter.model.ts`

**From Story 2.4 (Event Creation Form — review status):**
- Established the `<app-glass-panel>` wrapper pattern for feature components
- Standalone component with Angular Material imports in `imports` array
- NgRx store injection via `inject(Store<AppState>)`
- `async` pipe usage in templates for reactive rendering
- Form panel is 380px fixed width on left side of `.content-layout`

**From Story 1.6 (Angular SPA Foundation):**
- Glass theme with CSS custom properties in `_variables.scss`
- `GlassPanelComponent` with default and compact variants
- App shell: header + main with `.content-layout` flex container
- JetBrains Mono font loaded via Google Fonts CDN in `index.html`

### Git Intelligence

Recent commit pattern: single commit per story with prefix `feat: {story-key} - {Story Title}`
```
72bce06 feat: 3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination
c08a0f8 feat: 2-5-form-submission-feedback-toast-notifications
cfade28 feat: 2-4-event-creation-form-component
8b7f85e feat: 2-3-ngrx-submission-store-and-event-service
```

**Files touched in Story 3.1 (most recent, same epic):**
- `EventsController.cs` — GET endpoint with filtering/sorting/pagination
- `EventRepository.cs` — IQueryable-based server-side filtering
- `event.service.ts` — Added `getAll(filter)` method
- `event-filter.model.ts` — Created EventFilter interface
- `event.service.spec.ts` — Added getAll tests

Commit this story as: `feat: 3-3-events-table-component - Events Table Component`

### Latest Tech Notes

**Angular Material 19 — Table Components:**
- No breaking changes for `mat-table`, `MatSort`, or `mat-paginator` in Angular Material 19
- Import paths unchanged: `@angular/material/table`, `@angular/material/sort`, `@angular/material/paginator`, `@angular/material/tooltip`
- Standalone component approach remains recommended — import modules directly in component `imports` array
- Performance improvement: table now uses `afterNextRender` for sticky styling and `ResizeObserver` instead of DOM measurements
- `MatTableDataSource` is NOT deprecated but is for client-side data only — this story uses direct observable binding instead
- Removed exports: `MAT_SORT_HEADER_INTL_PROVIDER`, `MAT_SORT_HEADER_INTL_PROVIDER_FACTORY` — not used in this story
- `MatTooltipModule` unchanged — standard usage for truncated GUID display
- `-webkit-backdrop-filter` prefix still required for Safari in glassmorphism CSS

**Date Display:**
- Use `DatePipe` or display raw ISO string — the `createdAt` value from the API is already in ISO 8601 UTC format (`2026-02-24T14:30:00Z`)
- Display the raw string directly in monospace font for technical accuracy (no locale formatting)

### Dependency Notes

**Story 3.2 (NgRx Events Store) MUST be complete before this story can be implemented.** Specifically:
- `events.actions.ts` must exist with `loadEvents`, `changeSort`, `changePage` actions
- `events.selectors.ts` must exist with `selectEvents`, `selectEventsTotalCount`, `selectEventsLoading`, `selectEventsPagination`, `selectEventsSort`
- `events.effects.ts` must exist and be registered in `app.config.ts`
- `events.reducer.ts` must be updated with full state management

If Story 3.2 is not yet complete when dev begins, implement it first following the Story 3.2 spec.

**Story 3.4 (EventTypeChip) is partially included in this story.** Task 1 creates the `EventTypeChipComponent` as needed by the table. Story 3.4 may add additional refinements, tests, or accessibility features if not already covered.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5 State Management — NgRx Store]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6 Pagination Strategy — Server-Side]
- [Source: _bmad-output/planning-artifacts/architecture.md#Angular Code naming conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Store Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines rules #1, #5, #9, #12]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EventTypeChipComponent]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Id Column Display — truncated GUID]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Sorting Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Pagination Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System — JetBrains Mono]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System — Event Type Chip Colors]
- [Source: _bmad-output/planning-artifacts/prd.md#FR6 View events, FR31 Pagination, FR32 Sorting]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P2 API <500ms, NFR-P5 Loading <200ms]
- [Source: _bmad-output/implementation-artifacts/3-2-ngrx-events-store-and-data-fetching.md]
- [Source: _bmad-output/implementation-artifacts/3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination.md]
- [Source: src/frontend/src/app/features/event-form/ — UI pattern reference]
- [Source: src/frontend/src/app/shared/components/glass-panel/ — wrapper component]
- [Source: src/frontend/src/app/core/services/event.service.ts — getAll() method]
- [Source: src/frontend/src/app/shared/models/event.model.ts — EventResponse, EventType]
- [Source: src/frontend/src/app/shared/models/event-filter.model.ts — EventFilter]
- [Source: src/frontend/src/app/shared/models/paged-result.model.ts — PagedResult<T>]
- [Source: src/frontend/src/app/app.component.ts — shell layout integration]
- [Source: src/frontend/src/styles/_variables.scss — CSS custom properties]

## Change Log

- **2026-02-24:** Implemented Events Table Component — created EventTypeChipComponent (color-coded pills for PageView/Click/Purchase), EventsTableComponent with server-side sorting/pagination via NgRx, integrated into app shell layout. All 96 tests pass, build and lint clean.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Created `EventTypeChipComponent` standalone component with color-coded pill chips using CSS custom properties from `_variables.scss`
- Created `EventsTableComponent` standalone component with 5 columns (Id, UserId, Type, Description, CreatedAt), server-side MatSort and mat-paginator integration via NgRx actions
- Id column displays truncated GUID (first 8 chars + "…") with matTooltip for full GUID on hover
- CreatedAt displays raw ISO 8601 UTC string in JetBrains Mono font
- Sort dispatches `changeSort` NgRx action; empty direction resets to default `createdAt desc`
- Paginator handles 0-based to 1-based page index conversion; page size options [10, 20, 50] with default 20
- Glass theme overrides applied for mat-table, mat-paginator, and mat-sort-header
- Integrated into app shell with `.table-panel { flex: 1; min-width: 0; }` alongside existing `.form-panel`
- Updated `app.component.spec.ts` to include events store selectors for MockStore
- All 96 tests pass (17 new tests added: 9 for EventsTableComponent, 7 for EventTypeChipComponent, 1 updated app.component test)
- `ng build` succeeds, `ng lint` passes with 0 errors

### File List

- `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.ts` (new)
- `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.scss` (new)
- `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.spec.ts` (new)
- `src/frontend/src/app/features/events-table/events-table.component.ts` (new)
- `src/frontend/src/app/features/events-table/events-table.component.html` (new)
- `src/frontend/src/app/features/events-table/events-table.component.scss` (new)
- `src/frontend/src/app/features/events-table/events-table.component.spec.ts` (new)
- `src/frontend/src/app/app.component.ts` (modified)
- `src/frontend/src/app/app.component.html` (modified)
- `src/frontend/src/app/app.component.scss` (modified)
- `src/frontend/src/app/app.component.spec.ts` (modified)
- `_bmad-output/implementation-artifacts/3-3-events-table-component.md` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)