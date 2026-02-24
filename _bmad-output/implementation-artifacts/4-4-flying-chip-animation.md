# Story 4.4: Flying Chip Animation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want to see a visual chip animate from the form to the table when I submit an event,
so that I experience the async pipeline as a tangible, satisfying journey.

## Acceptance Criteria

1. **Given** the End User clicks Submit with valid form data, **When** the submission NgRx action fires, **Then** a `FlyingChipComponent` is created programmatically via `ViewContainerRef.createComponent()`, and the chip displays event Type label + UserId (truncated to 12 chars) with Glass styling (violet semi-transparent background, `backdrop-filter: blur(8px)`, pill shape).

2. **Given** the chip is created, **When** the materializing phase begins, **Then** the chip scales from 0 to 1 at the Submit button's position (via `getBoundingClientRect()`) over 150ms with `ease-out`.

3. **Given** the chip has materialized, **When** the in-flight phase begins, **Then** the chip arcs toward the table header position over 400-600ms using spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`, and the chip has `opacity: 0.85` and `pointer-events: none` during flight.

4. **Given** the chip reaches the table area and SignalR has NOT yet fired, **When** the hovering phase begins, **Then** the chip hovers above the table header with a subtle pulse animation (scale 0.97 to 1.03) until the SignalR event arrives.

5. **Given** the SignalR `newEvent` is received, **When** the landing phase begins, **Then** the chip snaps down with a bounce effect (300ms, spring easing) then dissolves (200ms, `ease-in`, opacity 1 to 0), and the chip is removed from the DOM after dissolve completes.

6. **Given** the user has `prefers-reduced-motion: reduce` enabled, **When** an event is submitted, **Then** the flying chip animation is skipped entirely, and the new row appears with a simple fade-in instead.

7. **Given** any animation state, **When** the chip is present, **Then** it has `role="status"` with `aria-label="Event submitting"`.

## Tasks / Subtasks

- [x] Task 1: Create `AnimationService` in `core/services/` (AC: #6)
  - [x] 1.1 Create `animation.service.ts` as root-level injectable service
  - [x] 1.2 Implement `prefersReducedMotion` signal using `window.matchMedia('(prefers-reduced-motion: reduce)')`
  - [x] 1.3 Add `matchMedia` change listener to update signal reactively when user toggles preference
  - [x] 1.4 Implement `shouldAnimate(): boolean` helper method

- [x] Task 2: Create `FlyingChipComponent` in `shared/components/flying-chip/` (AC: #1, #2, #3, #4, #5, #7)
  - [x] 2.1 Create `flying-chip.component.ts` as standalone component with `@Input() eventType: EventType` and `@Input() userId: string`
  - [x] 2.2 Create template displaying pill-shaped chip with `EventTypeChipComponent`-style coloring + truncated UserId (12 chars max)
  - [x] 2.3 Create `flying-chip.component.scss` with Glass styling: `background: rgba(124, 58, 237, 0.3)`, `border: 1px solid rgba(124, 58, 237, 0.6)`, `backdrop-filter: blur(8px)`, `border-radius: 20px`, `pointer-events: none`
  - [x] 2.4 Set host element attributes: `role="status"`, `aria-label="Event submitting"`, `position: fixed`, `z-index: 9999`
  - [x] 2.5 Implement `animate(sourceRect: DOMRect, targetRect: DOMRect): Promise<void>` method orchestrating all 4 phases using Web Animations API
  - [x] 2.6 Phase 1 — Materializing: scale 0 to 1 at sourceRect center, 150ms, `ease-out`
  - [x] 2.7 Phase 2 — In-flight: translate from sourceRect to targetRect center, 400-600ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`, opacity 0.85
  - [x] 2.8 Phase 3 — Hovering: pulse scale 0.97 to 1.03 via looping Web Animation, await external signal to proceed
  - [x] 2.9 Phase 4 — Landing: bounce down 300ms spring easing, then dissolve opacity 1 to 0 over 200ms `ease-in`, then self-remove from DOM

