---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/project-brief.md"
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/prd-validation-report.md"
workflowType: 'architecture'
lastStep: 8
status: 'complete'
project_name: 'event-hub'
user_name: 'Ssmol'
date: '2026-02-23'
completedAt: '2026-02-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

32 FRs across 7 categories:

| Category | FRs | Architectural Implication |
|----------|-----|--------------------------|
| Event Submission | FR1–FR5 | Form → API endpoint → message broker publish |
| Event Discovery | FR6–FR12, FR31–FR32 | Query endpoint with server-side filtering, pagination, sorting |
| Real-Time Updates | FR13–FR14 | WebSocket broadcasting new events to all connected clients |
| API & Integration | FR15–FR20 | REST API with Swagger, async message processing, DB persistence |
| Data Validation | FR21–FR24 | Dual validation (client + server), structured error responses |
| Developer Experience | FR25–FR28 | README, BMAD artifacts, ADR files |
| Responsive UI | FR29–FR30 | Responsive layout (3 breakpoints), keyboard navigation |

**Non-Functional Requirements:**

14 NFRs driving architectural decisions:

| Category | Key NFRs | Architectural Impact |
|----------|----------|---------------------|
| Performance | P1–P5 | API < 500ms, SignalR < 1s post-write, E2E < 3s, loading indicator < 200ms |
| Security | S1–S3 | HTTPS only, environment-aware CORS, secrets in config (not code) |
| Integration Reliability | I1–I3 | At-least-once delivery, idempotent processing (Id as unique key), auto-reconnect with exponential backoff |
| Maintainability | M1–M3 | Strict layer separation (no cross-layer code), externalized config, linter/analyzer zero-error policy |

**UX Architectural Requirements (from UX Spec):**

- Angular Material with custom dark Glass theme (glassmorphism: `backdrop-filter: blur(24px)`)
- Custom flying chip animation via programmatic `ComponentRef` + Web Animations API
- SignalR connection status indicator with 3 states (connected/reconnecting/disconnected)
- Reactive filters with `debounceTime(300ms)` + `switchMap` for server-side queries
- Server-side pagination with `mat-paginator` (default 20 items/page)
- Responsive: Desktop ≥1024px (side-by-side), Tablet 768–1023px (compressed), Mobile <768px (stacked)
- WCAG 2.1 AA compliance, `prefers-reduced-motion` support
- Inter + JetBrains Mono typography

**Scale & Complexity:**

- Primary domain: Full-stack cloud-native web application
- Complexity level: Low (greenfield, single developer, demo scale)
- Estimated architectural components: 6 (Angular SPA, .NET Web API, Azure Service Bus, Azure Function, Azure SQL, Azure SignalR Service)

### Technical Constraints & Dependencies

- **No authentication** — UserId is free-text, no identity verification
- **Source code only** — no live Azure deployment required
- **Demo scale** — single-user demonstration, no load testing or HA
- **Events immutable** — no edit/delete operations
- **At-least-once delivery** — Service Bus guarantees; idempotency via unique Id constraint
- **Time constraint** — up to 8 hours total development

### Cross-Cutting Concerns Identified

| Concern | Affected Components | Strategy |
|---------|-------------------|----------|
| Error Handling | API, Azure Function, Angular | Dual-layer: client validation (UX) + server validation (data integrity); structured JSON errors |
| Structured Logging | API, Azure Function | Console-compatible, Application Insights-ready |
| CORS | API | Environment-aware: permissive localhost (dev), restricted origin (prod) |
| Real-Time Communication | Azure Function, Azure SignalR Service, Angular | Serverless SignalR: Function → output binding → SignalR Service → clients |
| Async Messaging | API → Service Bus → Function | Fire-and-forget publish; at-least-once consumption; idempotent writes |
| Configuration | All components | Externalized via environment variables / platform config service |

### Key Architecture Decisions (ADR Summary)

_Full trade-off analysis preserved for README documentation (per tech task requirements)._

#### ADR-1: Database — Azure SQL

**Alternatives considered:** Azure Cosmos DB (NoSQL)

**Decision:** Azure SQL

**Trade-offs:**

| Criterion | Azure SQL | Cosmos DB |
|----------|-----------|-----------|
| Filtering (FR7–FR11) | Native SQL WHERE clauses | Composite queries, OFFSET = scan |
| Sorting (FR32) | ORDER BY + index | Requires composite index per sort field |
| Idempotency (NFR-I2) | UNIQUE constraint — one line DDL | Partition key + Id, native upsert |
| EF Core support | Full, mature | Limited, requires Cosmos SDK for complex queries |
| Implementation time | ~30 min setup | ~1 hr setup + query tuning |

**Rationale:** Structured data model (5 fields, fixed enum), strong filtering/sorting/pagination requirements (FR7–FR12, FR31–FR32), and EF Core maturity make Azure SQL the natural fit. Cosmos DB adds complexity without benefit at demo scale.

#### ADR-2: Messaging — Service Bus Queue

**Alternatives considered:** Service Bus Topic + Subscription

**Decision:** Queue

**Trade-offs:**

| Criterion | Queue | Topic + Subscription |
|----------|-------|---------------------|
| Consumer count | 1 (Azure Function) | 1 (but extensible to fan-out) |
| Configuration complexity | Minimal | +Subscription provisioning |
| At-least-once (NFR-I1) | ✅ | ✅ |
| Post-MVP extensibility | Migration to Topic is straightforward | Ready for multiple consumers |

**Rationale:** Single consumer (Azure Function) for MVP. Queue provides identical delivery guarantees with less configuration. Migration to Topic in Growth Phase if additional consumers appear (analytics, notifications).

#### ADR-3: Real-Time — Azure SignalR Service (Serverless)

**Alternatives considered:**

- (A) Function → HTTP callback → API-hosted SignalR Hub
- (B) Function → second Service Bus message → API listener → Hub broadcast

**Decision:** Azure SignalR Service with serverless output binding from Azure Function

**Trade-offs:**

| Criterion | A: API-hosted Hub | C: Azure SignalR Service (chosen) |
|----------|-------------------|-----------------------------------|
| API responsibility | Hosts Hub + IHubContext | No SignalR Hub code — only negotiate endpoint |
| Function code | DB write + HttpClient.PostAsync(apiUrl) | DB write + return SignalRMessageAction (1 line) |
| Azure resources | None additional | +Azure SignalR Service (Free: 20 connections, 20K msg/day) |
| Latency | Function → HTTP hop → API → clients | Function → SignalR Service → clients (direct) |
| Local development | Standard SignalR, no external deps | Requires real Azure SignalR Service or emulator |
| Coupling | Function must know API URL | Function decoupled from API |

**Rationale:** Cleaner separation of concerns — API handles HTTP only, Function handles processing + real-time notification. Output binding reduces Function code to one return statement. Free tier (20 concurrent connections, 20K messages/day) is more than sufficient for demo. Trade-off: +1 Azure resource to provision and +1 connection string, but the architectural clarity and reduced API surface outweigh this. Negotiate endpoint lives in API for single CORS origin simplicity.

#### ADR-4: Project Structure — Monorepo

**Decision:** Single repository with folder-based separation

