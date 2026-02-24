# Story 4.3: SignalR Status Dot Component

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **End User**,
I want to see a visual indicator of the real-time connection status in the page header,
so that I know whether live updates are active.

## Acceptance Criteria

1. **Given** the SignalR connection is established, **When** the status dot renders, **Then** it shows a green dot (`#22c55e`) with glow (`box-shadow: 0 0 8px #22c55e`) and label "Connected".

2. **Given** the SignalR connection is reconnecting, **When** the status dot renders, **Then** it shows an amber dot (`#f59e0b`) with pulsing glow animation and label "Reconnecting...".

3. **Given** the SignalR connection is disconnected, **When** the status dot renders, **Then** it shows a grey dot (`#4a4a4a`) with no glow and label "Disconnected".

4. **Given** any connection state, **When** the dot renders, **Then** it has `role="status"` and `aria-live="polite"` for screen reader announcements, and a `matTooltip` shows full connection status message on hover.

## Tasks / Subtasks

- [ ] Task 1: Create `SignalRStatusDotComponent` in `shared/components/signalr-status-dot/` (AC: #1, #2, #3, #4)
  - [ ] 1.1 Create `signalr-status-dot.component.ts` as standalone component with `@Input() status: 'connected' | 'reconnecting' | 'disconnected'`
  - [ ] 1.2 Create inline or separate template with 8px colored circle, text label, `role="status"`, `aria-live="polite"`, and `matTooltip`
  - [ ] 1.3 Create `signalr-status-dot.component.scss` with color states, glow `box-shadow`, and pulsing CSS `@keyframes` animation for reconnecting state
  - [ ] 1.4 Add `prefers-reduced-motion` fallback — disable pulsing animation when reduced motion is preferred

- [ ] Task 2: Integrate component into AppComponent (AC: #1, #2, #3)
  - [ ] 2.1 Import `SignalRStatusDotComponent` in `app.component.ts`
  - [ ] 2.2 Inject NgRx `Store` and create `connectionStatus$` observable from `selectConnectionStatus` selector
  - [ ] 2.3 Replace `<span class="signalr-placeholder">` in `app.component.html` with `<app-signalr-status-dot [status]="connectionStatus$ | async">` (using `AsyncPipe`)

- [ ] Task 3: Unit tests (AC: #1, #2, #3, #4)
  - [ ] 3.1 Create `signalr-status-dot.component.spec.ts`
  - [ ] 3.2 Test: renders green dot with "Connected" label when status is 'connected'
  - [ ] 3.3 Test: renders amber dot with "Reconnecting..." label when status is 'reconnecting'
  - [ ] 3.4 Test: renders grey dot with "Disconnected" label when status is 'disconnected'
  - [ ] 3.5 Test: has `role="status"` and `aria-live="polite"` attributes
  - [ ] 3.6 Test: `matTooltip` is present with correct tooltip text per state
  - [ ] 3.7 Verify `ng build` succeeds with zero errors

## Dev Notes

### Architecture Patterns & Constraints

- **ADR-3: Azure SignalR Service (Serverless)** — The status dot reflects the client-side WebSocket connection status to Azure SignalR Service, not the API health. The connection goes through: Angular client -> Azure SignalR Service (via negotiate endpoint from API).
- **Presentational component pattern** — `SignalRStatusDotComponent` is a pure presentational component with `@Input() status`. The parent `AppComponent` reads from NgRx store and passes the value. This matches the UX specification API and the `EventTypeChipComponent` pattern already established.
- **Enforcement rule #5:** Use NgRx actions for ALL state mutations — the connection status is read via `selectConnectionStatus` selector from the signalr store slice (created in Story 4.2).
- **Enforcement rule #12:** Place SCSS tokens in `src/styles/_variables.scss` — the status dot colors (`--success`, `--warning`, `--text-disabled`) are already defined in `_variables.scss`. DO NOT use inline magic color values.
- **Enforcement rule #9:** Use `provideStore()` / `provideEffects()` pattern — already configured in `app.config.ts`. No changes needed to the store configuration for this story.

### Critical Implementation Details

#### Component Structure (Presentational)

```typescript
// signalr-status-dot.component.ts
@Component({
  selector: 'app-signalr-status-dot',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './signalr-status-dot.component.html',
  styleUrl: './signalr-status-dot.component.scss',
  host: {
    'role': 'status',
    'aria-live': 'polite',
  },
})
export class SignalRStatusDotComponent {
  @Input({ required: true }) status!: 'connected' | 'reconnecting' | 'disconnected';

  get label(): string { /* return 'Connected' | 'Reconnecting...' | 'Disconnected' */ }
  get tooltipText(): string { /* return full status description */ }
}
```

#### AppComponent Integration

```typescript
// app.component.ts — add Store injection
export class AppComponent {
  private store = inject(Store);
  connectionStatus$ = this.store.select(selectConnectionStatus);
}
```

```html
<!-- app.component.html — replace placeholder -->
<app-signalr-status-dot [status]="(connectionStatus$ | async) ?? 'disconnected'"></app-signalr-status-dot>
```

#### CSS Animation for Reconnecting Pulse

```scss
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px var(--warning); opacity: 1; }
  50% { box-shadow: 0 0 16px var(--warning); opacity: 0.7; }
}

.dot--reconnecting {
  background-color: var(--warning);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .dot--reconnecting {
    animation: none;
    box-shadow: 0 0 8px var(--warning);
  }
}
```

#### Tooltip Messages

| Status | Label | Tooltip |
|--------|-------|---------|
| `connected` | "Connected" | "Real-time updates are active" |
| `reconnecting` | "Reconnecting..." | "Attempting to reconnect to real-time service..." |
| `disconnected` | "Disconnected" | "Real-time updates are unavailable" |

### Critical Anti-Patterns to Avoid

- **DO NOT** inject `SignalRService` directly into the status dot component — it's a presentational component that receives status via `@Input()`. The store is the single source of truth.
- **DO NOT** use Angular `@angular/animations` for the pulsing effect — use pure CSS `@keyframes` animation. CSS animations are more performant and Angular 19 recommends native CSS animations.
- **DO NOT** hardcode color values in the component SCSS — use CSS custom properties from `_variables.scss` (`--success`, `--warning`, `--text-disabled`).
- **DO NOT** use `ngOnChanges` for simple input-driven rendering — Angular's change detection handles `@Input()` changes automatically. Use getter methods for derived values.
- **DO NOT** forget `prefers-reduced-motion` fallback — all animations MUST have reduced motion alternatives per UX spec and WCAG 2.1 AA compliance.
- **DO NOT** use `mat-icon` for the dot — it's a simple 8px CSS circle, not an icon. Using `mat-icon` would be over-engineering.
- **DO NOT** create the `signalr.selectors.ts` file — that's Story 4.2's responsibility. This story assumes it already exists.

### Project Structure Notes

#### Files to CREATE:

| File | Purpose |
|------|---------|
| `src/frontend/src/app/shared/components/signalr-status-dot/signalr-status-dot.component.ts` | Standalone presentational component |
| `src/frontend/src/app/shared/components/signalr-status-dot/signalr-status-dot.component.html` | Template with dot, label, tooltip |
| `src/frontend/src/app/shared/components/signalr-status-dot/signalr-status-dot.component.scss` | Styles: dot colors, glow, pulse animation |
| `src/frontend/src/app/shared/components/signalr-status-dot/signalr-status-dot.component.spec.ts` | Unit tests for all 3 states + accessibility |

#### Files to MODIFY:

| File | Change |
|------|--------|
| `src/frontend/src/app/app.component.ts` | Import `SignalRStatusDotComponent`, `AsyncPipe`, inject `Store`, add `connectionStatus$` observable |
| `src/frontend/src/app/app.component.html` | Replace `<span class="signalr-placeholder">` with `<app-signalr-status-dot [status]="(connectionStatus$ | async) ?? 'disconnected'">` |

#### Files NOT to touch:

| File | Reason |
|------|--------|
| `src/frontend/src/app/store/signalr/*` | SignalR store files are Story 4.2's responsibility |
| `src/frontend/src/app/core/services/signalr.service.ts` | SignalR service is Story 4.2's responsibility |
| `src/frontend/src/app/app.config.ts` | No new store slices or effects needed for this story |
| `src/frontend/src/styles/_variables.scss` | All needed color tokens already exist (`--success`, `--warning`, `--text-disabled`) |
| Any `.NET` backend files | This is a frontend-only component story |

### Library & Framework Requirements

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/material` | `19.2.x` (already installed) | `MatTooltipModule` for hover tooltip |
| `@angular/core` | `19.2.x` (already installed) | Component framework |
| `@ngrx/store` | `19.2.1` (already installed) | State management (for AppComponent store injection) |
| `rxjs` | `7.8.x` (already installed) | AsyncPipe observable subscription |

No new packages need to be installed.

### Testing Requirements

**Framework:** Karma + Jasmine (Angular convention, already configured)

**Test file to create:**

1. **`signalr-status-dot.component.spec.ts`** — Test all states and accessibility:
   - Component creates successfully
   - When `status='connected'`: dot has green background (`#22c55e`), label shows "Connected", glow box-shadow is present
   - When `status='reconnecting'`: dot has amber background (`#f59e0b`), label shows "Reconnecting...", pulsing animation class is applied
   - When `status='disconnected'`: dot has grey background (`#4a4a4a`), label shows "Disconnected", no glow
   - Host element has `role="status"` attribute
   - Host element has `aria-live="polite"` attribute
   - `matTooltip` directive is present and contains correct tooltip text per state
   - Component handles input changes reactively (change status from 'connected' to 'disconnected' and verify UI updates)

**Mock strategy:** No mocks needed — this is a pure presentational component with `@Input()`. Just set the input and verify rendering. Import `MatTooltipModule` and `NoopAnimationsModule` in test bed.

### Previous Story Intelligence (Story 4.2)

**Key learnings from Story 4.2 that impact this story:**

- Story 4.2 creates the NgRx signalr store slice with `selectConnectionStatus` and `selectIsConnected` selectors in `store/signalr/signalr.selectors.ts`.
- The `SignalrState` interface is `{ connectionStatus: 'connected' | 'reconnecting' | 'disconnected' }` with initial state `connectionStatus: 'disconnected'`.
- The `signalr.actions.ts` already exists with `signalrConnected`, `signalrReconnecting`, `signalrDisconnected` actions.
- The `signalr.reducer.ts` currently has an empty reducer — Story 4.2 adds `on()` handlers.
- Story 4.2 creates `SignalRService` that injects `Store` and dispatches connection status actions from SignalR callbacks.
- The `app.component.html` already has a `<span class="signalr-placeholder">` in the header — this story replaces it.
- Story 4.2 may also modify `app.component.ts` to inject `SignalRService` for connection startup — coordinate with that change by also importing `SignalRStatusDotComponent` and adding `Store` injection.

### Git Intelligence

**Recent commit pattern:** `feat: {story-key} - {Story Title}`

**Last 5 commits:**
- `3fe7928` feat: 4-1-azure-function-signalr-output-binding-and-negotiate-endpoint
- `56f99ec` feat: 3-6-loading-and-empty-states
- `ef6926e` feat: 3-5-events-filter-bar-and-reactive-filtering
- `99d4596` feat: 3-4-event-type-chip-component
- `ce3df04` feat: 3-3-events-table-component

**Patterns established:**
- Standalone components with `imports: [...]` in `@Component` decorator
- `@Input()` decorator for component props (EventTypeChipComponent pattern)
- Host binding via `host: { ... }` in `@Component` metadata (EmptyStateComponent pattern)
- SCSS uses CSS custom properties from `_variables.scss`
- Components co-located in `shared/components/{component-name}/` folder
- Test files co-located as `*.spec.ts`
- `inject()` function used for DI (not constructor injection)

### Latest Technical Information

- **Angular 19 recommends native CSS animations** over `@angular/animations` package for new code. Use `@keyframes` in SCSS for the pulsing glow effect — more performant and simpler.
- **`matTooltip`** works seamlessly with standalone components — just import `MatTooltipModule` in the component's `imports` array.
- **`role="status"`** has implicit `aria-live="polite"` and `aria-atomic="true"`. Adding both `role="status"` and explicit `aria-live="polite"` is acceptable and provides a clear accessibility contract.
- **Safari** requires `-webkit-backdrop-filter` prefix for blur effects — though this component doesn't use glassmorphism, it's good to note for consistency.
- **`prefers-reduced-motion`** CSS media query is well-supported across all modern browsers. Always include it for animated elements.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3] — Acceptance criteria and user story
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SignalRStatusDotComponent] — Visual design: 8px circle, 3 states, glow, tooltip, accessibility
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-3] — Azure SignalR Service serverless decision
- [Source: _bmad-output/planning-artifacts/architecture.md#NgRx Store Structure] — signalr state interface `connectionStatus`
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rules #5, #9, #12
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Architecture] — Standalone components, Angular 19
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy] — WCAG 2.1 AA, role="status", aria-live="polite"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Animation & Motion Patterns] — prefers-reduced-motion fallbacks
- [Source: _bmad-output/implementation-artifacts/4-2-angular-signalr-service-and-ngrx-integration.md] — SignalR store selectors, connection lifecycle
- [Source: Angular Material Tooltip API] — matTooltip usage for Angular 19 standalone
- [Source: MDN — ARIA: status role] — role="status" semantics and accessibility
- [Source: Angular v19 — Migrating to Native CSS Animations] — Recommendation to use CSS @keyframes

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- Story depends on Story 4.2 being completed (signalr store selectors and reducer handlers)
- No new npm packages needed — all dependencies already installed
- Pure presentational component — no direct store access, receives status via @Input
- AppComponent modification coordinates with Story 4.2 changes (both modify app.component.ts)
- Story 4.4 (Flying Chip Animation) and 4.5 (Row Insert Animation) are independent of this component
- CSS custom properties for all 3 status colors already exist in _variables.scss

### File List
