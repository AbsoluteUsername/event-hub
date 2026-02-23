# Story 1.1: Solution Scaffold & Project Initialization

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want to initialize a monorepo with all project scaffolds (Angular SPA, .NET Clean Architecture solution, Azure Function),
so that I have a buildable, runnable foundation for all subsequent development.

## Acceptance Criteria

1. **Given** a fresh clone of the repository **When** the developer runs the initialization commands from Architecture Doc **Then** the following projects exist and compile successfully:
   - `src/EventHub.Domain/` (.NET 8 class library, zero dependencies)
   - `src/EventHub.Application/` (.NET 8 class library, references Domain)
   - `src/EventHub.Infrastructure/` (.NET 8 class library, references Application)
   - `src/EventHub.Api/` (ASP.NET Core 8 Web API, references Application + Infrastructure)
   - `src/EventHub.Function/` (Azure Function .NET 8 isolated, references Application + Infrastructure)
   - `tests/EventHub.Api.Tests/` (xUnit, references Api)
   - `tests/EventHub.Function.Tests/` (xUnit, references Function)
   - `src/frontend/` (Angular 19 CLI workspace with SCSS, Angular Material, ESLint)

2. **Given** the solution file **When** `EventHub.sln` is inspected **Then** it includes all projects with correct references following Clean Architecture dependency rule

3. **Given** all .NET projects are present **When** `dotnet build` is executed from the solution root **Then** the build succeeds with zero errors

4. **Given** the Angular workspace is present **When** `ng build` is executed in `src/frontend/` **Then** the build succeeds with zero errors

5. **Given** the repository root **When** the developer inspects the root directory **Then** `.editorconfig` and `.gitignore` are present with appropriate configurations

## Tasks / Subtasks