```
/src/frontend/     — Angular SPA
/src/api/          — .NET Web API
/src/function/     — Azure Function
```

**Rationale:** Solo developer, single `git clone`, one README. Reviewer can trace the full architecture from one repository. Separate repos add overhead without value at this scale.

#### ADR-5: State Management — Services + Signals/RxJS

**Alternatives considered:** NgRx, NGXS, Akita

**Decision:** Component-level state via Angular services with Signals and RxJS

**Rationale:** Single-screen application with one form and one table. NgRx introduces ~200 lines of boilerplate (actions, reducers, selectors, effects) for a state that fits in one `BehaviorSubject` or `Signal`. PRD explicitly notes: "Component-level state (no NgRx — scale does not require it)."

#### ADR-6: Pagination Strategy — Server-Side

**Alternatives considered:** Client-side (MatTableDataSource), Hybrid (lazy threshold)

**Decision:** Server-side filtering, sorting, and pagination

**API contract:**

```
GET /api/events?type=Click&userId=test&description=checkout&from=2026-01-01&to=2026-12-31&page=1&pageSize=20&sortBy=createdAt&sortDir=desc

Response: { items: Event[], totalCount: number, page: number, pageSize: number }
```

**Trade-offs:**

| Criterion | Server-side (chosen) | Client-side |
|----------|---------------------|-------------|
| Best practice | ✅ Correct approach | ⚠️ Only works for small datasets |
| Reviewer impression | ✅ "Understands data access patterns" | ⚠️ "Shortcuts for demo" |
| Filter response | ~50-100ms (SQL indexed) + network | Instant (local) |
| Scalability | ✅ Ready for any scale | ❌ Breaks at 10K+ |
| Code complexity | +~15 lines EF Core IQueryable | Less backend code |

**Rationale:** Demonstrates proper data access patterns for the technical reviewer. EF Core `IQueryable` with `.Where().OrderBy().Skip().Take()` translates directly to SQL — approximately 15 lines of code. Angular uses `debounceTime(300ms)` + `switchMap` to make reactive filters feel responsive despite HTTP round-trips.

### SignalR + Pagination + Animation Strategy

**Flying chip animation (always fires on submit):**

The flying chip is submit feedback — it always plays regardless of current page or filters.

```
Submit → chip materializes → arc flight →
  → SignalR notification received →
    → chip lands with bounce → dissolves
```

**Row behavior (depends on client context):**

| Client State | Chip Animation | Row | Additional Feedback |
|-------------|---------------|-----|---------------------|
| Page 1, event matches filters | ✅ Full | ✅ Unfold + highlight | — |
| Page 1, event hidden by filters | ✅ Full | ❌ No row | Toast: "Hidden by filters" |
| Page 2+, any filters | ✅ Full | ❌ No row | Toast: "New event added" + "Go to page 1" |

**Chip landing behavior:**

- If row appears: chip lands at new row position → bounce → dissolve → row unfolds
- If row does not appear: chip reaches table header area → bounce → dissolve (no row unfold). Chip completes "delivery" animation, but without "landing into a row"

## Starter Template Evaluation

### Primary Technology Domain

Full-stack cloud-native web application based on project requirements analysis. Three distinct deployment units: Angular SPA (frontend), ASP.NET Core Web API (backend), Azure Function (event processor).

### Technology Versions (verified February 2026)

| Technology | Version | Rationale |
|-----------|---------|-----------|
| Angular CLI | 19.x (LTS) | LTS until May 2026; stable Angular Material integration; Zone.js included; maximum community resources |
| .NET SDK | 8.0 (LTS) | Long-Term Support until November 2026; most documented, battle-tested; industry standard for production workloads |
| Azure Functions Runtime | v4 | Current supported runtime; .NET 8 isolated worker model recommended by Microsoft |
| Node.js | 22.x LTS | Required for Angular CLI |

### Starter Options Selected

#### 1. Angular CLI (`ng new`) — Frontend

| Aspect | Details |
|--------|---------|
| Maintainer | Google (Angular team) |
| What it provides | TypeScript strict mode, SCSS pipeline, Karma+Jasmine testing, dev server with hot reload, production build with tree-shaking |
| What needs adding | Angular Material, ESLint, custom Glass theme, SignalR client |

#### 2. ASP.NET Core Web API (`dotnet new webapi`) — API

| Aspect | Details |
|--------|---------|
| Maintainer | Microsoft (.NET team) |
| What it provides | Program.cs with middleware pipeline, Swagger/OpenAPI (Swashbuckle), appsettings.json, DI container, HTTPS dev cert |
| What needs adding | EF Core + Azure SQL provider, Service Bus SDK, SignalR negotiate endpoint, CORS configuration |

#### 3. Azure Functions Core Tools (`func init`) — Function

| Aspect | Details |
|--------|---------|
| Maintainer | Microsoft (Azure Functions team) |
| What it provides | Isolated worker model setup, host.json + local.settings.json, Functions SDK references |
| What needs adding | Service Bus trigger, EF Core for DB write, Azure SignalR output binding, idempotency logic |

### Initialization Commands

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

### Code Organization (Monorepo — ADR-4 + Clean Architecture)

```
event-hub/
├── src/
│   ├── EventHub.Domain/       ← Entities, Enums (zero deps)
│   ├── EventHub.Application/  ← DTOs, Interfaces, Messages (→ Domain)
│   ├── EventHub.Infrastructure/ ← EF Core, Service Bus, Repos (→ Application)
│   ├── EventHub.Api/          ← ASP.NET Core 8.0 Web API (→ App + Infra)
│   ├── EventHub.Function/     ← Azure Function .NET 8 isolated (→ App + Infra)
│   └── frontend/              ← Angular 19 CLI workspace
├── tests/
│   ├── EventHub.Api.Tests/
│   └── EventHub.Function.Tests/
├── _bmad-output/              ← BMAD artifacts
├── docs/
├── .editorconfig
├── README.md
└── EventHub.sln
```

### Development Experience

- Frontend: `ng serve` with hot reload on localhost:4200
- API: `dotnet watch run` with hot reload on localhost:5000
- Function: `func start` on localhost:7071
- All three run concurrently during development

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- API style, validation strategy, data access, component architecture, state management — all decided below

**Important Decisions (Shape Architecture):**
- Logging framework, shared project structure

**Deferred Decisions (Post-MVP):**
- CI/CD pipeline (GitHub Actions) — Growth Phase
- Infrastructure as Code (Bicep/Terraform) — Growth Phase
- API versioning — not needed for single-version demo

### Data Architecture

**Validation: DataAnnotations**

| Decision | Details |
|----------|---------|
| Choice | DataAnnotations attributes on model classes |
| Rationale | 3 fields (UserId, Type, Description) with simple rules (Required, MaxLength). Built-in, zero extra packages. Produces `ModelState` errors that map directly to PRD's `{"errors": {"field": "message"}}` format (FR23) |
| Affects | API models, error response middleware |

```csharp
public class CreateEventRequest
{
    [Required]
    [MaxLength(100)]
    public string UserId { get; set; }

    [Required]
    [EnumDataType(typeof(EventType))]
    public EventType Type { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; }
}
```

**Data Access: EF Core Code-First with Migrations**