- [x] Task 3: Extend submission NgRx store for chip animation lifecycle (AC: #1, #5)
  - [x] 3.1 Add new submission status values: `'chip-flying'`, `'waiting-signalr'`, `'landing'`, `'complete'` to `SubmissionState.status` type
  - [x] 3.2 Add new actions: `chipFlying`, `chipWaitingSignalr`, `chipLanding`, `chipLanded` in `submission.actions.ts`
  - [x] 3.3 Add reducer `on()` handlers for new actions
  - [x] 3.4 Add selector `selectSubmissionChipState` to expose chip lifecycle state

- [x] Task 4: Integrate flying chip into `EventFormComponent` (AC: #1, #2, #3, #4, #5, #6)
  - [x] 4.1 Inject `AnimationService`, `ViewContainerRef`, and `Store`
  - [x] 4.2 Add `#submitButton` ViewChild reference to get Submit button's `ElementRef` for `getBoundingClientRect()`
  - [x] 4.3 On `submitEventSuccess` action (via store subscription or effect): if `animationService.shouldAnimate()`, create `FlyingChipComponent` programmatically
  - [x] 4.4 Move created chip element to `document.body` for `position: fixed` overlay behavior
  - [x] 4.5 Get source position from Submit button `getBoundingClientRect()` and target position from table header element (via DOM query or injected reference)
  - [x] 4.6 Call `chipRef.instance.animate(sourceRect, targetRect)` to start animation
  - [x] 4.7 Dispatch `chipFlying` → `chipWaitingSignalr` actions at appropriate lifecycle points
  - [x] 4.8 Listen for `signalrEventReceived` action to signal chip landing (via store or effect)
  - [x] 4.9 On SignalR event received: trigger landing phase, dispatch `chipLanding` → `chipLanded`, destroy `ComponentRef`
  - [x] 4.10 If `prefers-reduced-motion`: skip chip creation entirely, let row fade-in be the only feedback

- [x] Task 5: Coordinate Submit button disable during full animation cycle (AC: #1)
  - [x] 5.1 Update Submit button `[disabled]` binding to remain disabled from click until `chipLanded` or `submitEventFailure`
  - [x] 5.2 Ensure form fields remain editable during chip flight (per UX spec — user can see their input)
  - [x] 5.3 On animation complete: re-enable Submit, reset form, refocus UserId field

- [x] Task 6: Unit tests (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 6.1 Create `flying-chip.component.spec.ts` — test rendering with type and userId inputs, verify `role="status"` and `aria-label` attributes
  - [x] 6.2 Create `animation.service.spec.ts` — test `shouldAnimate()` returns false when `prefers-reduced-motion: reduce`
  - [x] 6.3 Test submission reducer handles new chip lifecycle actions correctly
  - [x] 6.4 Test EventFormComponent skips chip creation when reduced motion is preferred
  - [x] 6.5 Verify `ng build` succeeds with zero errors

## Dev Notes

### Architecture Patterns & Constraints

- **ADR-3: Azure SignalR Service (Serverless)** — The chip landing is triggered by the `signalrEventReceived` NgRx action, which fires when the Azure Function broadcasts `newEvent` via SignalR output binding. The chip provides visual feedback during the 1-3 second window between API POST success and SignalR receipt.
- **ADR-5: NgRx Store** — The chip animation lifecycle is tracked in the `submission` store slice with new status values. All state mutations go through NgRx actions (Enforcement Rule #5).
- **Programmatic component creation** — `FlyingChipComponent` is created via `ViewContainerRef.createComponent()` inside `EventFormComponent`, matching the UX specification. The component is appended to `document.body` for `position: fixed` overlay behavior.
- **Web Animations API** — NOT `@angular/animations`. The architecture and UX specs explicitly require Web Animations API (`element.animate()`) for the chip. Angular 19 recommends native CSS/Web animations over the `@angular/animations` package.
- **Enforcement Rule #12:** All color values use CSS custom properties from `_variables.scss`. The chip uses `--accent` (`#7c3aed`) for its violet theme.
- **Enforcement Rule #5:** NgRx actions for all state mutations — chip lifecycle tracked via `chipFlying`, `chipWaitingSignalr`, `chipLanding`, `chipLanded` actions.
- **Enforcement Rule #9:** `provideStore()` / `provideEffects()` pattern — no changes to store configuration needed, only new actions/reducers within existing submission slice.

### Critical Implementation Details

#### FlyingChipComponent Structure

```typescript
@Component({
  selector: 'app-flying-chip',
  standalone: true,
  imports: [],
  template: `
    <span class="chip-content">
      <span class="chip-type" [style.color]="typeColor" [style.borderColor]="typeBorderColor">{{ eventType }}</span>
      <span class="chip-separator">·</span>
      <span class="chip-user">{{ truncatedUserId }}</span>
    </span>
  `,
  styleUrl: './flying-chip.component.scss',
  host: {
    'role': 'status',
    'aria-label': 'Event submitting',
    '[style.position]': '"fixed"',
    '[style.pointerEvents]': '"none"',
    '[style.zIndex]': '"9999"',
  },
})
export class FlyingChipComponent {
  @Input({ required: true }) eventType!: string;
  @Input({ required: true }) userId!: string;

  get truncatedUserId(): string {
    return this.userId.length > 12 ? this.userId.substring(0, 12) + '...' : this.userId;
  }

  // Type colors matching EventTypeChipComponent
  get typeColor(): string { /* map type to text color */ }
  get typeBorderColor(): string { /* map type to border color */ }
}
```

#### Animation Sequence (Web Animations API)

```typescript
async animate(sourceRect: DOMRect, targetRect: DOMRect, onSignalR: () => Promise<void>): Promise<void> {
  const el = this.elementRef.nativeElement;

  // Phase 1: Materialize at submit button
  el.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
  el.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
  el.style.transform = 'translate(-50%, -50%)';

  await el.animate(
    [{ transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
     { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }],
    { duration: 150, easing: 'ease-out', fill: 'forwards' }
  ).finished;

  // Phase 2: Arc flight to table header
  const dx = (targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2);
  const dy = (targetRect.top) - (sourceRect.top + sourceRect.height / 2);

  await el.animate(
    [{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
     { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 0.85 }],
    { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
  ).finished;

  // Phase 3: Hover with pulse until SignalR fires
  const pulseAnim = el.animate(
    [{ transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.97)` },
     { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.03)` }],
    { duration: 800, easing: 'ease-in-out', iterations: Infinity, direction: 'alternate' }
  );

  await onSignalR(); // Wait for SignalR event
  pulseAnim.cancel();

  // Phase 4: Landing bounce + dissolve
  await el.animate(
    [{ transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.03)` },
     { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 20}px)) scale(1)` }],
    { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
  ).finished;

  await el.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 200, easing: 'ease-in', fill: 'forwards' }
  ).finished;
}
```

#### AnimationService

```typescript
@Injectable({ providedIn: 'root' })
export class AnimationService {
  readonly prefersReducedMotion = signal(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  constructor() {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    mql.addEventListener('change', (e) => this.prefersReducedMotion.set(e.matches));
  }

  shouldAnimate(): boolean {
    return !this.prefersReducedMotion();
  }
}
```

#### Extended Submission State

```typescript
// submission.reducer.ts — extended status type
export interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'failure' | 'chip-flying' | 'waiting-signalr' | 'landing' | 'complete';
  error: string | null;
}
```

```typescript
// submission.actions.ts — new actions
export const chipFlying = createAction('[Submission] Chip Flying');
export const chipWaitingSignalr = createAction('[Submission] Chip Waiting SignalR');
export const chipLanding = createAction('[Submission] Chip Landing');
export const chipLanded = createAction('[Submission] Chip Landed');
```

#### EventFormComponent Integration

```typescript
// Key additions to event-form.component.ts
@ViewChild('submitButton', { read: ElementRef }) submitButtonRef!: ElementRef<HTMLElement>;

private launchFlyingChip(event: EventResponse): void {
  if (!this.animationService.shouldAnimate()) return;

  const chipRef = this.viewContainerRef.createComponent(FlyingChipComponent);
  chipRef.instance.eventType = event.type;
  chipRef.instance.userId = event.userId;
  chipRef.changeDetectorRef.detectChanges();

  // Move to body for position:fixed
  document.body.appendChild(chipRef.location.nativeElement);

  const sourceRect = this.submitButtonRef.nativeElement.getBoundingClientRect();
  const tableHeader = document.querySelector('.events-table mat-header-row') as HTMLElement;
  const targetRect = tableHeader.getBoundingClientRect();

  // Create SignalR promise
  const signalrPromise = new Promise<void>((resolve) => {
    const sub = this.actions$.pipe(
      ofType(signalrEventReceived),
      take(1)
    ).subscribe(() => {
      resolve();
      sub.unsubscribe();
    });
  });

  this.store.dispatch(chipFlying());

  chipRef.instance.animate(sourceRect, targetRect, () => {
    this.store.dispatch(chipWaitingSignalr());
    return signalrPromise;
  }).then(() => {
    this.store.dispatch(chipLanded());
    chipRef.destroy();
  });
}
```

#### Chip SCSS Styling

```scss
:host {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(124, 58, 237, 0.3);
  border: 1px solid rgba(124, 58, 237, 0.6);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  color: var(--text-primary, #ededed);
  white-space: nowrap;
}

.chip-type {
  font-weight: 500;
}

.chip-separator {
  color: var(--text-secondary, #a1a1a1);
}

.chip-user {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary, #a1a1a1);
}
```

### Critical Anti-Patterns to Avoid

- **DO NOT** use `@angular/animations` (`trigger`, `state`, `transition`, `animate`) — use native Web Animations API (`element.animate()`) per architecture spec. Angular animations add unnecessary complexity for programmatic overlay animations.
- **DO NOT** hardcode color values in component SCSS — use CSS custom properties from `_variables.scss`. The chip's violet theme uses `--accent` (`#7c3aed`).
- **DO NOT** create the chip using Angular CDK Overlay — the chip is a simple `position: fixed` element appended to `document.body`. CDK Overlay is overkill.
- **DO NOT** use `setTimeout` for animation timing — use Web Animations API's `.finished` Promise for phase sequencing. This prevents timing drift and race conditions.
- **DO NOT** forget to call `chipRef.destroy()` after animation completes — this prevents memory leaks from orphaned ComponentRefs.
- **DO NOT** animate `pointer-events` — it is not animatable. Set it as a static CSS property.
- **DO NOT** skip the `prefers-reduced-motion` check — WCAG 2.1 AA compliance requires all animations to have reduced-motion fallbacks.
- **DO NOT** call `getBoundingClientRect()` during animation frames — measure positions once at animation start, not per frame.
- **DO NOT** dispatch NgRx actions inside animation callbacks synchronously — use `NgZone.run()` or ensure code runs inside Angular's zone for change detection.
- **DO NOT** use `ngOnChanges` for the chip — it's a programmatically created component with properties set via `instance.property = value`, not template-bound inputs. Use `changeDetectorRef.detectChanges()` after setting properties.

### Project Structure Notes

#### Files to CREATE:

| File | Purpose |
|------|---------|
| `src/frontend/src/app/shared/components/flying-chip/flying-chip.component.ts` | Standalone component with Web Animations API logic |
| `src/frontend/src/app/shared/components/flying-chip/flying-chip.component.html` | Template with chip content (type + userId) |
| `src/frontend/src/app/shared/components/flying-chip/flying-chip.component.scss` | Glass styling: violet bg, blur, pill shape, pointer-events: none |
| `src/frontend/src/app/shared/components/flying-chip/flying-chip.component.spec.ts` | Unit tests for rendering and accessibility attributes |
| `src/frontend/src/app/core/services/animation.service.ts` | Singleton service with `prefersReducedMotion` signal and `shouldAnimate()` |
| `src/frontend/src/app/core/services/animation.service.spec.ts` | Unit tests for reduced motion detection |

#### Files to MODIFY:

| File | Change |
|------|--------|
| `src/frontend/src/app/store/submission/submission.actions.ts` | Add `chipFlying`, `chipWaitingSignalr`, `chipLanding`, `chipLanded` actions |
| `src/frontend/src/app/store/submission/submission.reducer.ts` | Extend `SubmissionState.status` type with chip lifecycle values; add `on()` handlers |
| `src/frontend/src/app/store/submission/submission.selectors.ts` | Add `selectSubmissionChipState` selector |
| `src/frontend/src/app/features/event-form/event-form.component.ts` | Inject `AnimationService`, `ViewContainerRef`, `Actions`; add `@ViewChild` for submit button; implement `launchFlyingChip()` method; listen for `submitEventSuccess` to trigger animation |
| `src/frontend/src/app/features/event-form/event-form.component.html` | Add `#submitButton` template reference on Submit button element |

#### Files NOT to touch:

| File | Reason |
|------|--------|
| `src/frontend/src/app/store/signalr/*` | SignalR store is Story 4.2's responsibility — already complete |
| `src/frontend/src/app/core/services/signalr.service.ts` | SignalR connection is Story 4.2 — already works |
| `src/frontend/src/app/features/events-table/*` | Table re-fetch on SignalR is handled by existing `signalr.effects.ts` — no changes needed |
| `src/frontend/src/app/app.config.ts` | No new store slices or effects — chip actions are added to existing submission slice |
| `src/frontend/src/styles/_variables.scss` | All color tokens already exist (`--accent`, `--text-primary`, `--text-secondary`) |
| Any `.NET` backend files | This is a frontend-only animation story |

### Library & Framework Requirements

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | `19.2.x` (already installed) | Component framework, `ViewContainerRef`, `signal()` |
| `@angular/cdk` | `19.2.x` (already installed) | Potential use of `BreakpointObserver` for viewport detection |
| `@ngrx/store` | `19.2.1` (already installed) | State management for chip lifecycle |
| `@ngrx/effects` | `19.2.1` (already installed) | Side effects for chip → SignalR coordination |
| Web Animations API | Browser-native | `element.animate()` — no package needed, supported in all modern browsers |

No new packages need to be installed.

### Testing Requirements

**Framework:** Karma + Jasmine (Angular convention, already configured)

**Test files to create:**

1. **`flying-chip.component.spec.ts`** — Presentational component tests:
   - Component creates successfully with required inputs
   - Renders chip with event type label and truncated userId
   - UserId truncated to 12 chars + "..." when exceeding 12 chars
   - UserId shown in full when 12 chars or fewer
   - Host element has `role="status"` attribute
   - Host element has `aria-label="Event submitting"` attribute
   - Host element has `position: fixed` style
   - Host element has `pointer-events: none` style

2. **`animation.service.spec.ts`** — Service tests:
   - `shouldAnimate()` returns `true` when `prefers-reduced-motion` is not set
   - `shouldAnimate()` returns `false` when `prefers-reduced-motion: reduce` is matched
   - `prefersReducedMotion` signal updates when matchMedia change event fires

3. **Submission reducer tests** (extend existing):
   - `chipFlying` action sets status to `'chip-flying'`
   - `chipWaitingSignalr` action sets status to `'waiting-signalr'`
   - `chipLanding` action sets status to `'landing'`
   - `chipLanded` action sets status to `'complete'`

**Mock strategy:**
- `FlyingChipComponent`: Pure presentational tests — set inputs, verify rendering. No animation testing in unit tests (Web Animations API is a browser API).
- `AnimationService`: Mock `window.matchMedia` to control `prefers-reduced-motion` behavior.
- `EventFormComponent` integration: Use `provideMockStore` for NgRx; mock `AnimationService.shouldAnimate()` return value.

### Previous Story Intelligence (Story 4.3)

**Key learnings from Story 4.3 that impact this story:**

- Story 4.3 established the **presentational component pattern** for shared components: `@Input()` for data, host bindings for accessibility attributes, CSS custom properties for colors.
- The `inject()` function pattern is used for DI (not constructor injection) — follow this pattern for `AnimationService`, `ViewContainerRef`, `Store`, `Actions`.
- Story 4.3 confirmed that `signalr.selectors.ts` exports `selectConnectionStatus` and `selectIsConnected` — these are available if needed.
- The `app.component.html` header structure includes the SignalR status dot — the flying chip operates independently as a body-appended overlay and does not interact with the header.
- CSS animations in Story 4.3 use `@keyframes` in SCSS — consistent with using Web Animations API in JS (both are native browser APIs, not Angular animations).

### Git Intelligence

**Recent commit pattern:** `feat: {story-key} - {Story Title}`

**Last 5 commits:**
- `5dbc691` feat: 4-2-angular-signalr-service-and-ngrx-integration — Angular SignalR Service & NgRx Integration
- `3fe7928` feat: 4-1-azure-function-signalr-output-binding-and-negotiate-endpoint
- `56f99ec` feat: 3-6-loading-and-empty-states
- `ef6926e` feat: 3-5-events-filter-bar-and-reactive-filtering
- `99d4596` feat: 3-4-event-type-chip-component

**Patterns established:**
- Standalone components with `imports: [...]` in `@Component` decorator
- `@Input()` decorator with `{ required: true }` for mandatory props
- Host binding via `host: { ... }` in `@Component` metadata (used in EmptyState, SignalRStatusDot)
- SCSS uses CSS custom properties from `_variables.scss`
- Components co-located in `shared/components/{component-name}/` folder
- Test files co-located as `*.spec.ts`
- `inject()` function for DI (not constructor injection)
- Commit message format: `feat: {story-key} - {Story Title}`

**Recent code patterns from Story 4.2 (directly relevant):**
- `SignalRService` dispatches `signalrEventReceived` action with `EventResponse` payload
- `SignalrEffects.eventReceived$` checks if user is on page 1, then dispatches `loadEvents`
- The submission flow: `submitEvent` → API POST → `submitEventSuccess` → toast + form reset
- The flying chip needs to intercept between `submitEventSuccess` and `signalrEventReceived` to orchestrate the animation

### Latest Technical Information

- **Angular 19**: `standalone: true` is now the default for components — can be omitted from decorator. Existing codebase still includes it explicitly for consistency.
- **Web Animations API**: `element.animate()` returns an `Animation` object with `.finished` promise for sequencing. Spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)` is fully supported (Y values > 1 create overshoot).
- **Angular 19 `afterRenderEffect()`**: New API that runs after rendering — better than `afterNextRender` for DOM measurement. Use this instead of `ngAfterViewInit` + `setTimeout` hacks.
- **`ViewContainerRef.createComponent()`**: Fully supported in Angular 19 with no deprecations. New `bindings` array option available but older `instance.property = value` pattern still works.
- **`position: fixed` + `pointer-events: none`**: Standard pattern for non-interactive overlays. No gotchas for the chip use case.
- **`prefers-reduced-motion`**: Well-supported across all modern browsers. Use both CSS media query (safety net for CSS transitions) and JavaScript `matchMedia` (for programmatic Web Animations API control).
- **Safari**: Requires `-webkit-backdrop-filter` prefix for `blur()` on the chip element.
- **Memory cleanup**: Always call `animation.cancel()` on any running animations before calling `chipRef.destroy()` to prevent "animation on destroyed element" warnings.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4] — Acceptance criteria, user story, all 7 ACs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#FlyingChipComponent] — Full visual design: states (materializing/in-flight/hovering/landing), timing, easing curves, glass styling, accessibility
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Animation & Motion Patterns] — Standard durations, spring easing, reduced motion fallbacks
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience Detail] — Experience mechanics: initiation, interaction, feedback, completion
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Flying chip as async pipeline feedback, replacing loading spinner
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] — Submit disabled during async cycle, form fields remain editable, form resets on success
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-3] — Azure SignalR Service serverless — chip landing tied to SignalR output
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5] — NgRx Store — submission state management for chip lifecycle
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Store Structure] — `submission.status` expanded with chip states
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Effects for Side Effects] — `chipAnimation$` effect: Submit → chip → wait for SignalR → landed
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rules #5 (NgRx), #9 (provideStore), #12 (SCSS tokens)
- [Source: _bmad-output/planning-artifacts/architecture.md#Angular Project Structure] — `shared/components/flying-chip/`, `core/services/animation.service.ts`
- [Source: _bmad-output/implementation-artifacts/4-3-signalr-status-dot-component.md] — Presentational component pattern, host bindings, CSS custom properties
- [Source: _bmad-output/implementation-artifacts/4-2-angular-signalr-service-and-ngrx-integration.md] — SignalR store selectors, event received flow
- [Source: MDN Web Animations API] — element.animate() usage, Animation.finished promise
- [Source: MDN prefers-reduced-motion] — Media query and matchMedia detection
- [Source: Angular v19 Programmatic Rendering] — ViewContainerRef.createComponent() API

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- This is the DEFINING EXPERIENCE of Event Hub — the flying chip is the signature interaction
- Story depends on Story 4.2 being completed (SignalR store + signalrEventReceived action)
- Story depends on Story 2.3/2.4 being completed (submission store + EventFormComponent)
- No new npm packages needed — Web Animations API is browser-native
- Extends existing submission store with chip lifecycle states (no new store slice)
- AnimationService is a new singleton service in core/services/ — reusable for Story 4.5 (row animation)
- The chip coordinates submission flow and SignalR flow — the two async events that define the app's experience
- prefers-reduced-motion fallback is a WCAG 2.1 AA requirement — not optional
- Safari requires -webkit-backdrop-filter prefix for blur on the chip
- Always destroy ComponentRef after animation to prevent memory leaks
- Story 4.5 (Row Insert Animation) builds on this story's AnimationService and chip lifecycle

### File List

- `src/frontend/src/app/core/services/animation.service.ts` (created)
- `src/frontend/src/app/core/services/animation.service.spec.ts` (created)
- `src/frontend/src/app/shared/components/flying-chip/flying-chip.component.ts` (created)
- `src/frontend/src/app/shared/components/flying-chip/flying-chip.component.scss` (created)
- `src/frontend/src/app/shared/components/flying-chip/flying-chip.component.spec.ts` (created)
- `src/frontend/src/app/store/submission/submission.actions.ts` (modified)
- `src/frontend/src/app/store/submission/submission.reducer.ts` (modified)
- `src/frontend/src/app/store/submission/submission.selectors.ts` (modified)
- `src/frontend/src/app/store/submission/submission.reducer.spec.ts` (modified)
- `src/frontend/src/app/features/event-form/event-form.component.ts` (modified)
- `src/frontend/src/app/features/event-form/event-form.component.html` (modified)
- `src/frontend/src/app/features/event-form/event-form.component.spec.ts` (modified)
- `src/frontend/src/app/app.component.spec.ts` (modified)

### Change Log

- **2026-02-24**: Implemented flying chip animation (Story 4.4). Created AnimationService with prefers-reduced-motion detection, FlyingChipComponent with 4-phase Web Animations API sequence (materialize, in-flight, hover, landing), extended NgRx submission store with chip lifecycle states, integrated animation into EventFormComponent coordinating submission flow with SignalR events, added Submit button disable during full animation cycle. All 186 tests pass, zero regressions, build succeeds.
