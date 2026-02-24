# Story 5.2: Keyboard Navigation & Focus Management

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want to operate all primary interactions via keyboard with visible focus indicators,
so that I can use Event Hub efficiently without a mouse.

## Acceptance Criteria

1. **Given** the page is loaded, **When** the End User presses Tab, **Then** focus moves in order: UserId → Type → Description → Submit → filter inputs → table sort headers → paginator controls.

2. **Given** the End User is focused on the Description field, **When** they press Enter, **Then** the form submits (equivalent to clicking Submit button).

3. **Given** the End User is focused on a filter text input (UserId, Description) or date range input, **When** they press Escape, **Then** the filter input clears its value.

4. **Given** any interactive element receives focus, **When** focus is applied, **Then** a visible focus ring appears: `outline: 2px solid #7c3aed; outline-offset: 2px` on all interactive elements (inputs, selects, buttons, sort headers, paginator controls, toggle buttons).

5. **Given** the Submit button is disabled during async cycle, **When** it receives focus via Tab, **Then** the button still shows the focus ring and `aria-busy="true"` is announced by screen readers (button remains in tab order).

6. **Given** sort column headers in the table, **When** the End User presses Enter or Space on a focused header, **Then** the sort direction toggles (same behavior as click).

7. **Given** paginator previous/next buttons, **When** the End User presses Enter or Space, **Then** the page navigates accordingly.

## Tasks / Subtasks