| Decision | Details |
|----------|---------|
| Choice | EF Core 8 Code-First with Migrations |
| Rationale | Standard greenfield approach; C# models are single source of truth; `dotnet ef migrations add` auto-generates SQL; IQueryable enables server-side filtering (ADR-6) |
| Packages | `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Tools` |
| Affects | API, Function (shared DbContext via Shared project) |

**Project Layering: Clean Architecture (supersedes original Shared project)**

| Decision | Details |
|----------|---------|
| Choice | Clean Architecture with Domain / Application / Infrastructure layers |
| Rationale | Demonstrates enterprise-level architectural skills for reviewer. Clear dependency rule: inner layers never reference outer layers. Domain contains pure entities, Application defines interfaces + DTOs, Infrastructure implements data access + messaging. Both API and Function reference Application + Infrastructure |
| Affects | Solution structure — 3 projects become 6 (Domain, Application, Infrastructure, Api, Function + test projects) |

```
EventHub.sln
├── EventHub.Domain          ← Entities, Enums (zero dependencies)
├── EventHub.Application     ← DTOs, Interfaces, Messages (→ Domain)
├── EventHub.Infrastructure  ← EF Core, Service Bus, Repos (→ Application)
├── EventHub.Api             → references Application + Infrastructure
└── EventHub.Function        → references Application + Infrastructure
```

### Authentication & Security

**No Authentication (PRD constraint)**

| Decision | Details |
|----------|---------|
| CORS | Environment-aware via `appsettings.{env}.json`: permissive `localhost:4200` in Development, restricted origin in Production (NFR-S2) |
| Secrets | Connection strings in `appsettings.json` (dev) / Azure App Settings or environment variables (prod) (NFR-S3). Never committed to source |
| HTTPS | Enforced (NFR-S1); `app.UseHttpsRedirection()` in pipeline |

### API & Communication Patterns

**API Style: Controllers**

| Decision | Details |
|----------|---------|
| Choice | Controller-based API with `[ApiController]` attribute |
| Rationale | Familiar pattern for senior .NET reviewer (Journey 3); automatic model validation; conventional routing; Swagger integration out of the box |
| Affects | API project structure |

```csharp
[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<EventResponse>> Create(CreateEventRequest request) { ... }

    [HttpGet]
    public async Task<ActionResult<PagedResult<EventResponse>>> GetAll([FromQuery] EventFilter filter) { ... }
}
```

**Error Response Standard:**

All errors follow FR23 format:
```json
{
  "errors": {
    "userId": "The UserId field is required.",
    "type": "The field Type is invalid."
  }
}
```
`[ApiController]` handles this automatically for validation errors (400). Custom middleware for 500 errors with structured logging.

**Service Bus Message Format:**

