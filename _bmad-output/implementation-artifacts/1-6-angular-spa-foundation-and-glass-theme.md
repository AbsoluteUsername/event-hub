# Story 1.6: Angular SPA Foundation & Glass Theme

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want the Angular workspace configured with Angular Material, custom dark Glass theme, NgRx store shell, and SCSS architecture,
so that the frontend is runnable with the visual foundation ready for feature components.

## Acceptance Criteria

1. **AC1: Angular Material Dark Theme** — Angular Material is installed with a custom dark theme via Material 3 (M3) theming API (`mat.theme()` mixin with `theme-type: dark`), using violet (`#7c3aed`) as the primary palette color.

2. **AC2: SCSS Architecture** — `src/styles/` contains:
   - `_variables.scss` with CSS custom properties (`--bg-base: #060714`, `--bg-surface: #111111`, `--accent: #7c3aed`, all tokens from UX spec)
   - `_glass.scss` with glassmorphism mixin (`backdrop-filter: blur(24px)`, border, border-radius) including `-webkit-` prefix for Safari
   - `_typography.scss` with Inter + JetBrains Mono font-face declarations and type scale tokens
   - `_material-overrides.scss` with Angular Material dark Glass theme overrides (form fields, table, paginator surfaces)

3. **AC3: Global Styles** — `styles.scss` imports all partials and applies base layout styles (body background `#060714`, font-family Inter)

4. **AC4: Google Fonts** — `index.html` includes Google Fonts CDN links for Inter (400, 500, 600) and JetBrains Mono (400), replacing the current Roboto link. Page title updated to "Event Hub".

5. **AC5: GlassPanelComponent** — `app/shared/components/glass-panel/` component exists with `ng-content` projection, default (24px padding) and compact (12px padding) variants. Uses glassmorphism styles from `_glass.scss`.

6. **AC6: NgRx Store Shell** — NgRx store is bootstrapped in `app.config.ts` with `provideStore()` containing empty reducer slices: `events`, `submission`, `signalr`. `provideEffects([])` and `provideStoreDevtools()` (dev only) are configured.

7. **AC7: Environment Configuration** — `environments/environment.ts` (dev) contains `{ production: false, apiUrl: 'https://localhost:5001' }`. `environments/environment.prod.ts` contains `{ production: true, apiUrl: 'https://production-api.com' }`.

8. **AC8: App Shell** — `app.component` renders a basic shell: header with "Event Hub" title, placeholder `<span>` for SignalR status dot, and main content area wrapped in `<app-glass-panel>`.

9. **AC9: Page Background** — Page background is `#060714` with violet/navy radial gradients per UX spec (two overlapping `radial-gradient` overlays).

10. **AC10: Build Verification** — `ng serve` starts on `localhost:4200` showing the Glass-themed shell without errors. `ng build` succeeds. `ng lint` passes with zero errors.

## Tasks / Subtasks

