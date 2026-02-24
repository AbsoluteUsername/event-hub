# Story 2.4: Event Creation Form Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want to fill out a form with UserId, Type, and Description to submit a new event,
so that I can create events quickly with clear validation feedback.

## Acceptance Criteria

1. **AC1: Form Layout & Fields** — Given the Event Hub page is loaded, when the End User views the form panel, then the form displays three fields: UserId (`mat-input` text), Type (`mat-select` with PageView/Click/Purchase options), Description (`mat-input` text). UserId field receives focus on page load. The Submit button shows gradient styling (`#7c3aed → #5b21b6`) with glow effect (`box-shadow: 0 0 20px rgba(124,58,237,0.3)`).

2. **AC2: Client-Side Validation on Blur** — Given the End User leaves a required field empty or exceeds max length, when the field loses focus (blur), then `mat-error` displays inline validation message below the field (e.g., "Required", "Must be 100 characters or fewer" for UserId, "Must be 500 characters or fewer" for Description). The field border changes to `--error` color (`#ef4444`).

3. **AC3: Form Submission via NgRx** — Given all fields are valid, when the End User clicks Submit or presses Enter from the Description field, then the form dispatches `[Event Form] Submit Event` NgRx action with the form values (`CreateEventRequest`). The Submit button becomes disabled with `aria-busy="true"` during submission.

4. **AC4: Success Reset** — Given submission succeeds (API returns 201), when `submitEventSuccess` action fires, then the form resets to empty and UserId field receives focus.

5. **AC5: Failure Preservation** — Given submission fails (API returns 4xx/5xx), when `submitEventFailure` action fires, then the form preserves all entered values (no data loss) and the Submit button re-enables immediately.

## Tasks / Subtasks

