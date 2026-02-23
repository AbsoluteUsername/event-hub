# Story 2.5: Form Submission Feedback (Toast Notifications)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want to see clear toast notifications after submitting an event,
So that I know whether my event was accepted or what went wrong.

## Acceptance Criteria

1. **Given** a successful event submission (API returns 201 Created)
   **When** `submitEventSuccess` action fires
   **Then** a success toast appears via `MatSnackBar` with message "Event submitted successfully"
   **And** the toast has Glass theme styling: dark background (`rgba(17,17,17,0.95)`), `backdrop-filter: blur(16px)`, green left border (`#22c55e`)
   **And** the toast auto-dismisses after 3 seconds

2. **Given** a failed event submission (API returns 400 or 500)
   **When** `submitEventFailure` action fires
   **Then** an error toast appears with message "Failed to submit event. Please try again." (for 500) or specific field errors (for 400)
   **And** the toast has red left border (`#ef4444`)
   **And** the toast shows for 5 seconds with a dismiss button

3. **Given** a network error occurs
   **When** the HTTP request fails with no response (`status === 0`)
   **Then** an error toast appears with "Connection error. Check your network."
   **And** the toast has red left border (`#ef4444`)
   **And** the toast shows for 5 seconds with a dismiss button

## Tasks / Subtasks