- [x] Task 1: Create monorepo folder structure (AC: #1, #2)
  - [x] 1.1: Create `src/` directory with subdirectories for all 6 .NET projects
  - [x] 1.2: Create `tests/` directory with test project subdirectories
  - [x] 1.3: Create root `.editorconfig` with consistent formatting rules (tabs/spaces, line endings, charset) for both .NET and Angular
  - [x] 1.4: Create root `.gitignore` covering .NET (`bin/`, `obj/`), Angular (`node_modules/`, `dist/`), IDE files, and secrets

- [x] Task 2: Initialize .NET Clean Architecture solution (AC: #1, #2, #3)
  - [x] 2.1: Create `EventHub.sln` at repository root
  - [x] 2.2: Create `EventHub.Domain` class library (.NET 8, zero dependencies) in `src/EventHub.Domain/`
  - [x] 2.3: Create `EventHub.Application` class library (.NET 8) in `src/EventHub.Application/`
  - [x] 2.4: Create `EventHub.Infrastructure` class library (.NET 8) in `src/EventHub.Infrastructure/`
  - [x] 2.5: Create `EventHub.Api` Web API (.NET 8) in `src/EventHub.Api/`
  - [x] 2.6: Create `EventHub.Function` Azure Function (.NET 8 isolated worker) in `src/EventHub.Function/`
  - [x] 2.7: Create `EventHub.Api.Tests` xUnit project in `tests/EventHub.Api.Tests/`
  - [x] 2.8: Create `EventHub.Function.Tests` xUnit project in `tests/EventHub.Function.Tests/`
  - [x] 2.9: Add all projects to `EventHub.sln`
  - [x] 2.10: Add project references enforcing Clean Architecture dependency rule:
    - Application → Domain
    - Infrastructure → Application
    - Api → Application + Infrastructure
    - Function → Application + Infrastructure
    - Api.Tests → Api
    - Function.Tests → Function
  - [x] 2.11: Verify `dotnet build` succeeds with zero errors

- [x] Task 3: Initialize Angular 19 SPA (AC: #1, #4)
  - [x] 3.1: Run `npx @angular/cli@19 new` in `src/frontend/` with SCSS, no routing, skip-git
  - [x] 3.2: Add Angular Material (`ng add @angular/material`) — v19.2.19 installed
  - [x] 3.3: Add Angular ESLint (`ng add @angular-eslint/schematics`) — v21.0.1 installed
  - [x] 3.4: Generate environments (`ng generate environments`)
  - [x] 3.5: Verify `ng build` succeeds with zero errors

- [x] Task 4: Verify complete solution integrity (AC: #1-#5)
  - [x] 4.1: Run `dotnet build` from solution root — zero errors ✓
  - [x] 4.2: Run `ng build` from `src/frontend/` — zero errors ✓
  - [x] 4.3: Verify `.editorconfig` and `.gitignore` are present at root ✓
  - [x] 4.4: Verify all project references match Clean Architecture dependency rule ✓

## Dev Notes

### Architecture Patterns & Constraints

- **Clean Architecture Dependency Rule (CRITICAL):** Inner layers NEVER reference outer layers:
  ```
  Domain (zero deps) ← Application (→ Domain) ← Infrastructure (→ Application) ← Api/Function (→ Application + Infrastructure)
  ```
- **Monorepo Structure (ADR-4):** Single repository with `/src/frontend/`, `/src/EventHub.*/`, `/tests/` — one git clone, one README
- **Strict Layer Separation (NFR-M1):** API layer has no direct database access; Function layer has no HTTP handling code
- **.NET 8 LTS** (SDK 8.0.418, Runtime 8.0.14) — Long-Term Support until November 2026
- **Angular 19 LTS** (CLI 19.2.20) — LTS until May 2026; standalone components are default since v19
- **Azure Functions v4** (Core Tools 4.7.0) — .NET 8 isolated worker model (recommended by Microsoft)

### Critical Technology Versions

| Technology | Version | Package/Command |
|---|---|---|
| .NET SDK | 8.0.418 (runtime 8.0.14) | `dotnet --version` |
| Angular CLI | 19.2.20 | `npx @angular/cli@19` |
| Angular Material | 19.2.16 | `ng add @angular/material@19` |
| Azure Functions Core Tools | 4.7.0 | `npm install -g azure-functions-core-tools@4` |
| Node.js | 22.22.0 LTS | Required for Angular CLI |
| xUnit | Latest compatible with .NET 8 | `dotnet new xunit` |

### Initialization Commands Reference

**These are the exact commands from Architecture Doc — use them in order:**

```bash
# 1. Angular SPA
npx @angular/cli@19 new event-hub-frontend --style=scss --routing=false --skip-git --package-manager=npm
cd event-hub-frontend
ng add @angular/material
ng add @angular-eslint/schematics
ng generate environments
cd ..

# 2. .NET Clean Architecture projects
dotnet new classlib -n EventHub.Domain --framework net8.0
dotnet new classlib -n EventHub.Application --framework net8.0
dotnet new classlib -n EventHub.Infrastructure --framework net8.0
dotnet new webapi -n EventHub.Api --framework net8.0

# 3. Azure Function
func init EventHub.Function --dotnet-isolated --target-framework net8.0
func new --name ProcessEvent --template "ServiceBusTrigger"

# 4. Test projects
dotnet new xunit -n EventHub.Api.Tests --framework net8.0
dotnet new xunit -n EventHub.Function.Tests --framework net8.0

# 5. Solution file + references
dotnet new sln -n EventHub
dotnet sln add src/EventHub.Domain/EventHub.Domain.csproj
dotnet sln add src/EventHub.Application/EventHub.Application.csproj
dotnet sln add src/EventHub.Infrastructure/EventHub.Infrastructure.csproj
dotnet sln add src/EventHub.Api/EventHub.Api.csproj
dotnet sln add src/EventHub.Function/EventHub.Function.csproj
dotnet sln add tests/EventHub.Api.Tests/EventHub.Api.Tests.csproj
dotnet sln add tests/EventHub.Function.Tests/EventHub.Function.Tests.csproj

# 6. Project references (Clean Architecture dependency rule)
dotnet add src/EventHub.Application reference src/EventHub.Domain
dotnet add src/EventHub.Infrastructure reference src/EventHub.Application
dotnet add src/EventHub.Api reference src/EventHub.Application src/EventHub.Infrastructure
dotnet add src/EventHub.Function reference src/EventHub.Application src/EventHub.Infrastructure
dotnet add tests/EventHub.Api.Tests reference src/EventHub.Api
dotnet add tests/EventHub.Function.Tests reference src/EventHub.Function
```

**IMPORTANT:** Projects must be created inside the correct directories (`src/` and `tests/`) OR moved after creation. The `dotnet new` commands create projects in the current directory — plan your working directory accordingly.

### Angular 19 Specific Notes

- **Standalone components are default** — no `standalone: true` needed (it's implicit in Angular 19)
- **Angular Material 19** uses Material 3 theming by default with token-based CSS custom properties (`--mat-sys-*`)
- **NgRx 19** must be used (NgRx versions align 1:1 with Angular major versions — do NOT use NgRx 18.x)
- Angular CLI 19 generates environments via `ng generate environments` command

### Azure Function Specific Notes

- **Isolated worker model** is required (.NET 8 isolated, NOT in-process)
- `.csproj` must contain: `<TargetFramework>net8.0</TargetFramework>`, `<AzureFunctionsVersion>v4</AzureFunctionsVersion>`, `<OutputType>Exe</OutputType>`
- `local.settings.json` must contain: `"FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated"`
- Required packages: `Microsoft.Azure.Functions.Worker`, `Microsoft.Azure.Functions.Worker.Sdk`

### Target Directory Structure

```
event-hub/
├── README.md
├── .editorconfig
├── .gitignore
├── EventHub.sln
├── src/
│   ├── EventHub.Domain/
│   │   └── EventHub.Domain.csproj
│   ├── EventHub.Application/
│   │   └── EventHub.Application.csproj
│   ├── EventHub.Infrastructure/
│   │   └── EventHub.Infrastructure.csproj
│   ├── EventHub.Api/
│   │   └── EventHub.Api.csproj
│   ├── EventHub.Function/
│   │   └── EventHub.Function.csproj
│   └── frontend/
│       ├── angular.json
│       ├── package.json
│       └── tsconfig.json
├── tests/
│   ├── EventHub.Api.Tests/
│   │   └── EventHub.Api.Tests.csproj
│   └── EventHub.Function.Tests/
│       └── EventHub.Function.Tests.csproj
├── _bmad-output/
└── docs/
```

### Enforcement Rules Applicable to This Story

1. Follow file naming conventions exactly — kebab-case for Angular, PascalCase for C#
2. Use `.editorconfig` for consistent formatting rules across .NET and Angular
3. Follow Clean Architecture dependency rule — inner layers NEVER reference outer layers (Enforcement Rule #13)
4. Place interface definitions in `EventHub.Application/Interfaces/` — implementations in `EventHub.Infrastructure/` (Enforcement Rule #14)

### Potential Pitfalls & Warnings

- **Do NOT use `func init --dotnet`** — this creates in-process model. Use `--dotnet-isolated` explicitly
- **Angular CLI project name:** Architecture doc uses `event-hub-frontend` but the project should reside in `src/frontend/` — rename or use `--directory` flag as appropriate
- **Angular Material 19 theming:** The `mat.define-dark-theme()` API changed from v18. Do NOT use legacy theming mixins. Use M3 `mat.define-theme()` with custom tokens
- **.NET webapi template:** Default template in .NET 8 uses minimal APIs. The architecture specifies **controller-based** API — ensure `--use-controllers` flag or manually add controller support
- **Solution file location:** `EventHub.sln` must be at repository root, not inside `src/`

### Project Structure Notes

- Alignment with unified project structure: All paths and module names follow the Architecture Doc exactly
- No conflicts or variances detected — this is the first story establishing the foundation

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Initialization Commands]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code Organization (Monorepo — ADR-4 + Clean Architecture)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1: Solution Scaffold & Project Initialization]
- [Source: _bmad-output/planning-artifacts/prd.md#FR25: Developer can set up and run the full application locally]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Azure Functions Core Tools (`func` CLI) not available on system — Function project files created manually
- Node.js v20.10.0 EBADENGINE warnings (Angular 19 wants ^20.11.1) — non-blocking, all builds succeed
- Angular Material v19.2.19 installed (architecture doc listed v19.2.16 — used latest available)
- Angular ESLint v21.0.1 installed (latest compatible with Angular 19)

### Completion Notes List

- All 4 tasks completed successfully, all 5 acceptance criteria met
- `dotnet build` — 0 errors, 0 warnings across all 7 .NET projects
- `dotnet test` — 2 tests passed (1 per test project), 0 failed
- `ng build` — success, production build output generated
- Clean Architecture dependency rule verified: Domain(0 deps) ← Application(→Domain) ← Infrastructure(→Application) ← Api/Function(→Application+Infrastructure)
- Azure Function project manually scaffolded (isolated worker model, .NET 8, v4) since `func` CLI was unavailable — builds and tests pass identically
- Web API created with `--use-controllers` flag per architecture requirement

### File List

- `.editorconfig` — Root editor configuration (C#/Angular/YAML/Markdown rules)
- `.gitignore` — Root gitignore (.NET, Angular, IDE, OS, secrets)
- `EventHub.sln` — Solution file with all 7 projects
- `src/EventHub.Domain/EventHub.Domain.csproj` — Domain class library (zero deps)
- `src/EventHub.Domain/Class1.cs` — Template placeholder
- `src/EventHub.Application/EventHub.Application.csproj` — Application class library (→Domain)
- `src/EventHub.Application/Class1.cs` — Template placeholder
- `src/EventHub.Infrastructure/EventHub.Infrastructure.csproj` — Infrastructure class library (→Application)
- `src/EventHub.Infrastructure/Class1.cs` — Template placeholder
- `src/EventHub.Api/EventHub.Api.csproj` — ASP.NET Core 8 Web API (→Application+Infrastructure)
- `src/EventHub.Api/Program.cs` — Web API entry point
- `src/EventHub.Api/Controllers/WeatherForecastController.cs` — Template controller
- `src/EventHub.Api/WeatherForecast.cs` — Template model
- `src/EventHub.Api/appsettings.json` — API configuration
- `src/EventHub.Api/appsettings.Development.json` — API dev configuration
- `src/EventHub.Api/Properties/launchSettings.json` — Launch profiles
- `src/EventHub.Function/EventHub.Function.csproj` — Azure Function isolated worker (→Application+Infrastructure)
- `src/EventHub.Function/Program.cs` — Function host builder
- `src/EventHub.Function/host.json` — Function host configuration
- `src/EventHub.Function/local.settings.json` — Function local settings (dotnet-isolated)
- `tests/EventHub.Api.Tests/EventHub.Api.Tests.csproj` — API test project (xUnit, →Api)
- `tests/EventHub.Api.Tests/UnitTest1.cs` — Template test
- `tests/EventHub.Function.Tests/EventHub.Function.Tests.csproj` — Function test project (xUnit, →Function)
- `tests/EventHub.Function.Tests/UnitTest1.cs` — Template test
- `src/frontend/angular.json` — Angular workspace configuration
- `src/frontend/package.json` — Angular dependencies (Material, ESLint)
- `src/frontend/tsconfig.json` — TypeScript configuration
- `src/frontend/tsconfig.app.json` — App TypeScript configuration
- `src/frontend/tsconfig.spec.json` — Test TypeScript configuration
- `src/frontend/src/main.ts` — Angular entry point
- `src/frontend/src/app/app.component.ts` — Root component
- `src/frontend/src/app/app.component.html` — Root component template
- `src/frontend/src/app/app.component.scss` — Root component styles
- `src/frontend/src/app/app.component.spec.ts` — Root component test
- `src/frontend/src/app/app.config.ts` — App configuration
- `src/frontend/src/environments/environment.ts` — Production environment
- `src/frontend/src/environments/environment.development.ts` — Development environment
- `src/frontend/src/index.html` — SPA entry HTML
- `src/frontend/src/styles.scss` — Global styles (Material theme)
- `src/frontend/eslint.config.js` — ESLint configuration