- [x] Task 1: Add global focus ring styles for all interactive elements (AC: #4)
  - [x] 1.1 In `src/frontend/src/styles.scss`, add a global `*:focus-visible` rule with `outline: 2px solid var(--accent); outline-offset: 2px;` to ensure all focusable elements show the accent-color ring
  - [x] 1.2 In `src/frontend/src/styles/_material-overrides.scss`, add focus-visible overrides for Angular Material components that manage their own focus styles: `mat-button`, `mat-raised-button`, `mat-icon-button`, `mat-sort-header`, `mat-select`, `mat-paginator` buttons — ensure their focus-visible outline matches the design token
  - [x] 1.3 Override Angular Material M3 focus indicator token: set `--mat-sys-focus-indicator-color: var(--accent)` in the `html` block in `_material-overrides.scss`

- [x] Task 2: Make Submit button focusable when in async-disabled state (AC: #5)
  - [x] 2.1 In `event-form.component.html`, change `[disabled]="isSubmitDisabled$ | async"` to `[attr.aria-disabled]="(isSubmitDisabled$ | async) ? 'true' : null"` on the Submit button — removing the native `disabled` attribute keeps the button in the tab order
  - [x] 2.2 In `event-form.component.ts`, update `onSubmit()` to add a guard: check `isSubmitDisabled$` signal or selector value before dispatching — if currently in submitting/chip-flying state, return early (prevent double-submit via keyboard)
  - [x] 2.3 In `event-form.component.scss`, add a style rule for `button[aria-disabled="true"]` that mimics the disabled visual: `opacity: 0.5; box-shadow: none; cursor: not-allowed; pointer-events: none;` — ensuring the button looks disabled but remains focusable
  - [x] 2.4 Update existing spec test `should disable Submit button when isSubmitDisabled is true` in `event-form.component.spec.ts` — change assertion from `expect(submitButton.disabled).toBeTrue()` to `expect(submitButton.getAttribute('aria-disabled')).toBe('true')` and add a new assertion that `submitButton.disabled` is `false` (button stays in tab order)

- [x] Task 3: Add Escape key handler to date range filter inputs (AC: #3)
  - [x] 3.1 In `events-filter.component.ts`, add `clearDateRange()` method that resets `filterForm.controls.dateFrom` and `filterForm.controls.dateTo` to null and dispatches `changeFilter` with no `from`/`to` values
  - [x] 3.2 In `events-filter.component.html`, add `(keydown.escape)="clearDateRange()"` to both `matStartDate` input and `matEndDate` input inside the date range form field
  - [x] 3.3 Verify existing `clearInput()` method and Escape handlers on `userId` and `description` filter inputs still work (already implemented in Story 3.5/4.x, confirm no regression)

- [x] Task 4: Verify correct tab order across the page (AC: #1)
  - [x] 4.1 Review `app.component.html` DOM order: form panel (`app-event-form`) comes before table panel (`app-events-filter` + `app-events-table`) in all layouts — natural DOM order produces correct tab sequence
  - [x] 4.2 Confirm `app-event-form` internal order: UserId input → Type select → Description input → Submit button (already correct via `flex-direction: column` layout)
  - [x] 4.3 Confirm filter tab order: UserId filter → Type filter → Description filter → From date → To date → Clear-filters button (if visible) — already correct in `events-filter.component.html`
  - [x] 4.4 Confirm table panel order: sort headers (via `mat-sort-header` tab stops) → paginator controls — already correct via Angular Material's DOM structure

- [x] Task 5: Unit tests (AC: #1–#7)
  - [x] 5.1 In `event-form.component.spec.ts`: add test verifying Submit button has `aria-disabled="true"` and `aria-busy="true"` when `isSubmitDisabled` is true, and that `button.disabled === false` (focusable)
  - [x] 5.2 In `event-form.component.spec.ts`: add test verifying `onSubmit()` does NOT dispatch `submitEvent` when the component's `isSubmitDisabled` selector is `true` (double-submit guard via aria-disabled)
  - [x] 5.3 In `event-form.component.spec.ts`: confirm existing test for Enter on Description field still passes (no regression from Task 2 changes)
  - [x] 5.4 In `events-filter.component.spec.ts`: add test for `clearDateRange()` — verify it resets `dateFrom` and `dateTo` form controls to null and dispatches `changeFilter` with empty `from`/`to`
  - [x] 5.5 In `events-filter.component.spec.ts`: add test that keydown.escape on `matStartDate` input calls `clearDateRange()`
  - [x] 5.6 In `events-filter.component.spec.ts`: add test that keydown.escape on `matEndDate` input calls `clearDateRange()`
  - [x] 5.7 Verify `ng build` succeeds with zero errors after all changes

## Dev Notes

### Architecture Patterns & Constraints

- **ADR-5: NgRx Store** — No new NgRx state needed for this story. Keyboard behavior is view-layer (event handlers in components). Focus management is handled by DOM and CSS — do NOT put focus state in the store.
- **ADR-4: Monorepo** — All changes are frontend-only (`src/frontend/`). No backend modifications.
- **Enforcement Rule #1:** File naming — kebab-case for Angular files. No new files needed.
- **Enforcement Rule #9:** `provideStore()` / `provideEffects()` pattern — no store changes for keyboard story.
- **Enforcement Rule #12:** All color values use CSS custom properties from `_variables.scss`. Focus ring uses `var(--accent)` — NEVER hardcode `#7c3aed` in component SCSS.
- **UX Spec: Focus Indicators** — `outline: 2px solid #7c3aed; outline-offset: 2px` on ALL focusable elements. This is a WCAG 2.1 AA requirement. The project CSS variable is `var(--accent)` = `#7c3aed`.
- **UX Spec: Tab order** — Form → Filters → Table → Paginator. Natural DOM order already achieves this; no `tabindex` manipulation needed.
- **UX Spec: Keyboard navigation** — `Enter` to submit from Description (already done), `Escape` to clear filter (partially done), `Enter`/`Space` on sort headers (Angular Material built-in), paginator keyboard (Angular Material built-in).

### What's Already Implemented (Do NOT Re-implement)

The following keyboard interactions were implemented in earlier stories:

| Interaction | Location | Implementation |
|-------------|----------|---------------|
| Enter on Description field submits | `event-form.component.html` line 40 | `(keydown.enter)="onSubmit()"` |
| Escape on UserId filter clears | `events-filter.component.html` line 25 | `(keydown.escape)="clearInput(filterForm.controls.userId)"` |
| Escape on Description filter clears | `events-filter.component.html` line 44 | `(keydown.escape)="clearInput(filterForm.controls.description)"` |
| Sort header Enter/Space | `events-table.component.html` | `mat-sort-header` directive — Angular Material built-in |
| Paginator keyboard | `events-table.component.html` | `mat-paginator` — Angular Material built-in |
| aria-busy on Submit during async | `event-form.component.html` line 54 | `[attr.aria-busy]="(isSubmitDisabled$ | async) ? 'true' : null"` |
| aria-required on form fields | `event-form.component.html` | `aria-required="true"` |
| aria-label on form | `event-form.component.html` | `role="form" aria-label="Create Event"` |

**What REMAINS for this story (the delta):**
1. Global focus ring (all interactive elements)
2. Submit button focusable when disabled (aria-disabled approach)
3. Escape on date range filter inputs
4. Tests for the above

### Critical Implementation Details

#### Task 1: Global Focus Ring in styles.scss

```scss
// Add to src/frontend/src/styles.scss — AFTER the existing body block

// WCAG 2.1 AA — Visible focus indicator for all interactive elements
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

Add to `_material-overrides.scss` in the `html` block (alongside existing `--mat-sys-*` overrides):

```scss
// Focus indicator token — matches --accent (#7c3aed)
--mat-sys-focus-indicator-color: var(--accent);
```

> **Why `focus-visible` not `focus`?** — `:focus-visible` shows the ring only for keyboard/programmatic focus, not on mouse click. This prevents the ring from appearing when clicking a button with a mouse (which looks odd), while still showing it for Tab navigation. This matches standard browser and Angular Material behavior.

> **Angular Material focus rings** — Material M3 manages its own focus state via `--mat-sys-focus-indicator-color`. Setting this token globally ensures Material components (sort headers, paginator, buttons) inherit the accent color for their focus rings too.

#### Task 2: Submit Button aria-disabled Approach

**event-form.component.html changes:**

```html
<!-- Before (native disabled — removes from tab order): -->
<button mat-raised-button
        type="submit"
        class="submit-button"
        #submitButton
        [disabled]="isSubmitDisabled$ | async"
        [attr.aria-busy]="(isSubmitDisabled$ | async) ? 'true' : null"
        aria-label="Submit event">
  Submit Event
</button>

<!-- After (aria-disabled — stays in tab order): -->
<button mat-raised-button
        type="submit"
        class="submit-button"
        #submitButton
        [attr.aria-disabled]="(isSubmitDisabled$ | async) ? 'true' : null"
        [attr.aria-busy]="(isSubmitDisabled$ | async) ? 'true' : null"
        aria-label="Submit event">
  Submit Event
</button>
```

**event-form.component.ts — onSubmit() guard:**

```typescript
onSubmit(): void {
  // Guard: if aria-disabled (async cycle in progress), ignore keyboard/click
  if (this.submitButtonRef?.nativeElement?.getAttribute('aria-disabled') === 'true') {
    return;
  }

  if (this.eventForm.invalid) {
    this.eventForm.markAllAsTouched();
    return;
  }
  // ... rest of existing submit logic unchanged
}
```

> **Alternative guard approach:** Instead of reading the DOM attribute, use the store selector directly in `onSubmit()`:
> ```typescript
> onSubmit(): void {
>   // Check current disabled state synchronously
>   let currentlyDisabled = false;
>   this.store.select(selectIsSubmitDisabled).pipe(take(1)).subscribe(v => currentlyDisabled = v);
>   if (currentlyDisabled) return;
>   // ... rest of logic
> }
> ```
> Either approach works — the DOM attribute approach is simpler and avoids async complexity.

**event-form.component.scss — aria-disabled visual:**

```scss
// Replace the existing &:disabled block:
.submit-button {
  // ... existing styles unchanged ...

  &[aria-disabled="true"] {
    opacity: 0.5;
    box-shadow: none;
    cursor: not-allowed;
    pointer-events: none;  // prevents mouse clicks, button stays focusable via keyboard
  }

  // Keep :disabled as fallback (if native disabled is ever used)
  &:disabled {
    opacity: 0.5;
    box-shadow: none;
    cursor: not-allowed;
  }
}
```

> **`pointer-events: none` on `[aria-disabled]`** — This prevents mouse clicks on the aria-disabled button while preserving keyboard focusability. Mouse users cannot click the button; keyboard users can Tab to it and are announced as "unavailable" (aria-disabled) and "busy" (aria-busy) by screen readers.

#### Task 3: Date Range Escape Handler

**events-filter.component.ts — add method:**

```typescript
clearDateRange(): void {
  this.filterForm.controls.dateFrom.setValue(null);
  this.filterForm.controls.dateTo.setValue(null);
  // The existing dateFrom/dateTo valueChanges subscription dispatches changeFilter automatically
  // so no explicit dispatch needed here (the merge() subscription handles it)
}
```

**events-filter.component.html — add Escape handlers to date inputs:**

```html
<!-- matStartDate input — add (keydown.escape) -->
<input matStartDate [formControl]="filterForm.controls.dateFrom"
       placeholder="From" aria-label="Filter from date"
       (keydown.escape)="clearDateRange()">

<!-- matEndDate input — add (keydown.escape) -->
<input matEndDate [formControl]="filterForm.controls.dateTo"
       placeholder="To" aria-label="Filter to date"
       (keydown.escape)="clearDateRange()">
```

#### Angular Material Keyboard Support (Already Built-In — No Code Changes Needed)

| Component | Keyboard | Angular Material behavior |
|-----------|----------|--------------------------|
| `mat-sort-header` | Enter / Space | Toggles sort direction (asc → desc → unsorted) |
| `mat-paginator` | Enter / Space on buttons | Navigates to prev/next page |
| `mat-select` | Enter/Space to open, arrows to navigate, Enter to select | Native Material select keyboard |
| `mat-form-field` input | Tab to focus, standard text input keyboard | Native browser behavior |

No code changes are required for these — they are tested via existing tests and Angular Material's own testing.

### Critical Anti-Patterns to Avoid

- **DO NOT** use `tabindex="-1"` to remove elements from tab order — this breaks keyboard accessibility. Use CSS `pointer-events: none` for visual-only exclusion.
- **DO NOT** use `tabindex` positive values (`tabindex="1"`, `tabindex="2"`, ...) — they override natural tab order and create maintenance nightmares. The natural DOM order already produces the correct tab sequence.
- **DO NOT** use `:focus` instead of `:focus-visible` for the global focus ring — `:focus` shows the ring on mouse clicks too, which is visually jarring for mouse users. `:focus-visible` is the correct modern approach.
- **DO NOT** implement custom keyboard handling for `mat-sort-header` or `mat-paginator` — Angular Material already handles Enter/Space on these components. Adding custom handlers would create double-dispatch bugs.
- **DO NOT** put focus state in NgRx store — focus is a view-layer concern, not application state.
- **DO NOT** use `::ng-deep` to override focus styles inside component SCSS — global focus ring belongs in `styles.scss` / `_material-overrides.scss` where it applies to all components.
- **DO NOT** hardcode `#7c3aed` in component SCSS files — use `var(--accent)` from `_variables.scss`.
- **DO NOT** forget `pointer-events: none` on `[aria-disabled="true"]` button — without it, mouse clicks would still trigger the submit (even with `onSubmit()` guard, a race condition could occur via the type="submit" form submit event).
- **DO NOT** remove the `[disabled]` test assertions without adding equivalent `[aria-disabled]` assertions — the test must still verify the button appears disabled to screen readers.
- **DO NOT** add `(keydown.enter)` or `(keydown.space)` handlers on sort headers or paginator — Angular Material CDK already wires these.

### Project Structure Notes

#### Files to MODIFY:

| File | Change |
|------|--------|
| `src/frontend/src/styles.scss` | Add global `*:focus-visible` rule (Task 1.1) |
| `src/frontend/src/styles/_material-overrides.scss` | Add `--mat-sys-focus-indicator-color` token override (Task 1.2, 1.3) |
| `src/frontend/src/app/features/event-form/event-form.component.html` | Change `[disabled]` → `[attr.aria-disabled]` on Submit button (Task 2.1) |
| `src/frontend/src/app/features/event-form/event-form.component.ts` | Add `aria-disabled` guard in `onSubmit()` (Task 2.2) |
| `src/frontend/src/app/features/event-form/event-form.component.scss` | Add `[aria-disabled="true"]` styling (Task 2.3) |
| `src/frontend/src/app/features/event-form/event-form.component.spec.ts` | Update disabled test + add aria-disabled/focusable tests (Task 2.4, 5.1, 5.2) |
| `src/frontend/src/app/features/events-filter/events-filter.component.ts` | Add `clearDateRange()` method (Task 3.1) |
| `src/frontend/src/app/features/events-filter/events-filter.component.html` | Add Escape handlers to date range inputs (Task 3.2) |
| `src/frontend/src/app/features/events-filter/events-filter.component.spec.ts` | Add Escape + clearDateRange tests (Task 5.4–5.6) |

#### Files NOT to touch:

| File | Reason |
|------|--------|
| `src/frontend/src/app/app.component.html` | DOM order already produces correct tab sequence |
| `src/frontend/src/app/app.component.ts` | No responsive changes needed for keyboard |
| `src/frontend/src/styles/_variables.scss` | All CSS custom properties already defined (`--accent` exists) |
| `src/frontend/src/styles/_glass.scss` | Glass mixin unchanged |
| `src/frontend/src/app/features/events-table/**/*` | Angular Material sort headers already keyboard-accessible |
| `src/frontend/src/app/store/**/*` | No NgRx store changes — keyboard is view-layer only |
| `src/frontend/src/app/core/services/**/*` | No service changes needed |
| `src/frontend/src/app/shared/components/**/*` | Shared components unaffected |
| Any `.NET` backend files | Frontend-only story |

### Library & Framework Requirements

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | `19.2.x` (already installed) | Component framework |
| `@angular/cdk/layout` | `19.2.x` (already installed) | `BreakpointObserver` — already in use |
| `@angular/material` | `19.2.x` (already installed) | All Material keyboard behavior is built-in |

**No new packages needed.** All keyboard accessibility is achieved via:
1. Global CSS (`:focus-visible` rule)
2. Angular Material's built-in CDK keyboard management
3. Angular event bindings (`(keydown.enter)`, `(keydown.escape)`)

### Testing Requirements

**Framework:** Karma + Jasmine (Angular convention, already configured)

#### Test modifications:

**`event-form.component.spec.ts`:**

```typescript
// Update existing test (Task 2.4):
it('should set aria-disabled when isSubmitDisabled is true (remains focusable)', () => {
  store.overrideSelector(selectIsSubmitDisabled, true);
  store.refreshState();
  fixture.detectChanges();

  const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  expect(submitButton.getAttribute('aria-disabled')).toBe('true');
  expect(submitButton.disabled).toBeFalse(); // Must NOT be natively disabled — stays in tab order
});

// New test (Task 5.2):
it('should NOT dispatch submitEvent when aria-disabled is set', () => {
  store.overrideSelector(selectIsSubmitDisabled, true);
  store.refreshState();
  fixture.detectChanges();

  // Set valid form values
  component.eventForm.get('userId')!.setValue('testUser');
  component.eventForm.get('type')!.setValue(EventType.Click);
  component.eventForm.get('description')!.setValue('Test description');

  component.onSubmit();

  expect(store.dispatch).not.toHaveBeenCalledWith(
    jasmine.objectContaining({ type: '[Event Form] Submit Event' })
  );
});

// Verify existing Enter test still passes (Task 5.3 — no new code, just confirm):
it('should trigger onSubmit when Enter key is pressed on Description field', () => {
  // Already exists at line 229 — verify it still passes after Task 2 changes
});
```

**`events-filter.component.spec.ts`:**

```typescript
// New tests (Task 5.4–5.6):
describe('Date range Escape key handler', () => {
  it('should clear date range when clearDateRange() is called', () => {
    component.filterForm.controls.dateFrom.setValue(new Date('2026-01-01'));
    component.filterForm.controls.dateTo.setValue(new Date('2026-12-31'));

    component.clearDateRange();

    expect(component.filterForm.controls.dateFrom.value).toBeNull();
    expect(component.filterForm.controls.dateTo.value).toBeNull();
  });

  it('should dispatch changeFilter when clearDateRange() is called', () => {
    component.clearDateRange();

    expect(store.dispatch).toHaveBeenCalledWith(
      changeFilter({ filter: { from: undefined, to: undefined } })
    );
  });

  it('should call clearDateRange() when Escape pressed on From date input', () => {
    spyOn(component, 'clearDateRange');
    const fromInput = fixture.nativeElement.querySelector('input[placeholder="From"]');
    fromInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.clearDateRange).toHaveBeenCalled();
  });

  it('should call clearDateRange() when Escape pressed on To date input', () => {
    spyOn(component, 'clearDateRange');
    const toInput = fixture.nativeElement.querySelector('input[placeholder="To"]');
    toInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.clearDateRange).toHaveBeenCalled();
  });
});
```

**Mock strategy:**
- All existing mocks unchanged (MockStore, MockActions, AnimationService spy, BreakpointObserver spy)
- No new services to mock

### Previous Story Intelligence (Story 5.1)

**Key learnings from Story 5.1 that directly impact this story:**

- **`inject()` function pattern** for DI — already established; use for any new DI if needed (none expected)
- **`takeUntilDestroyed()` pattern** — already established; not needed in this story (no new subscriptions in constructor for keyboard behavior)
- **`signal()` for local component state** — already established; not needed for keyboard story
- **`aria-disabled` vs `[disabled]`** — Story 5.1's implementation noted submit button uses `[disabled]`. Story 5.2 is the story that upgrades this to `aria-disabled` for WCAG compliance.
- **Current `displayedColumns`** — Managed by `BreakpointObserver` in Story 5.1. No changes needed for keyboard.
- **`clearInput()` method** — Already exists on `EventsFilterComponent`. Reuse for date range via `clearDateRange()`.
- **230 tests pass baseline** — Story 5.1 completed with 230 passing tests (44 new). Story 5.2 should add ~7 more tests. Update one existing test (disabled → aria-disabled). Final target: ~237 tests passing.
- **`BreakpointObserver.isMatched()` synchronous check** — Already used in `launchFlyingChip()`. Consider same pattern for the `aria-disabled` guard in `onSubmit()`.

### Git Intelligence

**Recent commit pattern:** `feat: {story-key} - {Story Title}` (from git log)

**Last 3 commits:**
- `4c00207` chore: update sprint-status 5-1 to review
- `6b622e3` feat: 5-1-responsive-layout-3-breakpoints - Responsive Layout (3 Breakpoints)
- `1aba562` feat: 4-5-row-insert-animation-and-context-aware-feedback - Row Insert Animation & Context-Aware Feedback

**Patterns established:**
- Standalone components with `imports: [...]` in `@Component` decorator
- `inject()` function for DI (not constructor injection)
- SCSS uses CSS custom properties from `_variables.scss`
- Test files co-located as `*.spec.ts`

**Current state of keyboard-related code (confirmed by file reads):**
- `event-form.component.html`: Enter on Description → `(keydown.enter)="onSubmit()"` ✅ line 40
- `events-filter.component.html`: Escape on userId filter → `(keydown.escape)="clearInput(filterForm.controls.userId)"` ✅ line 25
- `events-filter.component.html`: Escape on description filter → `(keydown.escape)="clearInput(filterForm.controls.description)"` ✅ line 44
- `events-filter.component.html`: Date range inputs → NO Escape handler ❌ (Task 3 adds this)
- `event-form.component.html`: Submit button → `[disabled]="isSubmitDisabled$ | async"` ❌ (Task 2 changes to aria-disabled)
- `styles.scss`: NO global `*:focus-visible` rule ❌ (Task 1 adds this)

### Latest Technical Information

- **CSS `:focus-visible`** — W3C standard (all modern browsers support it). Angular Material 19 also uses `:focus-visible` for its own focus rings. Adding a global `*:focus-visible` rule gives consistent behavior across Angular Material components and custom elements. Supported by Chrome 86+, Firefox 85+, Safari 15.4+ — sufficient for 2026 browser targets.
- **Angular Material M3 focus token** — `--mat-sys-focus-indicator-color` controls the focus ring color for Material components in M3 theme. Setting this to `var(--accent)` ensures all Material component focus rings match the UX spec.
- **`aria-disabled` vs `disabled`** — W3C WAI-ARIA 1.2 recommends `aria-disabled="true"` for interactive elements that should remain focusable but are temporarily unavailable. The native `disabled` attribute removes elements from the accessibility tree and tab order — which is wrong for "temporarily busy" states. Screen readers announce `aria-disabled="true"` elements as "unavailable" or "grayed out" while still allowing Tab to reach them. Combined with `aria-busy="true"`, the user hears "Submit event, grayed out, busy" — clear and informative.
- **`pointer-events: none` scope** — On `[aria-disabled="true"]` prevents mouse clicks; does NOT prevent keyboard events. This is exactly what we need: keyboard-accessible but mouse-click-proof.
- **Angular CDK `ListKeyManager`** — For table row navigation (↑/↓ keys from UX spec). This is a Growth Phase feature — NOT required in Story 5.2 ACs. The current `mat-table` supports Tab to sort headers but not ↑/↓ row navigation without `ListKeyManager`. The ACs for Story 5.2 do NOT include row navigation (it's not in the epics story for 5.2), so skip this.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — Acceptance criteria, user story statement, all 7 ACs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Keyboard Navigation] — Tab order specification, focus ring `outline: 2px solid #7c3aed; outline-offset: 2px`, Enter/Escape/Space behaviors
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy] — WCAG 2.1 AA target, `aria-*` annotations, focus indicator spec
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] — On blur per field, on submit all-field validation, keyboard focus flow
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns] — Submit button disabled state, aria-busy="true" during async cycle
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rules #1, #9, #12 (naming, patterns, CSS tokens)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Angular 19 Standalone Components, NgRx not for view state
- [Source: _bmad-output/planning-artifacts/prd.md#FR30] — Keyboard navigation requirement: Tab through fields, Enter to submit, visible focus indicators
- [Source: _bmad-output/implementation-artifacts/5-1-responsive-layout-3-breakpoints.md] — Previous story patterns: inject() DI, takeUntilDestroyed(), signal(), test mock strategies, 230-test baseline
- [Source: src/frontend/src/app/features/event-form/event-form.component.html] — Current template confirming Enter handler exists, disabled binding location
- [Source: src/frontend/src/app/features/events-filter/events-filter.component.html] — Current template confirming Escape handlers on text inputs, missing on date inputs
- [Source: src/frontend/src/styles/_material-overrides.scss] — Current Material token overrides, where to add focus indicator token
- [Source: src/frontend/src/styles.scss] — Current global styles, location for *:focus-visible rule

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: Added `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` to `styles.scss` (global WCAG 2.1 AA focus ring). Added `--mat-sys-focus-indicator-color: var(--accent)` to `_material-overrides.scss` `html` block so Angular Material M3 components inherit the accent-color focus ring.
- Task 2: Changed Submit button from native `[disabled]` to `[attr.aria-disabled]` in template, keeping the button in tab order while still visually appearing disabled. Added `aria-disabled` guard at top of `onSubmit()` to prevent keyboard double-submit. Added `[aria-disabled="true"]` SCSS rule with `pointer-events: none` to block mouse clicks. Updated and expanded spec tests to assert `aria-disabled` presence and `disabled === false`.
- Task 3: Added `clearDateRange()` public method to `EventsFilterComponent` that resets both date controls to null (the existing `merge()` valueChanges subscription automatically dispatches `changeFilter` with empty from/to). Added `(keydown.escape)="clearDateRange()"` to both `matStartDate` and `matEndDate` inputs in the filter template.
- Task 4: Verified tab order via DOM inspection — `app-event-form` appears before `app-events-filter`/`app-events-table` in `app.component.html`. No code changes required.
- Task 5: 235 tests pass (5 new tests added: double-submit guard, clearDateRange form reset, clearDateRange dispatch, Escape on From date, Escape on To date). `ng build` succeeds with zero errors.

### File List

- `src/frontend/src/styles.scss`
- `src/frontend/src/styles/_material-overrides.scss`
- `src/frontend/src/app/features/event-form/event-form.component.html`
- `src/frontend/src/app/features/event-form/event-form.component.ts`
- `src/frontend/src/app/features/event-form/event-form.component.scss`
- `src/frontend/src/app/features/event-form/event-form.component.spec.ts`
- `src/frontend/src/app/features/events-filter/events-filter.component.ts`
- `src/frontend/src/app/features/events-filter/events-filter.component.html`
- `src/frontend/src/app/features/events-filter/events-filter.component.spec.ts`
- `_bmad-output/implementation-artifacts/5-2-keyboard-navigation-and-focus-management.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

| Date | Change |
|------|--------|
| 2026-02-24 | Implemented Story 5.2: global `*:focus-visible` focus ring, Submit button `aria-disabled` approach (WCAG 2.1 AA), Escape key handler for date range filter inputs, 5 new tests (235 total passing). |