```csharp
public class EventMessage
{
    public Guid Id { get; set; }
    public string UserId { get; set; }
    public EventType Type { get; set; }
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### Frontend Architecture

**Component Architecture: Standalone Components**

| Decision | Details |
|----------|---------|
| Choice | Angular 19 Standalone Components (no NgModules) |
| Rationale | Modern Angular default since v17; less boilerplate; each component declares its own imports; tree-shakeable |
| Affects | All Angular components |

**State Management: NgRx Store (ADR-5 — Updated)**

| Decision | Details |
|----------|---------|
| Previous decision | Services + Signals/RxJS |
| Updated decision | NgRx Store |
| Rationale | (1) Demonstrates enterprise-level Angular state management skills for reviewer — NgRx knowledge signals senior-level frontend capability. (2) State complexity justifies NgRx: server-side pagination + filters + sort + SignalR connection + flying chip animation lifecycle + submit cycle + toast queue — coordinating these through plain services leads to tangled observables |

**NgRx Store Structure:**

```typescript
interface AppState {
  events: {
    items: Event[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    filters: EventFilter;
    pagination: { page: number; pageSize: number };
    sort: { sortBy: string; sortDir: 'asc' | 'desc' };
  };
  submission: {
    status: 'idle' | 'submitting' | 'chip-flying' | 'waiting-signalr' | 'landing' | 'complete';
    pendingEvent: CreateEventRequest | null;
  };
  signalr: {
    connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  };
}
```

**NgRx Effects for Side Effects:**

| Effect | Trigger | Side Effect |
|--------|---------|-------------|
| `loadEvents$` | `[Events] Load`, filter/sort/page change | HTTP GET → success/failure actions |
| `submitEvent$` | `[Events] Submit` | HTTP POST → Service Bus → `SubmitSuccess` |
| `signalrEvent$` | SignalR `newEvent` message | `[SignalR] EventReceived` → re-fetch if page 1 |
| `chipAnimation$` | `SubmitSuccess` | Trigger chip → wait for SignalR → `ChipLanded` |

**Key Angular Services (alongside NgRx):**

| Service | Responsibility |
|---------|---------------|
| `EventService` | HTTP calls to API (POST, GET with filters) — used by Effects |
| `SignalRService` | WebSocket connection to Azure SignalR Service — feeds into Effects |

### Infrastructure & Deployment

**Logging: Serilog + Application Insights**

| Decision | Details |
|----------|---------|
| Choice | Serilog with Console + Application Insights sinks |
| Packages | `Serilog.AspNetCore`, `Serilog.Sinks.ApplicationInsights` (v5.0.0), `Serilog.Sinks.Console` |
| Rationale | Structured JSON logging; consistent across API and Function; Application Insights sink ready for Growth Phase monitoring; console sink for local development |
| Affects | API, Function |

```csharp
builder.Host.UseSerilog((context, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .WriteTo.Console()
    .WriteTo.ApplicationInsights(TelemetryConverter.Traces));
```

**Environment Configuration:**

| Environment | API Config | Function Config |
|-------------|-----------|----------------|
| Development | `appsettings.Development.json` | `local.settings.json` |
| Production | Azure App Settings / env vars | Azure Function App Settings |

### Decision Impact Analysis

**Implementation Sequence:**

1. Solution + Clean Architecture scaffold (Domain entities/enums, Application DTOs/interfaces, Infrastructure DbContext/repos)
2. API scaffold (Controllers, Middleware, Composition root with DI)
3. Azure SQL + EF Core migration
4. Service Bus integration (API publish via IServiceBusPublisher)
5. Azure Function (Service Bus trigger → EventProcessingService → DB write → SignalR output)
6. Angular SPA (NgRx store, form, table, SignalR client, environments)
7. Glass theme + flying chip animation

**Cross-Component Dependencies (Clean Architecture):**

```
EventHub.Domain ← EventHub.Application ← EventHub.Infrastructure ← EventHub.Api
                                                                  ← EventHub.Function

Angular → API (REST + negotiate)
       → Azure SignalR Service (WebSocket)

API → Service Bus (publish via IServiceBusPublisher)
   → Azure SQL (read via IEventRepository)

Function → Service Bus (consume)
        → Azure SQL (write via IEventRepository)
        → Azure SignalR Service (output binding)
```

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (EF Core conventions):**

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | PascalCase, plural | `Events` |
| Column names | PascalCase | `UserId`, `CreatedAt` |
| Primary key | `Id` | `Id` (GUID) |
| Indexes | `IX_{Table}_{Column}` | `IX_Events_CreatedAt` |
| Enum storage | String (not int) | `"PageView"`, `"Click"`, `"Purchase"` |
| EF Config | Separate `IEntityTypeConfiguration<T>` per entity | `EventConfiguration.cs` |

**API (ASP.NET Core defaults):**

| Element | Convention | Example |
|---------|-----------|---------|
| Endpoints | Plural noun, lowercase | `/api/events` |
| Negotiate | Fixed path | `POST /api/negotiate` |
| Query params | camelCase | `?userId=test&pageSize=20&sortBy=createdAt&sortDir=desc` |
| JSON fields | camelCase (System.Text.Json default) | `{ "userId": "test", "createdAt": "..." }` |
| HTTP methods | POST for create, GET for read | `POST /api/events`, `GET /api/events` |
| Route | `api/[controller]` | `api/events` |

**C# Code:**

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `EventsController`, `EventService` |
| Methods | PascalCase + `Async` suffix | `CreateAsync()`, `GetAllAsync()` |
| Properties | PascalCase | `UserId`, `CreatedAt` |
| Private fields | `_camelCase` | `_dbContext`, `_serviceBus` |
| Interfaces | `I` prefix | `IEventRepository`, `IServiceBusPublisher` |
| Constants | PascalCase | `MaxDescriptionLength = 500` |
| DI extensions | `Add{Feature}` in `ServiceCollectionExtensions` | `services.AddEventHubShared(config)` |

**Angular Code:**

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `event-form.component.ts`, `event.service.ts` |
| Components | PascalCase class, kebab-case selector | `EventFormComponent`, `<app-event-form>` |
| Services | PascalCase + `Service` | `EventService`, `SignalRService` |
| NgRx actions | `[Source] Verb Noun` | `[Events Page] Load Events`, `[Event Form] Submit Event` |
| NgRx selectors | `select` prefix | `selectEvents`, `selectEventsLoading` |
| Interfaces/models | PascalCase | `Event`, `EventFilter`, `PagedResult<T>` |
| CSS classes | kebab-case | `.glass-panel`, `.event-type-chip` |
| SCSS variables | CSS custom properties with `--` prefix | `--bg-surface`, `--accent` |

### Structure Patterns

**Angular Project (feature-based with standalone):**

```
src/
├── styles/                          ← Global SCSS architecture
│   ├── _variables.scss              ← CSS custom properties (--bg-surface, --accent, etc.)
│   ├── _glass.scss                  ← Glassmorphism mixins (@mixin glass-panel, etc.)
│   ├── _typography.scss             ← Inter + JetBrains Mono @font-face + type scale
│   └── _material-overrides.scss     ← Angular Material dark Glass theme overrides
├── styles.scss                      ← Global imports: variables, glass, typography, overrides
├── app/
│   ├── core/                        ← Singleton services, interceptors
│   │   ├── services/
│   │   │   ├── event.service.ts     ← HTTP calls to API (used by NgRx Effects)
│   │   │   ├── signalr.service.ts   ← WebSocket connection (feeds NgRx Effects)
│   │   │   └── animation.service.ts ← Flying chip animation + prefers-reduced-motion check
│   │   └── interceptors/
│   │       └── error.interceptor.ts ← Functional interceptor (withInterceptors pattern)
│   ├── store/                       ← NgRx store (centralized)
│   │   ├── events/
│   │   │   ├── events.actions.ts
│   │   │   ├── events.reducer.ts
│   │   │   ├── events.effects.ts
│   │   │   └── events.selectors.ts
│   │   ├── submission/
│   │   │   ├── submission.actions.ts
│   │   │   ├── submission.reducer.ts
│   │   │   └── submission.effects.ts
│   │   ├── signalr/
│   │   │   ├── signalr.actions.ts
│   │   │   ├── signalr.reducer.ts
│   │   │   └── signalr.effects.ts
│   │   └── index.ts                 ← Root state interface + meta-reducers
│   ├── features/
│   │   ├── event-form/
│   │   │   ├── event-form.component.ts
│   │   │   ├── event-form.component.html
│   │   │   └── event-form.component.scss
│   │   ├── events-table/
│   │   │   ├── events-table.component.ts
│   │   │   ├── events-table.component.html
│   │   │   └── events-table.component.scss
│   │   └── events-filter/
│   │       └── ...
│   ├── shared/                      ← Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── flying-chip/
│   │   │   ├── event-type-chip/
│   │   │   ├── signalr-status-dot/
│   │   │   └── empty-state/
│   │   └── models/
│   │       ├── event.model.ts
│   │       ├── event-filter.model.ts
│   │       └── paged-result.model.ts
│   ├── app.component.ts
│   └── app.config.ts               ← provideStore, provideEffects, provideHttpClient
└── environments/
    ├── environment.ts               ← { apiUrl: 'https://localhost:5001' }
    └── environment.prod.ts          ← { apiUrl: 'https://production-api.com' }
```

**Angular app.config.ts (standalone bootstrap):**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({
      events: eventsReducer,
      submission: submissionReducer,
      signalr: signalrReducer,
    }),
    provideEffects(EventsEffects, SubmissionEffects, SignalrEffects),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

**Angular Environments:**

```typescript
// environment.ts (dev)
export const environment = {
  production: false,
  apiUrl: 'https://localhost:5001'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://production-api.com'
};
```

**.NET Clean Architecture Projects:**

```
EventHub.Domain/                          ← Zero dependencies
├── Entities/
│   └── Event.cs
├── Enums/
│   └── EventType.cs
└── EventHub.Domain.csproj

EventHub.Application/                     ← References: Domain
├── DTOs/
│   ├── CreateEventRequest.cs             ← DataAnnotations validation
│   ├── EventResponse.cs
│   ├── EventFilter.cs
│   └── PagedResult.cs
├── Messages/
│   └── EventMessage.cs                   ← Service Bus contract
├── Interfaces/
│   ├── IEventRepository.cs
│   └── IServiceBusPublisher.cs
├── Extensions/
│   └── ServiceCollectionExtensions.cs    ← AddApplication()
└── EventHub.Application.csproj

EventHub.Infrastructure/                  ← References: Application
├── Data/
│   ├── EventHubDbContext.cs
│   ├── Configurations/
│   │   └── EventConfiguration.cs         ← IEntityTypeConfiguration<Event>
│   └── Migrations/
├── Repositories/
│   └── EventRepository.cs               ← IEventRepository implementation
├── Services/
│   └── ServiceBusPublisher.cs            ← IServiceBusPublisher implementation
├── Extensions/
│   └── ServiceCollectionExtensions.cs    ← AddInfrastructure(config)
└── EventHub.Infrastructure.csproj

EventHub.Api/                             ← References: Application + Infrastructure
├── Controllers/
│   ├── EventsController.cs
│   └── NegotiateController.cs            ← POST /api/negotiate
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs
├── Program.cs                            ← Composition root
├── appsettings.json
├── appsettings.Development.json
└── EventHub.Api.csproj

EventHub.Function/                        ← References: Application + Infrastructure
├── Functions/
│   └── ProcessEvent.cs                   ← ServiceBus trigger + SignalR output
├── Services/
│   └── EventProcessingService.cs         ← DB write + idempotency logic
├── host.json
├── local.settings.json
└── EventHub.Function.csproj
```

**Tests:**

```
tests/
├── EventHub.Api.Tests/               ← xUnit
│   └── Controllers/
│       ├── EventsControllerTests.cs
│       └── NegotiateControllerTests.cs
└── EventHub.Function.Tests/           ← xUnit
    └── Services/
        └── EventProcessingServiceTests.cs
```

Angular unit tests: `*.spec.ts` co-located with components (Angular convention).

### Format Patterns

**API Response — Success:**

```json
// GET /api/events — paged response
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "olena",
      "type": "PageView",
      "description": "Viewed homepage",
      "createdAt": "2026-02-23T14:30:00Z"
    }
  ],
  "totalCount": 143,
  "page": 1,
  "pageSize": 20
}

