# Story 3.4: EventTypeChip Component

Status: review
Story-Key: 3-4-event-type-chip-component
Epic: 3 — Event Discovery & Table Display (Full Stack)
Date: 2026-02-24

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want event types displayed as color-coded pill chips in the table,
So that I can quickly scan and identify event types at a glance.

## Acceptance Criteria

1. **Given** an event with Type "PageView"
   **When** the chip renders
   **Then** it displays "PageView" with background `#1e3a5f`, text color `#60a5fa`, border `1px solid #3b82f6`

2. **Given** an event with Type "Click"
   **When** the chip renders
   **Then** it displays "Click" with background `#451a03`, text color `#fbbf24`, border `1px solid #f59e0b`

3. **Given** an event with Type "Purchase"
   **When** the chip renders
   **Then** it displays "Purchase" with background `#052e16`, text color `#4ade80`, border `1px solid #22c55e`

4. **Given** any event type chip
   **When** it renders
   **Then** it has pill shape (`border-radius: 20px`) and `aria-label="Event type: {type}"`

## Tasks / Subtasks

- [x] Task 1: Verify and refine existing EventTypeChipComponent (AC: #1, #2, #3, #4)
  - [x] 1.1 Confirm component exists at `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.ts` — created by Story 3.3 Task 1
  - [x] 1.2 Verify `@Input() type!: string` input property accepts `'PageView' | 'Click' | 'Purchase'`
  - [x] 1.3 Verify pill shape: `border-radius: 20px`, `padding: 4px 12px`, `font-size: var(--text-sm)`, `font-weight: 500`
  - [x] 1.4 Verify `aria-label="Event type: {type}"` is present on the chip element
  - [x] 1.5 Verify CSS uses variables from `_variables.scss`: `--chip-pageview-bg`, `--chip-pageview-text`, `--chip-pageview-border` (and equivalents for click, purchase)
  - [x] 1.6 Confirm actual rendered colors match UX spec values: PageView bg `#1e3a5f` / text `#60a5fa` / border `#3b82f6`; Click bg `#451a03` / text `#fbbf24` / border `#f59e0b`; Purchase bg `#052e16` / text `#4ade80` / border `#22c55e`
  - [x] 1.7 Verify no hardcoded color values in component SCSS — all sourced from CSS custom properties

- [x] Task 2: Ensure reusability for FlyingChipComponent (AC: #1, #2, #3, #4)
  - [x] 2.1 Confirm component is standalone with zero Angular Material dependencies — pure presentational
  - [x] 2.2 Verify component can be imported and used independently by `FlyingChipComponent` (Story 4.4) — no coupling to `EventsTableComponent`
  - [x] 2.3 Ensure `@Input() type` works with the `EventType` enum string values (`'PageView'`, `'Click'`, `'Purchase'`) — the enum is a string enum in `event.model.ts`
  - [x] 2.4 Verify the chip renders correctly outside of `mat-table` context (e.g., in a `position: fixed` overlay for flying chip)

- [x] Task 3: Unit Tests — verify and extend coverage (AC: #1, #2, #3, #4)
  - [x] 3.1 Confirm `event-type-chip.component.spec.ts` exists with basic tests from Story 3.3
  - [x] 3.2 Verify test: renders "PageView" text content with correct `aria-label="Event type: PageView"`
  - [x] 3.3 Verify test: renders "Click" text content with correct `aria-label="Event type: Click"`
  - [x] 3.4 Verify test: renders "Purchase" text content with correct `aria-label="Event type: Purchase"`
  - [x] 3.5 Verify test: applies correct CSS class per type (`chip-pageview`, `chip-click`, `chip-purchase`)
  - [x] 3.6 Add test: chip element has `border-radius: 20px` computed style (or verify via CSS class)
  - [x] 3.7 Add test: renders with unknown/empty type without crashing (defensive check)
  - [x] 3.8 Add test: verifies chip text matches the type input exactly (case-sensitive: "PageView", not "pageview")

- [x] Task 4: Verify CSS variable definitions in _variables.scss (AC: #1, #2, #3)
  - [x] 4.1 Confirm `src/frontend/src/styles/_variables.scss` contains all 9 chip CSS custom properties:
    - `--chip-pageview-bg: #1e3a5f`, `--chip-pageview-text: #60a5fa`, `--chip-pageview-border: #3b82f6`
    - `--chip-click-bg: #451a03`, `--chip-click-text: #fbbf24`, `--chip-click-border: #f59e0b`
    - `--chip-purchase-bg: #052e16`, `--chip-purchase-text: #4ade80`, `--chip-purchase-border: #22c55e`
  - [x] 4.2 Verify variable values match UX spec exactly (no rounding, no approximation)

- [x] Task 5: Verify integration in events-table (AC: #1, #2, #3, #4)
  - [x] 5.1 Confirm `EventTypeChipComponent` is imported in `events-table.component.ts` imports array
  - [x] 5.2 Confirm `<app-event-type-chip [type]="row.type" />` is used in the Type column of `events-table.component.html`
  - [x] 5.3 Visual check: chips render correctly in table with proper spacing and alignment

- [x] Task 6: Verify End-to-End Build and Tests
  - [x] 6.1 Run `ng build` — successful production build
  - [x] 6.2 Run `ng test` — all existing + new tests pass
  - [x] 6.3 Run `ng lint` — 0 errors

## Dev Notes

### CRITICAL: Story 3.3 Already Created This Component

The `EventTypeChipComponent` was **already created** as Task 1 of Story 3.3 (Events Table Component). The component files exist at:
- `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.ts`
- `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.scss`
- `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.spec.ts`

**This story is primarily a VERIFICATION and REFINEMENT story.** The dev agent should:
1. Verify the existing implementation matches ALL acceptance criteria
2. Add any missing test coverage
3. Fix any gaps found during verification
4. Ensure the component is properly reusable for future stories (especially FlyingChipComponent in Story 4.4)

**DO NOT recreate the component from scratch.** Read the existing files first and verify/enhance.

### Architecture Patterns & Constraints

- **Enforcement rule #12:** All color values MUST come from CSS custom properties in `_variables.scss` — never hardcode hex values in component SCSS
- **Enforcement rule #1:** File naming: kebab-case for all Angular files
- **Enforcement rule #9:** Standalone component — no NgModules, no `CommonModule` imports
- **Pure presentational component:** Zero dependencies on Angular Material, NgRx, or services. Takes `@Input() type: string`, renders a colored pill. That's it.
- **Component selector:** `app-event-type-chip` — matches kebab-case convention

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Why |
|------|-------|-----|
| `EventTypeChipComponent` | `src/frontend/src/app/shared/components/event-type-chip/` | **ALREADY EXISTS** — created by Story 3.3. Verify and refine, do NOT recreate |
| `EventType` enum | `src/frontend/src/app/shared/models/event.model.ts` | String enum: `PageView = 'PageView'`, `Click = 'Click'`, `Purchase = 'Purchase'` |
| CSS chip variables | `src/frontend/src/styles/_variables.scss` | `--chip-pageview-bg`, `--chip-pageview-text`, `--chip-pageview-border`, and click/purchase equivalents |
| `EventsTableComponent` integration | `src/frontend/src/app/features/events-table/` | Already uses `<app-event-type-chip [type]="row.type" />` in Type column |

### Critical Anti-Patterns to Avoid

- **DO NOT** recreate the component — it already exists from Story 3.3
- **DO NOT** hardcode hex color values in component SCSS — use CSS custom properties from `_variables.scss`
- **DO NOT** add Angular Material dependencies — this is a pure CSS/HTML component
- **DO NOT** import `CommonModule` — the component needs no common directives
- **DO NOT** use `*ngIf` or `*ngFor` — use Angular 19 `@if` / `@for` if conditional rendering needed
- **DO NOT** make the component depend on NgRx store — it's a pure presentational `@Input()` → rendered output component
- **DO NOT** use `:host` with `ViewEncapsulation.None` — keep default encapsulation, use class-based selectors

### Implementation Pattern

```typescript
// EXISTING — event-type-chip.component.ts
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
// EXISTING — event-type-chip.component.scss
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
  background: var(--chip-pageview-bg);
  color: var(--chip-pageview-text);
  border-color: var(--chip-pageview-border);
}

.chip-click {
  background: var(--chip-click-bg);
  color: var(--chip-click-text);
  border-color: var(--chip-click-border);
}

.chip-purchase {
  background: var(--chip-purchase-bg);
  color: var(--chip-purchase-text);
  border-color: var(--chip-purchase-border);
}
```

### CSS Variable Definitions (in _variables.scss)

```scss
// Event Type Chip Colors — from UX spec
--chip-pageview-bg: #1e3a5f;
--chip-pageview-text: #60a5fa;
--chip-pageview-border: #3b82f6;

--chip-click-bg: #451a03;
--chip-click-text: #fbbf24;
--chip-click-border: #f59e0b;

--chip-purchase-bg: #052e16;
--chip-purchase-text: #4ade80;
--chip-purchase-border: #22c55e;
```

### Accessibility Requirements

- `aria-label="Event type: {type}"` on the chip `<span>` element
- Color is **never the only differentiator** — text label always visible alongside color
- WCAG AA color contrast verified in UX spec:
  - PageView text (#60a5fa) on chip bg (#1e3a5f): **4.7:1** — AA pass
  - Click text (#fbbf24) on chip bg (#451a03): **5.2:1** — AA pass
  - Purchase text (#4ade80) on chip bg (#052e16): **5.8:1** — AA pass

### Reusability for Future Stories

This component will be reused by:
- **Story 4.4 (Flying Chip Animation):** `FlyingChipComponent` will embed `EventTypeChipComponent` inside a position-fixed overlay to display the event type during flight animation
- The component MUST work correctly when rendered outside of a `mat-table` context (e.g., inside a `position: fixed` element with `backdrop-filter: blur(8px)`)

### Project Structure Notes

```
src/frontend/src/app/
├── shared/components/
│   └── event-type-chip/         # THIS STORY — verify/refine
│       ├── event-type-chip.component.ts     # EXISTING from Story 3.3
│       ├── event-type-chip.component.scss   # EXISTING from Story 3.3
│       └── event-type-chip.component.spec.ts # EXISTING from Story 3.3 — extend
├── features/events-table/       # Consumer — already integrated
│   ├── events-table.component.ts
│   └── events-table.component.html  # Uses <app-event-type-chip [type]="row.type" />
└── shared/models/
    └── event.model.ts           # EventType enum: PageView, Click, Purchase
```

**Alignment with Architecture Doc:**
- Component location: `shared/components/event-type-chip/` — matches architecture's shared components directory
- File naming: kebab-case throughout — matches enforcement rule #1
- Standalone component — matches enforcement rule #9
- CSS custom properties — matches enforcement rule #12

### Previous Story Intelligence

**From Story 3.3 (Events Table Component — in-progress, same branch):**
- Created `EventTypeChipComponent` as Task 1 with full implementation
- Component is a standalone presentational component with `@Input() type: string`
- Uses CSS class binding: `'chip-' + type.toLowerCase()` for type-specific styling
- CSS uses variables from `_variables.scss` — no hardcoded colors
- Tests cover: component creation, aria-label for all 3 types, CSS class application
- Component is already integrated in `events-table.component.html` Type column
- Story 3.3 dev notes state: "Story 3.4 (EventTypeChip) is partially included in this story. Task 1 creates the EventTypeChipComponent as needed by the table. Story 3.4 may add additional refinements, tests, or accessibility features if not already covered."

**From Story 3.2 (NgRx Events Store):**
- `EventResponse` model has `type: EventType` where `EventType` is a string enum
- Events store provides `selectEvents` selector returning `EventResponse[]`

**From Story 1.6 (Angular SPA Foundation):**
- CSS custom properties established in `_variables.scss`
- JetBrains Mono and Inter fonts loaded via Google Fonts CDN
- `--text-sm` token defined for body text sizing

### Git Intelligence

Recent commit pattern: `feat: {story-key} - {Story Title}`
```
3f6c3db feat: 3-2-ngrx-events-store-and-data-fetching - NgRx Events Store & Data Fetching
72bce06 feat: 3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination
```

Current branch: `feature/3-3-events-table-component` — the EventTypeChip files are untracked on this branch.

Commit this story as: `feat: 3-4-event-type-chip-component - EventTypeChip Component`

### Latest Tech Notes

**Angular 19 — Standalone Components:**
- No breaking changes for standalone component patterns in Angular 19
- `@Input({ required: true })` syntax is stable and recommended
- Inline templates are fine for simple components — no performance difference vs external template files
- `[class]="expression"` binding works correctly for dynamic class assignment

**CSS Custom Properties:**
- All modern browsers support CSS custom properties (var())
- No fallback needed for the chip color variables — the app requires a modern browser anyway
- CSS custom properties inherit through the DOM tree — works correctly even in `position: fixed` overlays (important for FlyingChipComponent reuse)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4 EventTypeChip Component]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EventTypeChipComponent]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System — Event Type Chip Colors]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy — Color & Contrast]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines rules #1, #9, #12]
- [Source: _bmad-output/planning-artifacts/architecture.md#Angular Code naming conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Angular Project structure — shared/components/]
- [Source: _bmad-output/implementation-artifacts/3-3-events-table-component.md#Task 1 Create EventTypeChipComponent]
- [Source: src/frontend/src/app/shared/components/event-type-chip/ — existing implementation]
- [Source: src/frontend/src/app/shared/models/event.model.ts — EventType enum]
- [Source: src/frontend/src/styles/_variables.scss — CSS custom properties]
- [Source: src/frontend/src/app/features/events-table/events-table.component.html — consumer usage]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No debug issues encountered. All existing code from Story 3.3 passed verification without requiring fixes.

### Completion Notes List

- **Task 1:** Verified existing EventTypeChipComponent implementation — all 7 subtasks confirmed. Component has correct `@Input({ required: true }) type!: string`, pill shape styling (`border-radius: 20px`, `padding: 4px 12px`, `font-size: var(--text-sm)`, `font-weight: 500`), `aria-label` binding, CSS variables from `_variables.scss`, and no hardcoded colors.
- **Task 2:** Confirmed reusability — component is standalone with zero Angular Material/NgRx dependencies, can be independently imported, works with `EventType` enum string values, and renders correctly outside `mat-table` context (no DOM coupling).
- **Task 3:** Verified 7 existing tests from Story 3.3 all pass. Added 3 new tests: (3.6) pill shape via CSS class verification, (3.7) unknown type rendering without crash, (3.8) case-sensitive text matching. All 10 EventTypeChip tests pass (99 total project tests).
- **Task 4:** Verified all 9 CSS custom properties in `_variables.scss` with exact UX spec values — no rounding or approximation.
- **Task 5:** Confirmed `EventTypeChipComponent` is imported in `events-table.component.ts` and used as `<app-event-type-chip [type]="row.type" />` in the Type column template.
- **Task 6:** Production build successful (bundle size warning pre-existing), 99/99 tests pass, 0 lint errors.

### Implementation Plan

This was primarily a verification and refinement story. The component was created in Story 3.3. The only code change was adding 3 new unit tests to extend coverage for edge cases and style verification.

### File List

- `src/frontend/src/app/shared/components/event-type-chip/event-type-chip.component.spec.ts` (modified — added 3 new tests)
- `_bmad-output/implementation-artifacts/3-4-event-type-chip-component.md` (modified — task checkboxes, Dev Agent Record, status)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status update)

## Change Log

- 2026-02-24: Verified EventTypeChipComponent implementation matches all 4 acceptance criteria. Extended unit test coverage with 3 additional tests (pill shape, unknown type handling, case-sensitive text). All 99 tests pass, build succeeds, 0 lint errors. Story status updated to review.