- [x] Task 1: Create EventFormComponent scaffold (AC: #1)
  - [x] Create `src/frontend/src/app/features/event-form/event-form.component.ts` as standalone component with `selector: 'app-event-form'`
  - [x] Create `src/frontend/src/app/features/event-form/event-form.component.html` with Angular Material form layout
  - [x] Create `src/frontend/src/app/features/event-form/event-form.component.scss` with Glass theme styling
  - [x] Import: `ReactiveFormsModule`, `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`, `MatButtonModule`, `GlassPanelComponent`
  - [x] Inject `Store<AppState>` and set up NgRx selectors for `selectIsSubmitting` and `selectSubmissionStatus`

- [x] Task 2: Implement Reactive Form with validators (AC: #1, #2)
  - [x] Create `FormGroup` with 3 controls: `userId` (`Validators.required`, `Validators.maxLength(100)`), `type` (`Validators.required`), `description` (`Validators.required`, `Validators.maxLength(500)`)
  - [x] Set `updateOn: 'blur'` for validation trigger strategy on `userId` and `description` (NOT on the whole form — `type` should validate on change since it's a select)
  - [x] Implement `getErrorMessage(field)` helper method for readable error strings
  - [x] Wire `mat-error` elements to display validation messages per field
  - [x] Add character counter `mat-hint` on Description field showing current/max characters

- [x] Task 3: Implement form template with Angular Material (AC: #1, #2)
  - [x] Use `<form>` element (not `<div>`) with `role="form"` and `aria-label="Create Event"`
  - [x] UserId: `mat-form-field` with `appearance="outline"`, `mat-input`, placeholder "Enter your user ID", `aria-required="true"`
  - [x] Type: `mat-form-field` with `appearance="outline"`, `mat-select`, placeholder "Select event type", 3 `mat-option` (PageView, Click, Purchase)
  - [x] Description: `mat-form-field` with `appearance="outline"`, `mat-input`, placeholder "Describe the event", `aria-required="true"`
  - [x] Submit button: `mat-raised-button` with custom gradient class, `[disabled]` bound to `isSubmitting$`, `aria-busy` bound to `isSubmitting$`
  - [x] Tab order: UserId → Type → Description → Submit

- [x] Task 4: Implement form submission and NgRx dispatch (AC: #3)
  - [x] Create `onSubmit()` method: validate all fields, if valid → dispatch `submitEvent` action with form values as `CreateEventRequest`
  - [x] Bind `(ngSubmit)="onSubmit()"` on `<form>` element
  - [x] Bind `(keydown.enter)="onSubmit()"` on Description field for Enter-to-submit
  - [x] Mark all fields as touched on submit attempt (to trigger validation display for untouched fields)

- [x] Task 5: Implement success/failure reactions (AC: #4, #5)
  - [x] Subscribe to `selectSubmissionStatus` in component
  - [x] On `'success'`: reset form, set focus to UserId field via `ViewChild` + `ElementRef`
  - [x] On `'failure'`: do nothing (form preserves values automatically, Submit re-enables via `selectIsSubmitting` becoming false)
  - [x] Dispatch a `resetSubmissionStatus` action (new action needed) to return status to `'idle'` after handling success/failure, preventing re-triggering on store replay
  - [x] Use `effect()` or `ngOnInit` lifecycle with store subscription for status watching

- [x] Task 6: Add `resetSubmissionStatus` action to submission store (AC: #4, #5)
  - [x] Add `resetSubmissionStatus` action to `submission.actions.ts`: `createAction('[Event Form] Reset Submission Status')`
  - [x] Add `on(SubmissionActions.resetSubmissionStatus, ...)` handler in `submission.reducer.ts` → set status to `'idle'`, clear error
  - [x] This prevents stale 'success'/'failure' status persisting in store when user navigates or interacts again

- [x] Task 7: Style form component with Glass theme (AC: #1)
  - [x] Apply `app-glass-panel` wrapper around form content
  - [x] Style form fields: `--mdc-outlined-text-field-outline-color: var(--border)`, `--mdc-outlined-text-field-focus-outline-color: var(--border-focus)`
  - [x] Style Submit button: `background: linear-gradient(135deg, #7c3aed, #5b21b6)`, `box-shadow: 0 0 20px rgba(124,58,237,0.3)`, `color: white`, `height: 48px`, `border-radius: 8px`
  - [x] Style Submit button disabled state: reduce opacity, remove glow
  - [x] Use CSS custom properties from `_variables.scss` — no inline magic values (enforcement rule #12)

- [x] Task 8: Integrate form into app.component layout (AC: #1)
  - [x] Update `app.component.html` to include `<app-event-form>` replacing placeholder content
  - [x] Update `app.component.ts` to import `EventFormComponent`
  - [x] Layout: form panel on the left side (380px fixed width for desktop) within the main content area
  - [x] Wrap in appropriate layout structure for future side-by-side with events table (Story 3.3)

- [x] Task 9: Implement auto-focus on page load (AC: #1)
  - [x] Use `ViewChild` to get reference to UserId input element
  - [x] Call `.focus()` in `ngAfterViewInit()` lifecycle hook
  - [x] Ensure focus works on initial page load

- [x] Task 10: Write unit tests (AC: #1, #2, #3, #4, #5)
  - [x] Create `src/frontend/src/app/features/event-form/event-form.component.spec.ts`
  - [x] Test: form renders 3 fields (UserId, Type, Description) and Submit button
  - [x] Test: validation — empty required fields show mat-error on blur
  - [x] Test: validation — maxLength exceeded shows correct error message
  - [x] Test: valid form submission dispatches `submitEvent` action with correct payload
  - [x] Test: Submit button disabled when `isSubmitting` is true
  - [x] Test: form resets on `submitEventSuccess` status
  - [x] Test: form preserves values on `submitEventFailure` status
  - [x] Test: Enter key on Description field triggers submit
  - [x] Use `provideMockStore` with `selectIsSubmitting` and `selectSubmissionStatus` overrides

- [x] Task 11: Build verification (AC: #1, #2, #3, #4, #5)
  - [x] Run `ng build` — verify 0 errors
  - [x] Run `ng test --watch=false` — verify all tests pass (existing 21 + new form tests)
  - [x] Run `ng lint` — verify 0 linting errors

## Dev Notes

### Critical Context — What This Story Does

This is the **fourth story in Epic 2** (Event Submission Pipeline). It implements the **Angular Event Creation Form UI component** — the user-facing form that dispatches events to the NgRx submission store created in Story 2.3. This is the **first visible UI feature** in Epic 2 — all prior stories were backend or plumbing.

**Data flow for this story:**
```
User fills form → Angular Reactive Forms validates (client-side, on blur) →
  User clicks Submit / Enter from Description →
    → Component calls onSubmit() →
      → If valid: dispatch [Event Form] Submit Event with CreateEventRequest →
        → SubmissionEffects.submitEvent$ (Story 2.3) handles API call
        → Reducer updates status: idle → submitting → success/failure
      → Component reacts to status changes:
        → 'success': form.reset(), focus UserId
        → 'failure': form stays as-is, Submit re-enables
```

**What this story DOES NOT do:**
- Does NOT create toast notifications (that's Story 2.5)
- Does NOT create the flying chip animation (that's Story 4.4)
- Does NOT create the events table (that's Story 3.3)
- Does NOT implement responsive layout breakpoints (that's Story 5.1)
- Does NOT implement keyboard navigation polish (that's Story 5.2)
- Does NOT disable Submit button for the full async cycle until row highlight (that's Story 4.4/4.5 — for MVP this story disables only during HTTP request cycle)

### What Already Exists (DO NOT Recreate)

The NgRx submission infrastructure is 100% complete from Story 2.3. These files exist and are FUNCTIONAL:

| Component | File | Status |
|-----------|------|--------|
| Submission actions | `src/frontend/src/app/store/submission/submission.actions.ts` | EXISTS — `submitEvent`, `submitEventSuccess`, `submitEventFailure` |
| Submission reducer | `src/frontend/src/app/store/submission/submission.reducer.ts` | EXISTS — Full state transitions: idle→submitting→success/failure |
| Submission effects | `src/frontend/src/app/store/submission/submission.effects.ts` | EXISTS — `submitEvent$` effect with `EventService.create()` call |
| Submission selectors | `src/frontend/src/app/store/submission/submission.selectors.ts` | EXISTS — `selectSubmissionStatus`, `selectSubmissionError`, `selectIsSubmitting` |
| Event models | `src/frontend/src/app/shared/models/event.model.ts` | EXISTS — `EventType` enum, `CreateEventRequest`, `EventResponse` interfaces |
| PagedResult model | `src/frontend/src/app/shared/models/paged-result.model.ts` | EXISTS — `PagedResult<T>` generic interface |
| Event service | `src/frontend/src/app/core/services/event.service.ts` | EXISTS — `create(request)` calling `POST /api/events` |
| App config | `src/frontend/src/app/app.config.ts` | EXISTS — `provideStore`, `provideEffects(SubmissionEffects)`, `provideHttpClient` |
| Store root state | `src/frontend/src/app/store/index.ts` | EXISTS — `AppState` interface |
| Glass panel | `src/frontend/src/app/shared/components/glass-panel/` | EXISTS — standalone component with ng-content, `compact` input |
| App component | `src/frontend/src/app/app.component.ts` | EXISTS — shell with header, imports `GlassPanelComponent` |
| App template | `src/frontend/src/app/app.component.html` | EXISTS — header + main with glass panel wrapping placeholder text |
| SCSS variables | `src/frontend/src/styles/_variables.scss` | EXISTS — All CSS custom properties for Glass theme |
| Glass mixin | `src/frontend/src/styles/_glass.scss` | EXISTS — `glass-panel()` mixin |
| Material overrides | `src/frontend/src/styles/_material-overrides.scss` | EXISTS — M3 dark theme tokens, form field overrides |

**DO NOT:**
- Recreate any existing files listed above
- Modify `EventsState` or `SignalrState` reducers (those are other stories)
- Add toast notification logic (that's Story 2.5)
- Add error interceptor (later story)
- Add the events table or filter bar (Epic 3)
- Change environment files or API URLs

**DO:**
- Create new `EventFormComponent` in `features/event-form/`
- Add a `resetSubmissionStatus` action + reducer handler to the existing submission store
- Update `app.component.html` to render the form component
- Update `app.component.ts` to import the form component

### Architecture Patterns & Constraints

**MUST FOLLOW — Enforcement Rules relevant to this story:**

- **Rule #1:** Follow file naming conventions exactly — kebab-case for Angular files: `event-form.component.ts`, `event-form.component.html`, `event-form.component.scss`
- **Rule #5:** Use NgRx actions for all state mutations — form submission dispatches `submitEvent` action, NEVER calls `EventService.create()` directly from the component
- **Rule #9:** Use standalone component architecture — `imports: [...]` in `@Component` decorator, no NgModules
- **Rule #11:** Use `environment.ts` for API URL — NOT relevant directly in this story (EventService already handles this), but ensure no hardcoded URLs leak
- **Rule #12:** Place SCSS tokens in `src/styles/_variables.scss` — use CSS custom properties for all colors, no inline magic values in component SCSS

**Angular Material Usage Patterns (from UX spec):**
- `mat-form-field` with `appearance="outline"` for all input fields
- `mat-select` + `mat-option` for Type dropdown
- `mat-raised-button` for Submit (with gradient override)
- `mat-error` for validation messages (inside `mat-form-field`)
- `mat-hint` for character counter on Description

**Form Validation Strategy (from UX spec):**
- Validation fires on **blur** (field exit) — NOT on each keystroke
- On Submit with untouched fields: trigger all-field validation simultaneously, first invalid field receives focus
- Client-side only — server validation is handled by API (Story 2.1) and effects error extraction (Story 2.3)
- All 3 fields are required

**Field Specifications (from UX spec):**

| Field | Control | Validators | Placeholder | Error Messages |
|-------|---------|-----------|------------|---------------|
| UserId | `mat-input` text | Required, maxLength(100) | "Enter your user ID" | "Required", "Must be 100 characters or fewer" |
| Type | `mat-select` | Required | "Select event type" | "Required" |
| Description | `mat-input` text | Required, maxLength(500) | "Describe the event" | "Required", "Must be 500 characters or fewer" |

### Implementation Patterns

**Component Pattern (standalone with inject):**
```typescript
@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    GlassPanelComponent,
  ],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss',
})
export class EventFormComponent implements OnInit, AfterViewInit {
  private readonly store = inject(Store<AppState>);

  @ViewChild('userIdInput') userIdInput!: ElementRef<HTMLInputElement>;

  isSubmitting$ = this.store.select(selectIsSubmitting);
  submissionStatus$ = this.store.select(selectSubmissionStatus);

  eventForm = new FormGroup({
    userId: new FormControl('', {
      validators: [Validators.required, Validators.maxLength(100)],
      updateOn: 'blur',
    }),
    type: new FormControl<EventType | ''>('', {
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      validators: [Validators.required, Validators.maxLength(500)],
      updateOn: 'blur',
    }),
  });

  eventTypes = Object.values(EventType);
  // ...
}
```

**Template Pattern:**
```html
<app-glass-panel>
  <form [formGroup]="eventForm"
        (ngSubmit)="onSubmit()"
        role="form"
        aria-label="Create Event">
    <h2 class="form-title">Create Event</h2>

    <mat-form-field appearance="outline">
      <mat-label>User ID</mat-label>
      <input matInput formControlName="userId"
             placeholder="Enter your user ID"
             aria-required="true"
             #userIdInput>
      <mat-error *ngIf="eventForm.get('userId')?.hasError('required')">Required</mat-error>
      <mat-error *ngIf="eventForm.get('userId')?.hasError('maxlength')">Must be 100 characters or fewer</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Event Type</mat-label>
      <mat-select formControlName="type"
                  placeholder="Select event type"
                  aria-required="true">
        <mat-option *ngFor="let t of eventTypes" [value]="t">{{ t }}</mat-option>
      </mat-select>
      <mat-error *ngIf="eventForm.get('type')?.hasError('required')">Required</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline">
      <mat-label>Description</mat-label>
      <input matInput formControlName="description"
             placeholder="Describe the event"
             aria-required="true"
             (keydown.enter)="onSubmit()">
      <mat-error *ngIf="eventForm.get('description')?.hasError('required')">Required</mat-error>
      <mat-error *ngIf="eventForm.get('description')?.hasError('maxlength')">Must be 500 characters or fewer</mat-error>
      <mat-hint align="end">{{ eventForm.get('description')?.value?.length || 0 }} / 500</mat-hint>
    </mat-form-field>

    <button mat-raised-button
            type="submit"
            class="submit-button"
            [disabled]="isSubmitting$ | async"
            [attr.aria-busy]="(isSubmitting$ | async) ? 'true' : null"
            aria-label="Submit event">
      Submit Event
    </button>
  </form>
</app-glass-panel>
```

**Key decisions:**
1. `updateOn: 'blur'` on text inputs — validates when user exits field (not on every keystroke), matching UX spec
2. `type` control validates on `'change'` (default) — since `mat-select` fires change immediately on selection
3. `(keydown.enter)` on Description field — Enter submits the form per UX spec
4. `eventTypes = Object.values(EventType)` — dynamic iteration over enum values for `mat-option`
5. `@ViewChild('userIdInput')` — for focus management on success/load
6. `aria-required="true"` on all fields — WCAG 2.1 AA compliance

**Submit Handler Pattern:**
```typescript
onSubmit(): void {
  if (this.eventForm.invalid) {
    this.eventForm.markAllAsTouched();
    return;
  }

  const request: CreateEventRequest = {
    userId: this.eventForm.get('userId')!.value!,
    type: this.eventForm.get('type')!.value! as EventType,
    description: this.eventForm.get('description')!.value!,
  };

  this.store.dispatch(submitEvent({ request }));
}
```

**Success/Failure Reaction Pattern:**
```typescript
ngOnInit(): void {
  this.submissionStatus$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((status) => {
      if (status === 'success') {
        this.eventForm.reset();
        // reset form to pristine so mat-error doesn't show immediately
        this.eventForm.markAsPristine();
        this.eventForm.markAsUntouched();
        // focus UserId input
        setTimeout(() => this.userIdInput?.nativeElement?.focus());
        this.store.dispatch(resetSubmissionStatus());
      } else if (status === 'failure') {
        this.store.dispatch(resetSubmissionStatus());
      }
    });
}
```

**Key decisions:**
1. `takeUntilDestroyed(this.destroyRef)` — automatic unsubscribe using Angular's `DestroyRef` (modern pattern, Angular 16+)
2. `setTimeout` for focus — ensures DOM is updated before focus attempt
3. `resetSubmissionStatus()` dispatched after handling — prevents stale status causing re-trigger
4. Form `markAsPristine()` + `markAsUntouched()` after reset — prevents validation errors from showing on fresh empty form

**SCSS Pattern:**
```scss
:host {
  display: block;
}

.form-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 24px 0;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

mat-form-field {
  width: 100%;
}

.submit-button {
  height: 48px;
  background: linear-gradient(135deg, var(--accent), #5b21b6);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: var(--text-base);
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.3);
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
  border: none;

  &:hover:not(:disabled) {
    box-shadow: 0 0 30px rgba(124, 58, 237, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    box-shadow: none;
    cursor: not-allowed;
  }
}
```

### API Contract Reference

**POST /api/events** (implemented in Story 2.1, consumed via Story 2.3):

Request body (TypeScript `CreateEventRequest`):
```json
{
  "userId": "olena",
  "type": "PageView",
  "description": "Viewed homepage"
}
```

Success Response (201 Created → `submitEventSuccess`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "olena",
  "type": "PageView",
  "description": "Viewed homepage",
  "createdAt": "2026-02-23T14:30:00Z"
}
```

Error Response (400 Bad Request → `submitEventFailure`):
```json
{
  "errors": {
    "userId": "The UserId field is required.",
    "type": "The field Type is invalid."
  }
}
```

The `SubmissionEffects.extractErrorMessage()` already parses this into a readable string for `submitEventFailure.error` payload.

### Testing Strategy

**Unit tests (Karma + Jasmine) for EventFormComponent:**

| Test Case | What it Verifies | Setup |
|-----------|-----------------|-------|
| Form renders | 3 fields (UserId, Type, Description) + Submit button present | `TestBed` with `provideMockStore` |
| Validation: required | Empty UserId/Type/Description show "Required" `mat-error` after blur | Trigger blur event, check for `mat-error` |
| Validation: maxLength | UserId >100 chars shows error, Description >500 chars shows error | Set long value, blur, check `mat-error` text |
| Submit: valid | Dispatches `submitEvent` with correct `CreateEventRequest` payload | Fill form, click submit, verify `store.dispatch` spy |
| Submit: invalid | Does NOT dispatch, marks all touched, shows errors | Leave empty, click submit, verify no dispatch |
| Submit disabled | Button disabled when `isSubmitting` selector returns true | Override `selectIsSubmitting` to return true |
| Success: form reset | Form clears all fields after `submitEventSuccess` status | Set store state to `status: 'success'`, verify form empty |
| Failure: preserve | Form retains values after `submitEventFailure` status | Set store state to `status: 'failure'`, verify form values unchanged |
| Enter submits | Enter key on Description field triggers `onSubmit()` | Dispatch keydown.enter event on description input |
| aria-busy | Submit button has `aria-busy="true"` during submitting | Override `selectIsSubmitting`, check attribute |

**Test setup pattern:**
```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [EventFormComponent, NoopAnimationsModule],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectIsSubmitting, value: false },
          { selector: selectSubmissionStatus, value: 'idle' },
        ],
      }),
    ],
  }).compileComponents();

  store = TestBed.inject(MockStore);
  fixture = TestBed.createComponent(EventFormComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});
```

### Previous Story Intelligence

**From Story 2.3 (NgRx Submission Store & Event Service):**
- `submitEvent` action expects `props<{ request: CreateEventRequest }>()` — the form component must construct this exact type
- `selectIsSubmitting` returns `boolean` — use directly for button `[disabled]` binding
- `selectSubmissionStatus` returns `'idle' | 'submitting' | 'success' | 'failure'` — subscribe and react to `'success'` and `'failure'`
- **No `resetSubmissionStatus` action exists yet** — this story must add it to prevent stale status
- `SubmissionEffects` uses `switchMap` — if user submits twice rapidly, only the latest request is kept. The form should rely on `isSubmitting$` to prevent this UX issue
- Effects error extraction produces combined field-level error string (e.g., "userId: required; type: invalid") — this is used by Story 2.5 toast, NOT displayed in the form
- All 21 existing frontend tests passing — new tests must not break them

**From Story 1.6 (Angular SPA Foundation & Glass Theme):**
- `GlassPanelComponent` accepts `[compact]` boolean input — use default (non-compact) for the form panel
- `_variables.scss` has all required CSS tokens: `--accent`, `--error`, `--border`, `--border-focus`, `--text-primary`, `--text-secondary`
- `_material-overrides.scss` has form field overrides for `mat-mdc-form-field` — `outlined-text-field-outline-color` and `focus-outline-color` already set
- `app.component.scss` sets `max-width: 1280px`, `padding: 32px`, `margin: 0 auto` — form inherits this layout

### Git Intelligence

Recent commit pattern:
```
8b7f85e feat: 2-3-ngrx-submission-store-and-event-service - NgRx Submission Store & Event Service
06b9ff0 feat: 2-2-azure-function-event-processing-and-db-persistence - Azure Function Event Processing & DB Persistence
4702042 feat: 2-1-api-post-endpoint-and-server-side-validation - API POST Endpoint & Server-Side Validation
b6db634 feat: 1-6-angular-spa-foundation-and-glass-theme - Angular SPA Foundation & Glass Theme
```

- Branch naming: `feature/{story-key}` → `feature/2-4-event-creation-form-component`
- Commit message: `feat: {story-key} - {story title}` → `feat: 2-4-event-creation-form-component - Event Creation Form Component`
- Most recent story (2.3) established Angular patterns: `inject()`, class-based effects, kebab-case files, `@ngrx/store` imports

### Latest Technical Specifics

- **Angular 19.2.0 LTS** — Standalone components default. `inject()` function preferred over constructor injection. `DestroyRef` + `takeUntilDestroyed()` for automatic subscription cleanup.
- **Angular Material 19.x** — M3 design tokens. `mat-form-field` `appearance="outline"` is the standard. `mat-error` only shows when control is touched AND invalid. `MatSelectModule` is standalone-compatible.
- **NgRx 19.2.1** — `createAction`, `createReducer`, `createSelector`, `createEffect` APIs. `provideMockStore` for testing. Store selectors return `Observable<T>`.
- **Reactive Forms** — `FormGroup`, `FormControl` with `validators` and `updateOn`. `markAllAsTouched()` triggers validation display. `reset()` clears values AND resets touched/dirty/pristine flags.
- **RxJS 7.8** — `takeUntilDestroyed()` from `@angular/core/rxjs-interop` replaces manual unsubscribe patterns.

### Project Structure Notes

**Files to CREATE:**
```
src/frontend/src/app/
  features/
    event-form/
      event-form.component.ts              ← NEW (standalone component with Reactive Forms + NgRx)
      event-form.component.html            ← NEW (Angular Material form template)
      event-form.component.scss            ← NEW (Glass theme styling)
      event-form.component.spec.ts         ← NEW (Karma + Jasmine unit tests)
```

**Files to MODIFY:**
```
src/frontend/src/app/
  store/
    submission/
      submission.actions.ts                ← MODIFY (add resetSubmissionStatus action)
      submission.reducer.ts                ← MODIFY (add on() handler for resetSubmissionStatus)
  app.component.ts                         ← MODIFY (import EventFormComponent)
  app.component.html                       ← MODIFY (replace placeholder with <app-event-form>)
  app.component.scss                       ← MODIFY (add layout styles for form panel positioning)
```

**Files NOT to modify:**
```
src/frontend/src/app/store/events/           ← No changes (Story 3.2 scope)
src/frontend/src/app/store/signalr/          ← No changes (Story 4.2 scope)
src/frontend/src/app/store/index.ts          ← No changes (AppState already has submission slice)
src/frontend/src/app/core/services/          ← No changes (EventService already complete)
src/frontend/src/app/shared/models/          ← No changes (models already complete)
src/frontend/src/app/shared/components/      ← No changes (GlassPanelComponent used as-is)
src/frontend/src/environments/               ← No changes
src/frontend/src/styles/                     ← No changes (CSS tokens already defined)
src/EventHub.Api/                            ← No changes (backend story)
src/EventHub.Function/                       ← No changes (backend story)
src/EventHub.Domain/                         ← No changes
src/EventHub.Application/                    ← No changes
src/EventHub.Infrastructure/                 ← No changes
tests/                                       ← No changes (.NET tests)
```

**Alignment with architecture doc:** Fully aligned. Component goes in `features/event-form/` per architecture doc `§ Structure Patterns`. Uses `Reactive Forms` with `mat-form-field` as specified. NgRx dispatch pattern matches architecture doc `§ Communication Patterns`. File naming follows kebab-case convention. No conflicts detected.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — Acceptance criteria, user story, BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — NgRx Store structure, standalone components, inject() pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Angular project structure, features/ directory, store/ directory
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — NgRx action naming convention `[Source] Verb Noun`
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — 14 enforcement rules (especially #1, #5, #9, #11, #12)
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Error handling per layer, loading states
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Strategy] — Karma + Jasmine, provideMockStore
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — mat-form-field, mat-select, mat-raised-button, mat-error patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns] — Form validation on blur, Submit button gradient, field specs, character counter
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility] — Tab order, aria attributes, WCAG 2.1 AA, form element semantics
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows] — Journey 1: End-User Event Creation flow
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] — FR1 (submit event), FR2 (select Type), FR4 (inline field errors), FR5 (prevent invalid submission)
- [Source: _bmad-output/implementation-artifacts/2-3-ngrx-submission-store-and-event-service.md] — Previous story: NgRx submission store, selectors, effects, EventService
- [Source: src/frontend/src/app/app.config.ts] — Current config: provideStore, provideEffects(SubmissionEffects), provideHttpClient
- [Source: src/frontend/src/app/store/submission/submission.actions.ts] — Current actions: submitEvent, submitEventSuccess, submitEventFailure
- [Source: src/frontend/src/app/store/submission/submission.selectors.ts] — Current selectors: selectIsSubmitting, selectSubmissionStatus, selectSubmissionError
- [Source: src/frontend/src/app/shared/components/glass-panel/glass-panel.component.ts] — GlassPanelComponent with compact input
- [Source: src/frontend/src/styles/_variables.scss] — CSS custom properties: --accent, --error, --border, --border-focus, --text-primary
- [Source: src/frontend/src/styles/_material-overrides.scss] — M3 form field overrides already applied

## Change Log

- 2026-02-23: Implemented Event Creation Form Component — standalone Angular component with Reactive Forms, NgRx integration, Glass theme styling, client-side validation on blur, success/failure handling, auto-focus, and 12 unit tests. All 33 tests pass (21 existing + 12 new). Build and lint clean.
- 2026-02-24: Code review fixes — custom ErrorStateMatcher (required errors no longer show on empty-field blur, only on dirty or explicit submit); real-time description character counter via `(input)` event + `descriptionLength` signal; removed double `onSubmit()` on Enter key (form ngSubmit handles it); replaced DOM-attribute submit guard with `isSubmitDisabledValue` store mirror; removed dead `getErrorMessage()` method; extracted magic colors to `--accent-dark`, `--accent-glow`, `--accent-glow-hover` CSS variables; removed dead `selectSubmissionChipState` selector; added tests for complete-status reset, counter real-time update, and meaningful desktop-breakpoint assertion. 242 tests pass.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed `ExpressionChangedAfterItHasBeenCheckedError` by deferring `ngAfterViewInit` focus call via `setTimeout`
- Fixed lint errors: replaced `any` type with `Element` in test file, then corrected to `NodeListOf<Element>` cast for `querySelectorAll` return type
- Updated `app.component.spec.ts` to provide `MockStore` and `NoopAnimationsModule` since AppComponent now imports EventFormComponent which depends on NgRx Store
- Used Angular 19 `@if`/`@for` control flow syntax instead of `*ngIf`/`*ngFor` directives in template

### Completion Notes List

- Created `EventFormComponent` standalone component with `inject()` pattern, `DestroyRef` + `takeUntilDestroyed()` for subscription cleanup
- Implemented Reactive Form with `updateOn: 'blur'` for text inputs, default `'change'` for `mat-select`
- All 5 Acceptance Criteria satisfied: form layout (AC1), validation on blur (AC2), NgRx submission (AC3), success reset (AC4), failure preservation (AC5)
- Added `resetSubmissionStatus` action and reducer handler to prevent stale status in store
- Template uses semantic `<form>` with `role="form"`, `aria-label`, `aria-required`, `aria-busy` for WCAG 2.1 AA
- Form panel integrated into `app.component` with 380px fixed-width left panel layout (ready for future events table on right)
- 12 unit tests covering: component creation, form rendering, required validation, maxlength validation, valid/invalid submission dispatch, button disabled state, aria-busy attribute, success reset, failure preservation, Enter key submit

### File List

New files:
- src/frontend/src/app/features/event-form/event-form.component.ts
- src/frontend/src/app/features/event-form/event-form.component.html
- src/frontend/src/app/features/event-form/event-form.component.scss
- src/frontend/src/app/features/event-form/event-form.component.spec.ts

Modified files:
- src/frontend/src/app/store/submission/submission.actions.ts (added resetSubmissionStatus action)
- src/frontend/src/app/store/submission/submission.reducer.ts (added resetSubmissionStatus handler)
- src/frontend/src/app/app.component.ts (import EventFormComponent instead of GlassPanelComponent)
- src/frontend/src/app/app.component.html (replaced placeholder with event form layout)
- src/frontend/src/app/app.component.scss (added content-layout and form-panel styles)
- src/frontend/src/app/app.component.spec.ts (added MockStore provider and NoopAnimationsModule)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status: in-progress → review)
- _bmad-output/implementation-artifacts/2-4-event-creation-form-component.md (story file updates)

Code review fixes (2026-02-24):
- src/frontend/src/app/features/event-form/event-form.component.ts (ErrorStateMatcher, formSubmitted, descriptionLength signal, isSubmitDisabledValue guard, removed getErrorMessage)
- src/frontend/src/app/features/event-form/event-form.component.html (errorStateMatcher binding, real-time counter, removed keydown.enter)
- src/frontend/src/app/features/event-form/event-form.component.scss (CSS variables for accent-dark/accent-glow)
- src/frontend/src/app/features/event-form/event-form.component.spec.ts (updated and new tests)
- src/frontend/src/app/store/submission/submission.selectors.ts (removed dead selectSubmissionChipState)
- src/frontend/src/styles/_variables.scss (added --accent-dark, --accent-glow, --accent-glow-hover)