// POST /api/events — single item response (201 Created)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "olena",
  "type": "PageView",
  "description": "Viewed homepage",
  "createdAt": "2026-02-23T14:30:00Z"
}
```

**API Response — Error (FR23):**

```json
// 400 Bad Request
{
  "errors": {
    "userId": "The UserId field is required.",
    "type": "The field Type is invalid."
  }
}

// 500 Internal Server Error
{
  "errors": {
    "server": "An unexpected error occurred. Please try again."
  }
}
```

**Date/Time:** Always UTC, ISO 8601 format: `"2026-02-23T14:30:00Z"`

**Enum serialization:** String values in JSON (`"PageView"`, not `0`)

**Null handling:** Omit null fields (`JsonSerializerOptions.DefaultIgnoreCondition = WhenWritingNull`)

### Communication Patterns

**NgRx Action Naming:**

```typescript
// Pattern: [Source] Verb Noun
// Events Page
export const loadEvents = createAction('[Events Page] Load Events');
export const changeFilter = createAction('[Events Page] Change Filter', props<{ filter: EventFilter }>());
export const changePage = createAction('[Events Page] Change Page', props<{ page: number }>());
export const changeSort = createAction('[Events Page] Change Sort', props<{ sortBy: string; sortDir: 'asc' | 'desc' }>());

// Events API
export const loadEventsSuccess = createAction('[Events API] Load Events Success', props<{ result: PagedResult<Event> }>());
export const loadEventsFailure = createAction('[Events API] Load Events Failure', props<{ error: string }>());

// Event Form
export const submitEvent = createAction('[Event Form] Submit Event', props<{ request: CreateEventRequest }>());
export const submitEventSuccess = createAction('[Events API] Submit Event Success', props<{ event: EventResponse }>());