- [x] Task 1: Create Toast Notification Service (AC: #1, #2, #3)
  - [x] 1.1 Create `NotificationService` at `src/frontend/src/app/core/services/notification.service.ts`
  - [x] 1.2 Inject `MatSnackBar` from `@angular/material/snack-bar`
  - [x] 1.3 Implement `showSuccess(message: string)` method — opens snackbar with `duration: 3000`, `panelClass: ['toast-success']`, `horizontalPosition: 'end'`, `verticalPosition: 'bottom'`
  - [x] 1.4 Implement `showError(message: string)` method — opens snackbar with action `'Dismiss'`, `duration: 5000`, `panelClass: ['toast-error']`, `horizontalPosition: 'end'`, `verticalPosition: 'bottom'`

- [x] Task 2: Add Toast Effects to Submission Effects (AC: #1, #2, #3)
  - [x] 2.1 Inject `NotificationService` into `SubmissionEffects` at `src/frontend/src/app/store/submission/submission.effects.ts`
  - [x] 2.2 Add `submitSuccess$` effect: listens to `submitEventSuccess` → calls `notificationService.showSuccess('Event submitted successfully')` — use `{ dispatch: false }`
  - [x] 2.3 Add `submitFailure$` effect: listens to `submitEventFailure` → reads `action.error` → calls `notificationService.showError(action.error)` — use `{ dispatch: false }`

- [x] Task 3: Add Glass Theme Toast Styles (AC: #1, #2)
  - [x] 3.1 Add toast CSS classes in `src/frontend/src/styles/_material-overrides.scss`
  - [x] 3.2 `.toast-success` class: background `rgba(17,17,17,0.95)`, `backdrop-filter: blur(16px)`, `border-left: 3px solid #22c55e`, max-width `360px`
  - [x] 3.3 `.toast-error` class: same background/blur, `border-left: 3px solid #ef4444`, max-width `360px`
  - [x] 3.4 Base `.mat-mdc-snack-bar-container` overrides: position bottom-right `16px` from edges, font-family Inter, color `var(--text-primary)`

- [x] Task 4: Accessibility (AC: #1, #2, #3)
  - [x] 4.1 Success toasts: use `politeness: 'polite'` (maps to `role="status"`)
  - [x] 4.2 Error toasts: use default `politeness: 'assertive'` (maps to `role="alert"`)

- [x] Task 5: Unit Tests — NotificationService (AC: #1, #2, #3)
  - [x] 5.1 Create `src/frontend/src/app/core/services/notification.service.spec.ts`
  - [x] 5.2 Test `showSuccess()` calls `MatSnackBar.open()` with correct message, duration 3000, panelClass `['toast-success']`
  - [x] 5.3 Test `showError()` calls `MatSnackBar.open()` with correct message, action `'Dismiss'`, duration 5000, panelClass `['toast-error']`
  - [x] 5.4 Test positions are `horizontalPosition: 'end'`, `verticalPosition: 'bottom'`

- [x] Task 6: Unit Tests — Submission Effects Toast Integration (AC: #1, #2, #3)
  - [x] 6.1 Update `src/frontend/src/app/store/submission/submission.effects.spec.ts`
  - [x] 6.2 Test `submitSuccess$` effect calls `notificationService.showSuccess('Event submitted successfully')` on `submitEventSuccess` action
  - [x] 6.3 Test `submitFailure$` effect calls `notificationService.showError(errorMessage)` on `submitEventFailure` action
  - [x] 6.4 Test error message passthrough for different error types (400 field errors, 500 generic, network)

- [x] Task 7: Verify End-to-End Flow
  - [x] 7.1 Run `ng test` — all existing + new tests pass
  - [x] 7.2 Run `ng lint` — 0 errors
  - [x] 7.3 Run `ng build` — successful production build

## Dev Notes

### Architecture Patterns & Constraints

- **Toast trigger mechanism**: Angular Material `MatSnackBar` used directly — architecture doc confirms "no separate service needed" but a thin `NotificationService` wrapper is cleaner for reuse across Epic 3 (GET errors) and Epic 4 (filter-aware toasts)
- **Effect-driven toasts**: Toasts MUST be triggered from NgRx Effects (side effects), NOT from components — this keeps components pure and state-driven
- **Error message extraction**: Already implemented in `SubmissionEffects.extractErrorMessage()` — returns formatted strings for 400 field errors, network errors, and generic 500 errors. Do NOT duplicate this logic
- **Submission state flow**: `idle → submitting → success/failure → idle` — the `EventFormComponent.ngOnInit()` already subscribes to status changes for form reset. Toast effects run in parallel (separate effect, `dispatch: false`)

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Why |
|------|-------|-----|
| `SubmissionEffects` class | `store/submission/submission.effects.ts` | Add new effects here — do NOT create a separate effects class |
| `extractErrorMessage()` | `submission.effects.ts` (private method) | Already handles 400/500/network error formatting |
| `submitEventSuccess` action | `store/submission/submission.actions.ts` | Listen to this for success toast |
| `submitEventFailure` action | `store/submission/submission.actions.ts` | Listen to this for error toast — `error` prop has pre-formatted message |
| Snackbar CSS overrides | `styles/_material-overrides.scss` | Already has `.mat-mdc-snack-bar-container` base overrides — extend, don't replace |
| CSS variables | `styles/_variables.scss` | Use `--success: #22c55e`, `--error: #ef4444`, `--text-primary`, `--bg-elevated` |
| `provideAnimationsAsync()` | `app.config.ts` | Already configured — required for snackbar animations |

### Critical Anti-Patterns to Avoid

- **DO NOT** trigger toasts from `EventFormComponent` — use NgRx Effects
- **DO NOT** create a custom snackbar component for MVP — `MatSnackBar.open()` with `panelClass` is sufficient for text-only toasts. Custom components are for Epic 4's filter-aware toast with action links
- **DO NOT** duplicate `extractErrorMessage()` logic — the effect already produces formatted error strings
- **DO NOT** add `MatSnackBarModule` to `app.config.ts` providers — `MatSnackBar` is injectable directly as a standalone service in Angular Material v19
- **DO NOT** use `*ngIf` — use `@if` control flow (Angular 19)
- **DO NOT** modify the existing `submitEvent$` effect — add NEW effects alongside it

### Project Structure Notes

```
src/frontend/src/app/
├── core/services/
│   ├── event.service.ts              # Existing — HTTP calls
│   └── notification.service.ts       # NEW — MatSnackBar wrapper
├── store/submission/
│   ├── submission.actions.ts          # Existing — no changes needed
│   ├── submission.reducer.ts          # Existing — no changes needed
│   ├── submission.selectors.ts        # Existing — no changes needed
│   └── submission.effects.ts          # MODIFY — add toast effects + inject NotificationService
├── styles/
│   ├── _variables.scss                # Existing — has --success, --error vars
│   └── _material-overrides.scss       # MODIFY — add .toast-success, .toast-error classes
```

### Toast Styling Specification (Glass Theme)

```scss
// Base toast anatomy
.toast-success,
.toast-error {
  // Glass background
  --mdc-snackbar-container-color: rgba(17, 17, 17, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  // Text
  --mdc-snackbar-supporting-text-color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  // Layout
  max-width: 360px;
}

.toast-success {
  border-left: 3px solid var(--success); // #22c55e
}

.toast-error {
  border-left: 3px solid var(--error); // #ef4444
}
```

### NotificationService Implementation Pattern

```typescript
// src/frontend/src/app/core/services/notification.service.ts
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  showSuccess(message: string): void {
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['toast-success'],
      politeness: 'polite',
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['toast-error'],
    });
  }
}
```

### New Effects Implementation Pattern

```typescript
// Add to existing SubmissionEffects class in submission.effects.ts

private readonly notificationService = inject(NotificationService);

submitSuccess$ = createEffect(
  () => this.actions$.pipe(
    ofType(SubmissionActions.submitEventSuccess),
    tap(() => this.notificationService.showSuccess('Event submitted successfully'))
  ),
  { dispatch: false }
);

submitFailure$ = createEffect(
  () => this.actions$.pipe(
    ofType(SubmissionActions.submitEventFailure),
    tap(({ error }) => this.notificationService.showError(error))
  ),
  { dispatch: false }
);
```

### Testing Patterns (from Story 2.3)

**Effect tests** use this pattern:
```typescript
// In submission.effects.spec.ts
let notificationService: jasmine.SpyObj<NotificationService>;

beforeEach(() => {
  notificationService = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
  TestBed.configureTestingModule({
    providers: [
      SubmissionEffects,
      provideMockActions(() => actions$),
      { provide: NotificationService, useValue: notificationService },
      { provide: EventService, useValue: eventServiceSpy },
    ],
  });
});

it('should show success toast on submitEventSuccess', () => {
  actions$ = hot('-a', { a: submitEventSuccess({ event: mockEvent }) });
  effects.submitSuccess$.subscribe();
  expect(notificationService.showSuccess).toHaveBeenCalledWith('Event submitted successfully');
});
```

### Previous Story Learnings (from Epic 2)

- **Story 2.3**: Established NgRx effects pattern with `inject()` function — follow same pattern
- **Story 2.3**: Used `switchMap` for HTTP + `catchError` — toast effects use `tap` only (no dispatching)
- **Story 2.3**: Error extraction already handles all three error scenarios (400 fields, 500 generic, network) — toast just displays the pre-formatted string
- **Story 2.1**: API returns `400` with `{ "errors": { "field": "message" } }` format — already parsed in effects
- **All stories**: Tests use Jasmine + Karma with `TestBed.configureTestingModule` — follow same pattern

### Git Intelligence

Recent commits show single-story-per-commit pattern:
- `feat: 2-3-ngrx-submission-store-and-event-service - NgRx Submission Store & Event Service`
- `feat: 2-2-azure-function-event-processing-and-db-persistence - Azure Function Event Processing & DB Persistence`

Commit this story as: `feat: 2-5-form-submission-feedback-toast-notifications - Form Submission Feedback Toast Notifications`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Toast Notifications]
- [Source: _bmad-output/planning-artifacts/prd.md#FR3, FR4, FR23]
- [Source: src/frontend/src/app/store/submission/submission.effects.ts]
- [Source: src/frontend/src/styles/_material-overrides.scss]
- [Source: src/frontend/src/styles/_variables.scss]

### Latest Tech Notes (Angular Material 19.2.x)

- `MatSnackBar` is injectable directly — no module import needed in standalone components
- `provideAnimationsAsync()` (already in app.config) handles snackbar enter/exit animations
- `panelClass` applies to the snackbar overlay container — use global styles (not component-scoped)
- `politeness: 'polite'` → `role="status"` (success); default `'assertive'` → `role="alert"` (error)
- `MAT_SNACK_BAR_DEFAULT_OPTIONS` token can set defaults but is NOT needed — service encapsulates config

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Created `NotificationService` as a thin `MatSnackBar` wrapper with `showSuccess()` (3s, polite) and `showError()` (5s, assertive, Dismiss action)
- Added `submitSuccess$` and `submitFailure$` effects to existing `SubmissionEffects` class — both use `tap` + `{ dispatch: false }` pattern
- Extended `_material-overrides.scss` with Glass theme toast styles: dark glass background (`rgba(17,17,17,0.95)`), `backdrop-filter: blur(16px)`, green/red left borders
- Accessibility: success toasts use `politeness: 'polite'` (role=status), error toasts use default `assertive` (role=alert)
- 7 new tests for NotificationService (showSuccess config, showError config, positions, politeness)
- 3 new tests for SubmissionEffects toast integration (success toast, failure toast, error message passthrough for 400/500/network)
- All 44 tests pass, 0 lint errors, production build successful

### File List

- `src/frontend/src/app/core/services/notification.service.ts` (NEW)
- `src/frontend/src/app/core/services/notification.service.spec.ts` (NEW)
- `src/frontend/src/app/store/submission/submission.effects.ts` (MODIFIED)
- `src/frontend/src/app/store/submission/submission.effects.spec.ts` (MODIFIED)
- `src/frontend/src/styles/_material-overrides.scss` (MODIFIED)
- `_bmad-output/implementation-artifacts/2-5-form-submission-feedback-toast-notifications.md` (MODIFIED)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED)

## Change Log

- 2026-02-23: Implemented toast notification system for event submission feedback — NotificationService, NgRx effects, Glass theme styles, accessibility, and comprehensive unit tests (Story 2.5)