- [ ] Task 1: Remove prebuilt theme and install NgRx (AC: #1, #6)
  - [ ] Remove `@angular/material/prebuilt-themes/azure-blue.css` from `angular.json` styles array
  - [ ] Run `npm install @ngrx/store@19 @ngrx/effects@19 @ngrx/store-devtools@19` (use v19 to match Angular 19)
  - [ ] Verify `npm install` completes without errors

- [ ] Task 2: Create SCSS architecture (AC: #2, #3, #9)
  - [ ] Create directory `src/styles/`
  - [ ] Create `src/styles/_variables.scss` with ALL CSS custom properties from the UX spec Color System:
    ```scss
    :root {
      // Backgrounds
      --bg-base: #060714;
      --bg-surface: #111111;
      --bg-elevated: #1a1a1a;
      // Borders
      --border: #1f1f1f;
      --border-focus: #7c3aed;
      // Text
      --text-primary: #ededed;
      --text-secondary: #a1a1a1;
      --text-disabled: #4a4a4a;
      // Semantic
      --accent: #7c3aed;
      --accent-hover: #6d28d9;
      --success: #22c55e;
      --warning: #f59e0b;
      --error: #ef4444;
      // Event Type Chips
      --chip-pageview-bg: #1e3a5f;
      --chip-pageview-text: #60a5fa;
      --chip-pageview-border: #3b82f6;
      --chip-click-bg: #451a03;
      --chip-click-text: #fbbf24;
      --chip-click-border: #f59e0b;
      --chip-purchase-bg: #052e16;
      --chip-purchase-text: #4ade80;
      --chip-purchase-border: #22c55e;
      // Typography scale
      --text-xs: 11px;
      --text-sm: 13px;
      --text-base: 14px;
      --text-md: 16px;
      --text-lg: 20px;
      --mono-sm: 12px;
      --mono-base: 13px;
      // Glass
      --glass-bg: rgba(255, 255, 255, 0.04);
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-blur: 24px;
      --glass-radius: 16px;
    }
    ```
  - [ ] Create `src/styles/_glass.scss`:
    ```scss
    @mixin glass-panel($padding: 24px) {
      background: var(--glass-bg);
      -webkit-backdrop-filter: blur(var(--glass-blur));
      backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--glass-radius);
      padding: $padding;
    }

    @mixin glass-panel-compact {
      @include glass-panel(12px);
    }
    ```
  - [ ] Create `src/styles/_typography.scss` with Inter + JetBrains Mono `@font-face` fallback declarations and type scale classes (`.text-xs`, `.text-sm`, `.text-base`, `.text-md`, `.text-lg`, `.mono-sm`, `.mono-base`)
  - [ ] Create `src/styles/_material-overrides.scss` with Angular Material M3 theme definition:
    - Use `@use '@angular/material' as mat;`
    - Generate or define a violet-based M3 palette
    - Apply `mat.theme()` mixin with `theme-type: dark` and violet primary
    - Override `--mat-sys-surface` to `#111111`, `--mat-sys-background` to `#060714`
    - Override form field, table, paginator, and snackbar surfaces to match Glass aesthetic
  - [ ] Update `src/styles.scss` to import all partials and apply base body styles:
    ```scss
    @use './styles/material-overrides';
    @use './styles/variables';
    @use './styles/glass';
    @use './styles/typography';

    html, body {
      height: 100%;
      margin: 0;
    }

    body {
      background: var(--bg-base);
      background-image:
        radial-gradient(ellipse at 20% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(30, 58, 138, 0.15) 0%, transparent 50%);
      color: var(--text-primary);
      font-family: 'Inter', system-ui, sans-serif;
      font-size: var(--text-base);
      line-height: 1.6;
    }
    ```

- [ ] Task 3: Update index.html (AC: #4)
  - [ ] Replace Roboto Google Fonts link with Inter (400, 500, 600) + JetBrains Mono (400):
    ```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
    ```
  - [ ] Keep Material Icons link (still needed for `mat-icon`)
  - [ ] Update `<title>` from "Frontend" to "Event Hub"

- [ ] Task 4: Create GlassPanelComponent (AC: #5)
  - [ ] Create directory `src/app/shared/components/glass-panel/`
  - [ ] Create `glass-panel.component.ts` — standalone component with:
    - Selector: `app-glass-panel`
    - `@Input() compact: boolean = false`
    - Template: `<div [class.glass-panel]="!compact" [class.glass-panel-compact]="compact"><ng-content></ng-content></div>`
    - SCSS: Apply `@include glass-panel()` and `@include glass-panel-compact` from `_glass.scss`
  - [ ] Create `glass-panel.component.spec.ts` with basic render test

- [ ] Task 5: Configure NgRx store shell (AC: #6)
  - [ ] Create directory `src/app/store/`
  - [ ] Create `src/app/store/events/events.reducer.ts` with empty state:
    ```typescript
    import { createReducer } from '@ngrx/store';
    export interface EventsState {
      items: any[];
      totalCount: number;
      loading: boolean;
      error: string | null;
    }
    export const initialEventsState: EventsState = {
      items: [],
      totalCount: 0,
      loading: false,
      error: null,
    };
    export const eventsReducer = createReducer(initialEventsState);
    ```
  - [ ] Create `src/app/store/submission/submission.reducer.ts` with empty state:
    ```typescript
    import { createReducer } from '@ngrx/store';
    export interface SubmissionState {
      status: 'idle' | 'submitting' | 'success' | 'failure';
      error: string | null;
    }
    export const initialSubmissionState: SubmissionState = {
      status: 'idle',
      error: null,
    };
    export const submissionReducer = createReducer(initialSubmissionState);
    ```
  - [ ] Create `src/app/store/signalr/signalr.reducer.ts` with empty state:
    ```typescript
    import { createReducer } from '@ngrx/store';
    export interface SignalrState {
      connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
    }
    export const initialSignalrState: SignalrState = {
      connectionStatus: 'disconnected',
    };
    export const signalrReducer = createReducer(initialSignalrState);
    ```
  - [ ] Create `src/app/store/index.ts` with root AppState interface:
    ```typescript
    import { EventsState } from './events/events.reducer';
    import { SubmissionState } from './submission/submission.reducer';
    import { SignalrState } from './signalr/signalr.reducer';
    export interface AppState {
      events: EventsState;
      submission: SubmissionState;
      signalr: SignalrState;
    }
    ```

- [ ] Task 6: Update app.config.ts (AC: #6)
  - [ ] Import `provideStore` from `@ngrx/store`, `provideEffects` from `@ngrx/effects`, `provideStoreDevtools` from `@ngrx/store-devtools`
  - [ ] Import `provideHttpClient`, `withInterceptors` from `@angular/common/http`
  - [ ] Import `provideAnimationsAsync` from `@angular/platform-browser/animations/async`
  - [ ] Import all three reducers
  - [ ] **CRITICAL:** Use `provideStore()` NOT `StoreModule.forRoot()` (Enforcement Rule #9)
  - [ ] Configuration:
    ```typescript
    export const appConfig: ApplicationConfig = {
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideStore({
          events: eventsReducer,
          submission: submissionReducer,
          signalr: signalrReducer,
        }),
        provideEffects([]),
        provideStoreDevtools({ maxAge: 25, logOnly: false }),
        provideHttpClient(withInterceptors([])),
        provideAnimationsAsync(),
      ],
    };
    ```

- [ ] Task 7: Update environment files (AC: #7)
  - [ ] Update `src/environments/environment.ts`:
    ```typescript
    export const environment = {
      production: false,
      apiUrl: 'https://localhost:5001'
    };
    ```
  - [ ] Update `src/environments/environment.development.ts`:
    ```typescript
    export const environment = {
      production: false,
      apiUrl: 'https://localhost:5001'
    };
    ```
  - [ ] **NOTE:** The current project has `environment.ts` and `environment.development.ts` (Angular 19 default). The architecture doc expects `environment.ts` (prod) and `environment.prod.ts`. Check `angular.json` fileReplacements to determine which is the production config and update accordingly. Ensure the dev config points to `https://localhost:5001` and prod has `https://production-api.com`.

- [ ] Task 8: Update AppComponent shell (AC: #8)
  - [ ] Replace the entire default template (`app.component.html`) with the shell layout:
    ```html
    <header class="app-header">
      <h1 class="app-title">Event Hub</h1>
      <span class="signalr-placeholder"><!-- SignalR status dot placeholder --></span>
    </header>
    <main class="app-main">
      <app-glass-panel>
        <p class="placeholder-text">Application content will be rendered here.</p>
      </app-glass-panel>
    </main>
    ```
  - [ ] Update `app.component.ts`:
    - Import `GlassPanelComponent` in the `imports` array
    - Update title to `'Event Hub'`
  - [ ] Add `app.component.scss` styles:
    ```scss
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      padding: 32px;
      max-width: 1280px;
      margin: 0 auto;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
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

    .placeholder-text {
      color: var(--text-secondary);
      text-align: center;
      padding: 48px 0;
    }
    ```
  - [ ] Update `app.component.spec.ts` to match new template (remove old tests for default content)

- [ ] Task 9: Build and lint verification (AC: #10)
  - [ ] Run `ng lint` — verify 0 errors
  - [ ] Run `ng build` — verify successful build
  - [ ] Run `ng serve` — verify app starts on `localhost:4200`
  - [ ] Visually confirm: dark background (`#060714`), violet/navy gradient overlays, Glass-themed shell with "Event Hub" header

## Dev Notes

### Critical Dependencies

- **Story 1.1 (Solution Scaffold)** — COMPLETED. Provides the Angular 19 workspace with Angular Material 19.2.19, ESLint, SCSS support. All scaffolded and building.
- **No backend dependency** — This story is frontend-only. No API calls needed; NgRx store is shell-only (empty reducers).

### Current Frontend State (What Exists)

The Angular project at `src/frontend/` is a **minimal scaffold** from `ng new`:

| Aspect | Current State | Target State |
|--------|--------------|-------------|
| Theme | Azure Blue prebuilt (`azure-blue.css` in angular.json) | Custom M3 dark Glass theme via SCSS |
| Fonts | Roboto from Google Fonts | Inter + JetBrains Mono from Google Fonts |
| Components | Only `AppComponent` with default Angular welcome page | AppComponent shell + GlassPanelComponent |
| State mgmt | None | NgRx with 3 empty store slices |
| Styles | `styles.scss` with `html, body { height: 100% }` | Full SCSS architecture with 4 partials |
| Environments | Both empty objects `{}` | `apiUrl` configured for dev and prod |
| Page title | "Frontend" | "Event Hub" |
| Background | White/default | `#060714` with gradient overlays |

### Architecture Patterns & Constraints (14 Enforcement Rules)

**MUST FOLLOW — relevant to this story:**
- **Rule #5:** Use NgRx actions for all state mutations — never modify store directly
- **Rule #9:** Use `provideStore()` / `provideEffects()` / `provideHttpClient(withInterceptors([...]))` — **NEVER** legacy `StoreModule.forRoot()` or `HTTP_INTERCEPTORS` provider
- **Rule #11:** Use `environment.ts` / `environment.prod.ts` for API URL configuration — never hardcode URLs
- **Rule #12:** Place SCSS tokens in `src/styles/_variables.scss` — never inline magic color values
- **Rule #1:** Follow file naming conventions exactly — kebab-case for Angular

### Angular Material M3 Theming (CRITICAL)

Angular Material 19 uses **Material 3 (M3)** theming by default. The old `mat-dark-theme()` and `mat-light-theme()` from M2 are **deprecated**. Use the new API:

```scss
@use '@angular/material' as mat;

// Define a violet-primary dark theme
html {
  @include mat.theme((
    color: (
      primary: mat.$violet-palette,
      tertiary: mat.$blue-palette,
      theme-type: dark,
    ),
    typography: Inter,
    density: 0,
  ));
}
```

**Palette generation:** If `mat.$violet-palette` doesn't exist, generate a custom palette:
```bash
cd src/frontend
ng generate @angular/material:theme-color
```
Enter `#7c3aed` as the primary color. This generates a palette file that can be imported.

**Alternative manual approach:** Override CSS custom properties directly:
```scss
html {
  @include mat.theme((
    color: (
      theme-type: dark,
    ),
    typography: Inter,
    density: 0,
  ));

  // Override M3 system tokens to match Glass design
  --mat-sys-primary: #7c3aed;
  --mat-sys-on-primary: #ffffff;
  --mat-sys-surface: #111111;
  --mat-sys-on-surface: #ededed;
  --mat-sys-background: #060714;
  --mat-sys-on-background: #ededed;
  --mat-sys-surface-container: #111111;
  --mat-sys-surface-container-low: #0a0a0a;
  --mat-sys-surface-container-high: #1a1a1a;
  --mat-sys-outline: #1f1f1f;
  --mat-sys-error: #ef4444;
}
```

**IMPORTANT:** The prebuilt theme `@angular/material/prebuilt-themes/azure-blue.css` MUST be removed from `angular.json` before adding the custom theme, or the prebuilt styles will conflict.

### NgRx v19 for Angular 19

- **Install:** `npm install @ngrx/store@19 @ngrx/effects@19 @ngrx/store-devtools@19`
- NgRx follows Angular version numbers (NgRx 19 for Angular 19)
- Latest NgRx overall is v21, but v19 is correct for Angular 19.2.0 compatibility
- Use standalone APIs: `provideStore()`, `provideEffects()`, `provideStoreDevtools()`
- **DO NOT** use `StoreModule.forRoot()` — that's the old NgModule approach

### Glass Design Direction (from UX Spec)

The project uses **Glassmorphism** (design direction "Glass"):
- Panel surfaces: `background: rgba(255,255,255,0.04); backdrop-filter: blur(24px)`
- Panel borders: `border: 1px solid rgba(255,255,255,0.08)`
- Border radius: `16px` on panels, `20px` on chips (pill shape)
- Page background: `#060714` + 2 radial gradient overlays (violet + navy)
- Submit button: Gradient `#7c3aed → #5b21b6` + glow `box-shadow`
- **Safari compatibility:** Always include `-webkit-backdrop-filter` alongside `backdrop-filter`

### Color Tokens (Complete from UX Spec)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#060714` | Page background |
| `--bg-surface` | `#111111` | Card, form, table surface |
| `--bg-elevated` | `#1a1a1a` | Hover states, dropdown backgrounds |
| `--border` | `#1f1f1f` | Dividers, input borders |
| `--border-focus` | `#7c3aed` | Focused input outline |
| `--text-primary` | `#ededed` | Headings, body text |
| `--text-secondary` | `#a1a1a1` | Placeholder, helper text |
| `--text-disabled` | `#4a4a4a` | Disabled text |
| `--accent` | `#7c3aed` | Buttons, links, focus rings |
| `--accent-hover` | `#6d28d9` | Button hover |
| `--success` | `#22c55e` | Success states |
| `--warning` | `#f59e0b` | Warning states |
| `--error` | `#ef4444` | Error states |

### Typography (from UX Spec)

| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| UI / Body | Inter | 400, 500, 600 | system-ui, sans-serif |
| Technical data | JetBrains Mono | 400 | 'Courier New', monospace |

Google Fonts CDN URL:
```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap
```

### Previous Story Learnings (from 1.5)

- Stories 1.1–1.4 established the full .NET backend; this story is the first Angular-specific work beyond the initial scaffold
- `AddApplication()` is a placeholder with no registrations yet — frontend doesn't interact with backend in this story
- The Angular project currently works (`ng build` succeeds, `ng serve` starts) — do NOT break existing build
- `environment.development.ts` is the dev environment file in this project (Angular 19 default), NOT `environment.ts` which is for production. Check `angular.json` `fileReplacements` to confirm which is which.

### Git Intelligence (Recent Work Patterns)

Recent commits:
```
62b84f2 feat: 1-4-api-scaffold-and-configuration - API Scaffold & Configuration
755574b feat: 1-3-infrastructure-layer-and-database-setup - Infrastructure Layer & Database Setup
a881f9e Feature/1 2 domain model and application layer (#1)
d7fac6a feat: solution scaffold and project initialization (Story 1-1)
```

All previous work was on the .NET backend. This is the **first frontend-focused story**. No existing Angular patterns to follow from previous stories — establish patterns that all future stories (2.3, 2.4, 2.5, 3.2–3.6, 4.2–4.5, 5.1–5.2) will build upon.

### Project Structure Notes

**Files to CREATE:**
```
src/frontend/src/
  styles/
    _variables.scss                    ← NEW
    _glass.scss                        ← NEW
    _typography.scss                   ← NEW
    _material-overrides.scss           ← NEW
  app/
    shared/
      components/
        glass-panel/
          glass-panel.component.ts     ← NEW
          glass-panel.component.scss   ← NEW
          glass-panel.component.spec.ts ← NEW
    store/
      index.ts                         ← NEW
      events/
        events.reducer.ts              ← NEW
      submission/
        submission.reducer.ts          ← NEW
      signalr/
        signalr.reducer.ts            ← NEW
```

**Files to MODIFY:**
```
src/frontend/
  angular.json                         ← MODIFY (remove prebuilt theme)
  package.json                         ← MODIFY (npm install adds NgRx deps)
  src/
    index.html                         ← MODIFY (fonts, title)
    styles.scss                        ← MODIFY (import partials, body styles)
    app/
      app.component.ts                 ← MODIFY (imports, title)
      app.component.html               ← MODIFY (shell template)
      app.component.scss               ← MODIFY (shell styles)
      app.component.spec.ts            ← MODIFY (update tests)
      app.config.ts                    ← MODIFY (add providers)
    environments/
      environment.ts                   ← MODIFY (add apiUrl)
      environment.development.ts       ← MODIFY (add apiUrl)
```

**Files NOT to modify:**
```
src/EventHub.Domain/                   ← No changes
src/EventHub.Application/             ← No changes
src/EventHub.Infrastructure/          ← No changes
src/EventHub.Api/                     ← No changes
src/EventHub.Function/                ← No changes
```

**Alignment with architecture doc:** Fully aligned with the Angular project structure defined in `architecture.md § Structure Patterns`. The `styles/`, `shared/components/`, and `store/` directories match the specified structure exactly.

**Detected conflicts or variances:**
- Architecture doc specifies `environment.ts` (dev) + `environment.prod.ts` (prod). Current scaffold has `environment.ts` (prod) + `environment.development.ts` (dev) — Angular 19 default. Dev agent must check `angular.json` `fileReplacements` and align accordingly. Both approaches work; what matters is the `apiUrl` value for each build configuration.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — NgRx Store structure, standalone components, state management
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Angular naming conventions, 14 enforcement rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Angular project directory structure (styles/, store/, shared/, features/, core/)
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Angular 19 LTS, Angular CLI initialization commands
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision] — Glass direction: glassmorphism panels, gradient background, rounded corners
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — Complete color token table, semantic palette
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System] — Inter + JetBrains Mono, type scale tokens
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — GlassPanelComponent spec: ng-content, variants (default/compact)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility] — Glassmorphism cross-browser CSS, -webkit-backdrop-filter
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6] — Acceptance criteria, user story
- [Source: _bmad-output/implementation-artifacts/1-5-azure-function-scaffold.md] — Previous story learnings, overall project state

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List