// SignalR
export const signalrConnected = createAction('[SignalR] Connected');
export const signalrDisconnected = createAction('[SignalR] Disconnected');
export const signalrReconnecting = createAction('[SignalR] Reconnecting');
export const signalrEventReceived = createAction('[SignalR] Event Received', props<{ event: Event }>());
```

**SignalR Event Names:**

| Event | Direction | Payload |
|-------|-----------|---------|
| `newEvent` | Server → Client | `Event` object (full entity) |

**Service Bus Message:**
- Content type: `application/json`
- Body: serialized `EventMessage`
- Message ID: `Event.Id` (GUID) — for deduplication

### Process Patterns

**Error Handling:**

| Layer | Strategy |
|-------|----------|
| Angular form | Reactive Forms validators on blur; `mat-error` for field-level display |
| Angular HTTP | Functional `errorInterceptor` catches HTTP errors → dispatches NgRx error action → toast |
| API Controller | `[ApiController]` auto-validates → 400 with `ModelState`. Custom `ExceptionHandlingMiddleware` → 500 with structured JSON + Serilog |
| Azure Function | Try/catch in ProcessEvent → Serilog log → message to dead-letter queue on repeated failure |

**Loading States:**

| State | NgRx property | UI behavior |
|-------|--------------|-------------|
| Table loading | `events.loading: true` | `mat-progress-bar` indeterminate above table |
| Submit in progress | `submission.status: 'submitting'` | Submit button disabled |
| Chip animation | `submission.status: 'chip-flying'` | Flying chip visible |
| Waiting SignalR | `submission.status: 'waiting-signalr'` | Chip hovering with pulse |

### Testing Strategy

**Scope: Unit tests only (MVP time constraint)**

| Project | Framework | What to test | Mock strategy |
|---------|-----------|-------------|---------------|
| EventHub.Api | xUnit + Moq | EventsController (POST validation, GET filtering) | In-memory EF Core provider for DbContext; Moq for IServiceBusPublisher |
| EventHub.Function | xUnit + Moq | ProcessEvent (DB write, idempotency, SignalR output) | In-memory EF Core provider; verify SignalR output binding return |
| Angular | Karma + Jasmine | EventFormComponent (validation), EventsTableComponent (rendering), NgRx reducers (state transitions) | HttpClientTestingModule for services; provideMockStore for NgRx |

**Not in scope (MVP):** E2E tests, integration tests, load tests.

### Enforcement Guidelines

**All AI Agents MUST:**

1. Follow file naming conventions exactly — kebab-case for Angular, PascalCase for C#
2. Use domain entities from `EventHub.Domain` and DTOs from `EventHub.Application` — never duplicate definitions
3. Return API errors in `{"errors": {"field": "message"}}` format — no exceptions
4. Use `async/await` in all C# code — never `.Result` or `.Wait()`
5. Use NgRx actions for all state mutations — never modify store directly
6. Use ISO 8601 UTC for all date/time values — never local time
7. Use Serilog structured logging — never `Console.WriteLine`
8. Use `[ApiController]` attribute — never manual `ModelState.IsValid` checks
9. Use `provideStore()` / `provideEffects()` / `provideHttpClient(withInterceptors([...]))` — never legacy `StoreModule.forRoot()` or `HTTP_INTERCEPTORS` provider
10. Use `IEntityTypeConfiguration<T>` for EF Core config — never inline in `OnModelCreating`
11. Use `environment.ts` / `environment.prod.ts` for API URL configuration — never hardcode URLs in services
12. Place SCSS tokens in `src/styles/_variables.scss` — never inline magic color values
13. Follow Clean Architecture dependency rule — inner layers NEVER reference outer layers
14. Place interface definitions in `EventHub.Application/Interfaces/` — implementations in `EventHub.Infrastructure/`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
event-hub/
├── README.md
├── .editorconfig                              ← Root formatting config (monorepo)
├── .gitignore
├── EventHub.sln
│
├── src/
│   ├── EventHub.Domain/                       ← LAYER 1: Zero dependencies
│   │   ├── Entities/
│   │   │   └── Event.cs                       ← Domain entity (Id, UserId, Type, Description, CreatedAt)
│   │   ├── Enums/
│   │   │   └── EventType.cs                   ← PageView, Click, Purchase
│   │   └── EventHub.Domain.csproj
│   │
│   ├── EventHub.Application/                  ← LAYER 2: References Domain only
│   │   ├── DTOs/
│   │   │   ├── CreateEventRequest.cs          ← DataAnnotations: [Required], [MaxLength]
│   │   │   ├── EventResponse.cs               ← API response DTO
│   │   │   ├── EventFilter.cs                 ← Query params: type, userId, description, from, to
│   │   │   └── PagedResult.cs                 ← Generic: { items, totalCount, page, pageSize }
│   │   ├── Messages/
│   │   │   └── EventMessage.cs                ← Service Bus message contract
│   │   ├── Interfaces/
│   │   │   ├── IEventRepository.cs            ← GetAllAsync(filter), CreateAsync(event)
│   │   │   └── IServiceBusPublisher.cs        ← PublishAsync(message)
│   │   ├── Extensions/
│   │   │   └── ServiceCollectionExtensions.cs ← AddApplication()
│   │   └── EventHub.Application.csproj
│   │
│   ├── EventHub.Infrastructure/               ← LAYER 3: References Application
│   │   ├── Data/
│   │   │   ├── EventHubDbContext.cs            ← DbSet<Event>, config via IEntityTypeConfiguration
│   │   │   ├── Configurations/
│   │   │   │   └── EventConfiguration.cs      ← Indexes, column types, enum as string
│   │   │   └── Migrations/                    ← EF Core Code-First migrations
│   │   ├── Repositories/
│   │   │   └── EventRepository.cs             ← IEventRepository: IQueryable + Skip/Take/Where/OrderBy
│   │   ├── Services/
│   │   │   └── ServiceBusPublisher.cs         ← IServiceBusPublisher: ServiceBusClient SDK
│   │   ├── Extensions/
│   │   │   └── ServiceCollectionExtensions.cs ← AddInfrastructure(config): DbContext, repos, services
│   │   └── EventHub.Infrastructure.csproj
│   │
│   ├── EventHub.Api/                          ← PRESENTATION: References Application + Infrastructure
│   │   ├── Controllers/
│   │   │   ├── EventsController.cs            ← POST /api/events, GET /api/events
│   │   │   └── NegotiateController.cs         ← POST /api/negotiate → SignalR connection info
│   │   ├── Middleware/
│   │   │   └── ExceptionHandlingMiddleware.cs ← 500 → structured JSON + Serilog
│   │   ├── Program.cs                         ← Composition root: AddApplication() + AddInfrastructure()
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   └── EventHub.Api.csproj
│   │
│   ├── EventHub.Function/                     ← PRESENTATION: References Application + Infrastructure
│   │   ├── Functions/
│   │   │   └── ProcessEvent.cs                ← [ServiceBusTrigger] + [SignalROutput]
│   │   ├── Services/
│   │   │   └── EventProcessingService.cs      ← DB write + idempotency (UNIQUE constraint catch)
│   │   ├── host.json
│   │   ├── local.settings.json
│   │   └── EventHub.Function.csproj
│   │
│   └── frontend/                              ← Angular 19 SPA
│       ├── angular.json
│       ├── package.json
│       ├── tsconfig.json
│       ├── .editorconfig
│       ├── src/
│       │   ├── index.html                     ← Google Fonts CDN: Inter + JetBrains Mono
│       │   ├── styles.scss                    ← Global SCSS imports
│       │   ├── styles/
│       │   │   ├── _variables.scss            ← CSS custom properties (--bg-surface, --accent)
│       │   │   ├── _glass.scss                ← Glassmorphism mixins (glass-panel is SCSS, not component)
│       │   │   ├── _typography.scss           ← Font-face + type scale
│       │   │   └── _material-overrides.scss   ← Angular Material dark Glass theme
│       │   ├── environments/
│       │   │   ├── environment.ts             ← { apiUrl: 'https://localhost:5001' }
│       │   │   └── environment.prod.ts        ← { apiUrl: 'https://production-api.com' }
│       │   └── app/
│       │       ├── app.component.ts
│       │       ├── app.config.ts              ← provideStore, provideEffects, provideHttpClient
│       │       ├── core/
│       │       │   ├── services/
│       │       │   │   ├── event.service.ts   ← HTTP via environment.apiUrl (used by Effects)
│       │       │   │   ├── signalr.service.ts ← WebSocket connection (feeds Effects)
│       │       │   │   └── animation.service.ts ← Flying chip + prefers-reduced-motion
│       │       │   └── interceptors/
│       │       │       └── error.interceptor.ts ← Functional interceptor
│       │       ├── store/
│       │       │   ├── events/
│       │       │   │   ├── events.actions.ts
│       │       │   │   ├── events.reducer.ts
│       │       │   │   ├── events.effects.ts
│       │       │   │   └── events.selectors.ts
│       │       │   ├── submission/
│       │       │   │   ├── submission.actions.ts
│       │       │   │   ├── submission.reducer.ts
│       │       │   │   └── submission.effects.ts
│       │       │   ├── signalr/
│       │       │   │   ├── signalr.actions.ts
│       │       │   │   ├── signalr.reducer.ts
│       │       │   │   └── signalr.effects.ts
│       │       │   └── index.ts               ← Root AppState interface
│       │       ├── features/
│       │       │   ├── event-form/
│       │       │   │   ├── event-form.component.ts
│       │       │   │   ├── event-form.component.html
│       │       │   │   ├── event-form.component.scss
│       │       │   │   └── event-form.component.spec.ts
│       │       │   ├── events-table/
│       │       │   │   ├── events-table.component.ts
│       │       │   │   ├── events-table.component.html
│       │       │   │   ├── events-table.component.scss
│       │       │   │   └── events-table.component.spec.ts
│       │       │   └── events-filter/
│       │       │       ├── events-filter.component.ts
│       │       │       ├── events-filter.component.html
│       │       │       ├── events-filter.component.scss
│       │       │       └── events-filter.component.spec.ts
│       │       └── shared/
│       │           ├── components/
│       │           │   ├── flying-chip/
│       │           │   ├── event-type-chip/
│       │           │   ├── signalr-status-dot/
│       │           │   └── empty-state/
│       │           └── models/
│       │               ├── event.model.ts
│       │               ├── event-filter.model.ts
│       │               └── paged-result.model.ts
│       └── ...
│
├── tests/
│   ├── EventHub.Api.Tests/                    ← xUnit + Moq
│   │   └── Controllers/
│   │       ├── EventsControllerTests.cs
│   │       └── NegotiateControllerTests.cs
│   └── EventHub.Function.Tests/               ← xUnit + Moq
│       └── Services/
│           └── EventProcessingServiceTests.cs
│
├── _bmad-output/                              ← BMAD planning artifacts
└── docs/

```

### Architectural Boundaries

**Clean Architecture Dependency Rule:**

```
┌─────────────────────────────────────────────┐
│  Presentation (Api, Function, Angular)      │  ← Knows about everything
│  ┌─────────────────────────────────────┐    │
│  │  Infrastructure (EF Core, SDK)      │    │  ← Knows Application + Domain
│  │  ┌─────────────────────────────┐    │    │
│  │  │  Application (DTOs, I/F)    │    │    │  ← Knows Domain only
│  │  │  ┌─────────────────────┐    │    │    │
│  │  │  │  Domain (Entities)  │    │    │    │  ← Knows NOTHING external
│  │  │  └─────────────────────┘    │    │    │
│  │  └─────────────────────────────┘    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**API Boundaries:**

| Boundary | Entry Point | Responsibility |
|----------|------------|----------------|
| REST API | `EventsController` | CRUD operations, query + pagination |
| SignalR negotiate | `NegotiateController` | Return SignalR connection info to Angular |
| Service Bus publish | `IServiceBusPublisher` | Fire-and-forget event message |

**Component Boundaries:**

| Component | Owns | Communicates via |
|-----------|------|------------------|
| Angular SPA | UI state (NgRx), user interactions | HTTP → API, WebSocket ← SignalR Service |
| API | HTTP request handling, composition root | REST responses, Service Bus publish |
| Function | Event processing, DB write | Service Bus consume, SignalR output binding |
| Azure SQL | Data persistence | EF Core IQueryable (via IEventRepository) |
| Azure SignalR Service | WebSocket connections | Output binding (Function), negotiate (API) |
| Azure Service Bus | Message queue | SDK publish (API), trigger (Function) |

**Data Boundaries:**

| Layer | Data Access Pattern |
|-------|-------------------|
| Domain | Pure entities — no persistence awareness |
| Application | Interfaces only (`IEventRepository`) — no implementation |
| Infrastructure | EF Core `DbContext`, `IQueryable` with `Where/OrderBy/Skip/Take` |
| API | Receives DTOs, delegates to Application interfaces |
| Function | Uses `EventProcessingService` → `IEventRepository` |

### Requirements to Structure Mapping

**FR → Directory Mapping:**

| FR Category | .NET Location | Angular Location |
|------------|---------------|------------------|
| Event Submission (FR1–FR5) | `Application/DTOs/CreateEventRequest.cs`, `Api/Controllers/EventsController.cs [HttpPost]` | `features/event-form/`, `store/submission/` |
| Event Discovery (FR6–FR12, FR31–FR32) | `Application/DTOs/EventFilter.cs`, `Infrastructure/Repositories/EventRepository.cs`, `Api/Controllers/EventsController.cs [HttpGet]` | `features/events-table/`, `features/events-filter/`, `store/events/` |
| Real-Time Updates (FR13–FR14) | `Function/Functions/ProcessEvent.cs` [SignalROutput], `Api/Controllers/NegotiateController.cs` | `core/services/signalr.service.ts`, `store/signalr/` |
| API & Integration (FR15–FR20) | `Api/Program.cs` (Swagger), `Infrastructure/Services/ServiceBusPublisher.cs`, `Function/Services/EventProcessingService.cs` | — |
| Data Validation (FR21–FR24) | `Application/DTOs/CreateEventRequest.cs` [DataAnnotations], `Api/Middleware/ExceptionHandlingMiddleware.cs` | `features/event-form/` (Reactive Forms validators) |
| Responsive UI (FR29–FR30) | — | `styles/`, `features/` (responsive SCSS), `shared/models/` |

**Cross-Cutting Concerns Mapping:**

| Concern | Location |
|---------|----------|
| Structured Logging | `Api/Program.cs` (Serilog config), `Function/` (Serilog config) |
| CORS | `Api/Program.cs` (AddCors + UseCors) |
| Error Handling | `Api/Middleware/ExceptionHandlingMiddleware.cs`, `core/interceptors/error.interceptor.ts` |
| DI Registration | `Application/Extensions/`, `Infrastructure/Extensions/`, `Api/Program.cs` |
| Environment Config | `Api/appsettings.*.json`, `Function/local.settings.json`, `environments/environment*.ts` |

### Integration Points

**Data Flow (complete E2E):**

```
User fills form → Angular Reactive Form validates →
  → NgRx dispatch [Event Form] Submit Event →
    → Effect → EventService.create() POST /api/events →
      → EventsController.Create() → IServiceBusPublisher.PublishAsync() →
        → Azure Service Bus Queue →
          → [ServiceBusTrigger] ProcessEvent →
            → EventProcessingService.ProcessAsync() →
              → IEventRepository.CreateAsync() → Azure SQL INSERT →
              → return SignalRMessageAction("newEvent") →
                → Azure SignalR Service →
                  → Angular SignalRService.on("newEvent") →
                    → NgRx dispatch [SignalR] Event Received →
                      → Effect: if page 1 → re-fetch events
                      → Submission status → chip landing animation
```

**External Integrations:**

| Service | SDK/Package | Connection |
|---------|-------------|------------|
| Azure SQL | `Microsoft.EntityFrameworkCore.SqlServer` | Connection string in appsettings |
| Azure Service Bus | `Azure.Messaging.ServiceBus` | Connection string in appsettings |
| Azure SignalR Service | `Microsoft.Azure.Functions.Worker.Extensions.SignalRService` (Function), `@microsoft/signalr` (Angular) | Connection string + negotiate endpoint |
| Google Fonts | CDN `<link>` in `index.html` | External CDN, no package |

### Development Workflow

**Local Development (3 terminals):**

| Terminal | Command | Port | Hot Reload |
|----------|---------|------|------------|
| Angular | `ng serve` | 4200 | Yes |
| API | `dotnet watch run` | 5001 (HTTPS) | Yes |
| Function | `func start` | 7071 | Manual restart |

**Angular → API connection:** via `environment.ts` pointing to `https://localhost:5001`

**Build & Deployment:**

| Component | Build Command | Output |
|-----------|--------------|--------|
| Angular | `ng build --configuration production` | `dist/` |
| API | `dotnet publish -c Release` | `bin/Release/net8.0/publish/` |
| Function | `dotnet publish -c Release` | `bin/Release/net8.0/publish/` |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

All technology decisions verified compatible:

- Angular 19 LTS + NgRx standalone APIs (`provideStore`, `provideEffects`) — native support ✅
- .NET 8 LTS + EF Core 8 + Azure SQL — full IQueryable support ✅
- Azure Functions v4 + .NET 8 isolated worker — Microsoft recommended ✅
- Azure SignalR Service + Functions output binding (`SignalRMessageAction`) — native integration ✅
- Service Bus + Functions trigger (`ServiceBusTrigger`) — native integration ✅
- Clean Architecture layers + Controllers + EF Core — standard enterprise pattern ✅
- DataAnnotations in Application layer — `System.ComponentModel` has no infrastructure dependencies ✅

No contradictory decisions found.

**Pattern Consistency:**

- Naming: PascalCase (C#), kebab-case (Angular files), camelCase (JSON/TypeScript) — consistent across all layers ✅
- NgRx actions: `[Source] Verb Noun` — unified format across all store slices ✅
- Clean Architecture dependency rule: Domain ← Application ← Infrastructure ← Presentation — enforced via project references ✅
- API response format: `{"errors":...}` for errors, `PagedResult<T>` for lists — unified ✅

**Structure Alignment:**

- Each Clean Architecture layer has dedicated `src/` folder with explicit `.csproj` references ✅
- Angular feature-based structure maps 1:1 to NgRx store slices (events/, submission/, signalr/) ✅
- Test structure mirrors source structure (Controllers/ → Controllers/, Services/ → Services/) ✅

### Requirements Coverage Validation ✅

**Functional Requirements (32/32 covered):**

| FR | Status | Architectural Component |
|----|--------|------------------------|
| FR1–FR5 (Submission) | ✅ | `event-form/` → NgRx `submission/` → `EventService` → `EventsController [HttpPost]` → `IServiceBusPublisher` |
| FR6 (View events) | ✅ | `events-table/` → NgRx `events/` → `EventService` → `EventsController [HttpGet]` → `IEventRepository` |
| FR7–FR11 (Filters) | ✅ | `EventFilter.cs` → `EventRepository` IQueryable `.Where()` chains |
| FR12 (Loading) | ✅ | NgRx `events.loading` → `mat-progress-bar` |
| FR13–FR14 (Real-time) | ✅ | `ProcessEvent.cs [SignalROutput]` → `signalr.service.ts` → NgRx `[SignalR] Event Received` |
| FR15–FR17 (API) | ✅ | REST: POST + GET + query params via Controllers |
| FR18 (Swagger) | ✅ | Swashbuckle in `Program.cs` |
| FR19 (Async publish) | ✅ | `IServiceBusPublisher.PublishAsync()` |
| FR20 (DB persist) | ✅ | `EventProcessingService` → `IEventRepository.CreateAsync()` |
| FR21–FR24 (Validation) | ✅ | DataAnnotations + `[ApiController]` → 400; `ExceptionHandlingMiddleware` → 500; Serilog |
| FR25–FR28 (DevEx) | ✅ | README, ADRs 1–6, BMAD artifacts |
| FR29–FR30 (Responsive) | ✅ | 3 breakpoints (SCSS), Angular Material keyboard support |
| FR31 (Pagination) | ✅ | Server-side: `page`, `pageSize`, `mat-paginator` |
| FR32 (Sorting) | ✅ | Server-side: `sortBy`, `sortDir` + NgRx `changeSort` |

**Non-Functional Requirements (14/14 covered):**

| NFR | Status | How Addressed |
|-----|--------|--------------|
| P1–P2 (API < 500ms) | ✅ | Server-side pagination + SQL indexes on filtered columns |
| P3 (SignalR < 1s) | ✅ | Serverless SignalR — direct Function → Service → client (no HTTP hop) |
| P4 (E2E < 3s) | ✅ | Pipeline: Form → API → SB → Function → DB → SignalR → client |
| P5 (Loading < 200ms) | ✅ | NgRx dispatch → synchronous Angular change detection |
| S1 (HTTPS) | ✅ | `app.UseHttpsRedirection()` |
| S2 (CORS) | ✅ | Environment-aware via `appsettings.{env}.json` |
| S3 (Secrets) | ✅ | `appsettings.json` (dev) / Azure App Settings (prod) |
| I1 (At-least-once) | ✅ | Service Bus guaranteed delivery |
| I2 (Idempotency) | ✅ | UNIQUE constraint on `Event.Id` + catch in `EventProcessingService` |
| I3 (Reconnect) | ✅ | `.withAutomaticReconnect([0, 2000, 10000, 30000])` |
| M1 (Layer separation) | ✅ | Clean Architecture enforces strict project boundaries |
| M2 (Externalized config) | ✅ | `appsettings.json` + `local.settings.json` + `environment.ts` |
| M3 (Linter/analyzer) | ✅ | ESLint (Angular) + `Directory.Build.props` with `TreatWarningsAsErrors` (.NET) |

### Implementation Readiness Validation ✅

**Decision Completeness:**

- 6 ADRs with trade-off tables and rationale ✅
- All technology versions specified (Angular 19, .NET 8, Functions v4, Node 22 LTS) ✅
- 14 enforcement rules for AI agent consistency ✅
- Code examples for all major patterns (NgRx, Controllers, EF Core, SignalR) ✅

**Structure Completeness:**

- Complete directory tree with ~70 files across 6 .NET projects + Angular workspace ✅
- Clean Architecture layers with explicit dependency diagram ✅
- FR → directory mapping table for all 32 FRs ✅
- E2E data flow diagram with every component in chain ✅

**Pattern Completeness:**

- Naming conventions for DB, API, C#, Angular, NgRx, SCSS ✅
- API response format with success + error examples ✅
- SignalR event names and payload structure ✅
- Service Bus message format with deduplication ✅
- Error handling strategy per layer ✅
- Loading state mapping to NgRx properties ✅

### Gap Analysis Results

**Critical Gaps:** None found ✅

**Minor Gaps (addressed in validation):**

| # | Gap | Resolution |
|---|-----|-----------|
| 1 | NFR-I3 reconnect intervals not explicit | Added: `.withAutomaticReconnect([0, 2000, 10000, 30000])` in SignalR client config |
| 2 | NFR-M3 .NET code analysis not specified | Added: `Directory.Build.props` with `TreatWarningsAsErrors` + `EnforceCodeStyleInBuild` |
| 3 | Toast mechanism not in structure | Resolution: Angular Material `MatSnackBar` used directly in NgRx Effects — no separate service needed |
| 4 | `EventProcessingService` in Function (not Application) | Known pragmatic deviation: idempotency logic is trigger-context-specific; acceptable for MVP |

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed (32 FRs, 14 NFRs mapped)
- [x] Scale and complexity assessed (demo scale, low complexity)
- [x] Technical constraints identified (no auth, source only, immutable events)
- [x] Cross-cutting concerns mapped (6 concerns with strategies)

**✅ Architectural Decisions**

- [x] 6 ADRs documented with trade-off analysis
- [x] Technology stack fully specified with verified versions
- [x] Integration patterns defined (SignalR serverless, Service Bus Queue)
- [x] Performance considerations addressed (server-side pagination, indexed queries)

**✅ Implementation Patterns**

- [x] Naming conventions established across all layers
- [x] Structure patterns defined (Clean Architecture + feature-based Angular)
- [x] Communication patterns specified (NgRx actions, SignalR events, Service Bus messages)
- [x] Process patterns documented (error handling, loading states, testing)
- [x] 14 enforcement rules for AI agent consistency

**✅ Project Structure**

- [x] Complete directory structure with ~70 files
- [x] Clean Architecture boundaries with dependency diagram
- [x] Integration points mapped with E2E data flow
- [x] Requirements to structure mapping complete (FR → directory)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**

- Clean Architecture demonstrates enterprise-level skills for technical reviewer
- NgRx + server-side pagination show proper Angular state management at scale
- 6 ADRs with detailed trade-offs provide README content per tech task requirements
- Every FR and NFR traced to specific architectural component
- 14 enforcement rules prevent AI agent implementation conflicts
- Complete E2E data flow documented from form submit to table update

**Areas for Future Enhancement (Post-MVP):**

- CI/CD pipeline (GitHub Actions)
- Infrastructure as Code (Bicep/Terraform)
- E2E testing (Playwright/Cypress)
- API versioning
- Health check endpoints
- Application Insights dashboard configuration

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect Clean Architecture dependency rule — inner layers NEVER reference outer layers
- Refer to this document for all architectural questions
- Follow 14 enforcement rules without exception

**First Implementation Priority:**

1. Run initialization commands (solution, projects, references)
2. Implement Domain layer (entities, enums)
3. Implement Application layer (DTOs, interfaces)
4. Implement Infrastructure layer (DbContext, repositories, services)
5. Scaffold API (controllers, middleware, Program.cs)
6. Create first EF Core migration
7. Begin Angular SPA with NgRx store setup
