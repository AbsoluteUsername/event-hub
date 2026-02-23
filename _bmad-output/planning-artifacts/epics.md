---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# event-hub - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for event-hub, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: End User can submit a new event specifying UserId, event Type, and Description
FR2: End User can select event Type from a predefined set of values (PageView, Click, Purchase)
FR3: End User receives a toast notification displaying a success message after a successful event submission
FR4: End User receives a toast notification with an error message when event submission fails, plus inline field-level error indicators for validation failures
FR5: System prevents submission when required fields are missing or contain invalid values, displaying validation errors before the request is sent
FR6: End User can view Id, UserId, Type, Description, and CreatedAt for each stored event in a structured list
FR7: End User can filter the displayed event list by event Type
FR8: End User can filter the displayed event list by UserId
FR9: End User can search the event list by Description using substring (contains) matching
FR10: End User can filter the event list by CreatedAt using a date range picker (from / to)
FR11: End User can apply any combination of available filters simultaneously
FR12: End User can see a loading indicator while event data is being fetched or filters are being applied
FR13: End User sees newly persisted events appear in the event list without manual page refresh
FR14: System broadcasts new event notifications to all connected clients upon successful event persistence
FR15: API Consumer can submit a new event via an HTTP endpoint and receives the generated event Id in the response
FR16: API Consumer can retrieve stored events via an HTTP endpoint
FR17: API Consumer can request filtered events using query parameters (Type, UserId, Description, date range) — filtering applied before returning results
FR18: API Consumer can inspect available endpoints, request/response schemas, and error formats via a built-in API documentation interface
FR19: System publishes accepted events for asynchronous downstream processing
FR20: System persists event data to a database upon receiving an asynchronous event message
FR21: System validates event data at the API boundary independently of any UI-level validation
FR22: System rejects incomplete or malformed event submissions and returns field-level error details
FR23: System returns error responses in a consistent JSON format (`{"errors": {"field": "message"}}`) across all failure scenarios
FR24: System records all processing errors at both the API and event processing layers
FR25: Developer can set up and run the full application locally by following README instructions alone
FR26: Developer can trace each architectural decision (database choice, message broker usage, real-time strategy, layer separation) to a corresponding documented rationale
FR27: Developer can access Architecture Decision Records that explain trade-offs for significant technical choices
FR28: Developer can review the complete set of BMAD methodology artifacts (Project Brief, PRD, Architecture Doc)
FR29: End User can access and use the application on desktop (≥1024px), tablet (768–1023px), and mobile (<768px) screen sizes with adapted layout per breakpoint
FR30: End User can operate all primary interactions (form submit, filtering, pagination) via keyboard: Tab through fields, Enter to submit, visible focus indicators on all interactive elements
FR31: End User can navigate through event list pages using pagination controls (previous, next, page number) with a default page size of 20 items
FR32: End User can sort the event list by any displayed column, with CreatedAt descending as the default sort order

### NonFunctional Requirements

NFR-P1: API response time for POST /api/events must not exceed 500ms at the 95th percentile, measured at the server, under load of up to 100 concurrent requests
NFR-P2: API response time for GET /api/events (with filters applied) must not exceed 500ms at the 95th percentile, measured at the server, with up to 1,000 stored events
NFR-P3: Real-time event notification must be delivered to connected clients within 1 second of successful database write, measured from write completion to client receipt
NFR-P4: Full end-to-end pipeline latency (form submit → database persist → live table update) must not exceed 3 seconds, measured from form submission to visible table update in the browser
NFR-P5: Loading indicator must appear within 200ms of initiating any data fetch or filter operation, measured from user action to visible indicator render
NFR-S1: All client-server communication must occur over HTTPS
NFR-S2: CORS policy must be environment-aware — permissive for localhost origins in development, restricted to the known frontend application origin in production
NFR-S3: Message broker connection strings and database credentials must be stored in environment configuration, never in source code
NFR-I1: Message broker delivery must follow at-least-once semantics — no event may be permanently lost on transient failure
NFR-I2: Event processing component must process events idempotently using the event Id as a unique database key — duplicate message delivery results in a logged, graceful no-op with no duplicate records written
NFR-I3: Real-time client must attempt automatic reconnection with exponential backoff (0s, 2s, 10s, 30s intervals) upon unexpected disconnect
NFR-M1: Event processing layer must contain no HTTP-handling code; API layer must contain no direct database access code — layer boundaries enforced and verifiable at code review
NFR-M2: All configuration values must be externalized via environment variables or platform configuration service
NFR-M3: Frontend code must pass configured linter with zero errors; backend code must pass configured code analysis with zero warnings at build time

### Additional Requirements

**From Architecture:**

- **Starter Template specified:** Angular CLI (`ng new`), `dotnet new webapi`, `func init` — project initialization is the first implementation story (Epic 1, Story 1)
- **Clean Architecture:** Domain / Application / Infrastructure layers with strict dependency rule (inner layers never reference outer layers). 6 .NET projects: Domain, Application, Infrastructure, Api, Function + test projects
- **ADR-1 — Database: Azure SQL** with EF Core Code-First Migrations, IQueryable-based server-side filtering
- **ADR-2 — Messaging: Service Bus Queue** (single consumer for MVP; migration to Topic post-MVP)
- **ADR-3 — Real-Time: Azure SignalR Service (Serverless)** with output binding from Azure Function; negotiate endpoint in API
- **ADR-4 — Monorepo** structure: `/src/frontend/`, `/src/api/`, `/src/function/` in one repository
- **ADR-5 — State Management: NgRx Store** (updated from Services + Signals). NgRx actions, reducers, effects, selectors for events, submission, signalr store slices
- **ADR-6 — Server-Side Pagination:** `GET /api/events?page=1&pageSize=20&sortBy=createdAt&sortDir=desc` returning `{ items, totalCount, page, pageSize }`
- **Controller-based API** with `[ApiController]` attribute, automatic model validation
- **DataAnnotations** for validation on Application layer DTOs
- **Serilog** with Console + Application Insights sinks for structured logging
- **Environment configuration:** `appsettings.json`/`appsettings.Development.json` (API), `local.settings.json` (Function), `environment.ts`/`environment.prod.ts` (Angular)
- **Error response standard:** `{"errors": {"field": "message"}}` format for all errors, custom `ExceptionHandlingMiddleware` for 500s
- **Service Bus message:** `EventMessage` with `Id` as Message ID for deduplication
- **SignalR event:** `newEvent` server→client with full Event object payload
- **Testing:** xUnit + Moq for .NET; Karma + Jasmine for Angular; unit tests only for MVP
- **14 Enforcement Rules** for AI agent consistency (naming, patterns, imports)
- **Initialization commands** provided for all projects (Angular CLI, dotnet CLI, func CLI, solution file, project references)

**From UX Design:**

- **Glass design direction:** Glassmorphism panels with `backdrop-filter: blur(24px)`, gradient dark background (`#060714`), frosted surfaces
- **FlyingChipComponent:** Custom programmatic component via `ComponentRef` + Web Animations API with spring easing. States: materializing → in-flight → hovering → landing
- **EventTypeChipComponent:** Color-coded pill chips (PageView=blue `#3b82f6`, Click=amber `#f59e0b`, Purchase=green `#22c55e`) with dark-tinted backgrounds
- **SignalRStatusDotComponent:** 3-state connection indicator (connected/reconnecting/disconnected) with glowing dot
- **GlassPanelComponent:** Reusable glassmorphism container (`ng-content` projection, 16px border-radius)
- **EmptyStateComponent:** Two states — `no-data` (first use onboarding) and `no-results` (filters active, zero matches with "Clear all filters" link)
- **Dark theme palette:** Specific CSS custom properties (`--bg-base: #0a0a0a`, `--bg-surface: #111111`, `--accent: #7c3aed`, etc.)
- **Typography:** Inter (UI body) + JetBrains Mono (technical data) loaded via Google Fonts CDN
- **Responsive breakpoints:** Desktop ≥1024px (side-by-side, 380px form + flex table), Tablet 768–1023px (compressed side-by-side, 260px form, Id+Description columns hidden), Mobile <768px (stacked, horizontal scroll table)
- **Flying animation replaced by fade on mobile** (< 768px)
- **WCAG 2.1 AA compliance:** All color pairs meet 4.5:1 contrast minimum, semantic HTML, ARIA labels, `role="status"` annotations
- **`prefers-reduced-motion` support:** All animations have reduced-motion fallbacks (skip chip, instant transitions)
- **Reactive filters:** `debounceTime(300ms)` + `switchMap` for server-side queries, no "Apply" button
- **Toast notifications:** Glass-themed `MatSnackBar` (error: red left border, info: violet left border), bottom-right positioning
- **Row insert animation:** Unfold top-to-bottom (~300ms) + violet highlight (`rgba(124,58,237,0.12)` for ~1.5s then fade)
- **Keyboard navigation:** Full tab order specified (form → filters → table sort headers → paginator), Enter to submit from Description field
- **Id column display:** Truncated GUID (8 chars + "…") with `matTooltip` for full value
- **Submit button:** Gradient `#7c3aed → #5b21b6` with glow `box-shadow`, disabled during full async cycle (click → row highlight complete)
- **Form behavior:** Fields remain editable during async cycle; form preserves input on server error; resets to empty + re-focuses UserId after success
- **Filter-aware post-submit toast:** "New event added — hidden by current filters" with "Clear filters" action link
- **SignalR + Pagination edge case:** Page 2+ gets toast "New event added" + "Go to page 1" link (no auto-jump)

### FR Coverage Map

FR1: Epic 2 - Submit event (UserId, Type, Description)
FR2: Epic 2 - Select Type from predefined set
FR3: Epic 2 - Success toast notification
FR4: Epic 2 - Error toast + inline field errors
FR5: Epic 2 - Prevent submission with invalid data
FR6: Epic 3 - View events in structured list
FR7: Epic 3 - Filter by Type
FR8: Epic 3 - Filter by UserId
FR9: Epic 3 - Search by Description (contains)
FR10: Epic 3 - Filter by date range
FR11: Epic 3 - Combine filters simultaneously
FR12: Epic 3 - Loading indicator
FR13: Epic 4 - Live event appearance (no refresh)
FR14: Epic 4 - Broadcast new events to all clients
FR15: Epic 2 - POST /api/events returns event Id
FR16: Epic 3 - GET /api/events endpoint
FR17: Epic 3 - Filtered GET with query params
FR18: Epic 5 - Swagger/OpenAPI documentation
FR19: Epic 2 - Async publish to Service Bus
FR20: Epic 2 - DB persist on async message
FR21: Epic 2 - Server-side validation (independent of UI)
FR22: Epic 2 - Reject malformed + field-level errors
FR23: Epic 2 - Consistent JSON error format
FR24: Epic 2 - Log all processing errors
FR25: Epic 1 - Local setup via README
FR26: Epic 5 - Trace architectural decisions to docs
FR27: Epic 5 - ADR files with trade-offs
FR28: Epic 5 - BMAD artifacts complete
FR29: Epic 5 - Responsive layout (3 breakpoints)
FR30: Epic 5 - Keyboard navigation
FR31: Epic 3 - Pagination controls (default 20/page)
FR32: Epic 3 - Column sorting (CreatedAt desc default)

## Epic List

### Epic 1: Project Initialization & Core Infrastructure
Developer can clone the repository, build, and run all project components. Core domain model, Clean Architecture layers, and Azure service connections are in place.
**FRs covered:** FR25
**NFRs addressed:** NFR-S1, NFR-S2, NFR-S3, NFR-M1, NFR-M2

### Epic 2: Event Submission Pipeline (Full Stack)
End User can submit events via the Angular form with validation, and events are persisted through the full async pipeline (Form → API → Service Bus → Function → Azure SQL). API Consumer can submit events via POST endpoint.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR15, FR19, FR20, FR21, FR22, FR23, FR24
**NFRs addressed:** NFR-P1, NFR-I1, NFR-I2

### Epic 3: Event Discovery & Table Display (Full Stack)
End User can view stored events in a table with filtering, sorting, and pagination. API Consumer can retrieve filtered events via GET endpoint.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR16, FR17, FR31, FR32
**NFRs addressed:** NFR-P2, NFR-P5

### Epic 4: Real-Time Updates & Live Experience
End User sees newly persisted events appear automatically without page refresh. The flying chip animation completes the signature "send → watch → arrive" experience.
**FRs covered:** FR13, FR14
**NFRs addressed:** NFR-P3, NFR-P4, NFR-I3

### Epic 5: UI Polish, Accessibility & Developer Documentation
End User has a responsive, accessible, keyboard-navigable experience across all devices. Technical Reviewer can evaluate code quality through comprehensive documentation and BMAD artifacts.
**FRs covered:** FR18, FR26, FR27, FR28, FR29, FR30
**NFRs addressed:** NFR-M3

## Epic 1: Project Initialization & Core Infrastructure

Developer can clone the repository, build, and run all project components. Core domain model, Clean Architecture layers, and Azure service connections are in place.

### Story 1.1: Solution Scaffold & Project Initialization

As a **Developer**,
I want to initialize a monorepo with all project scaffolds (Angular SPA, .NET Clean Architecture solution, Azure Function),
So that I have a buildable, runnable foundation for all subsequent development.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** the developer runs the initialization commands from Architecture Doc
**Then** the following projects exist and compile successfully:
- `src/EventHub.Domain/` (.NET 8 class library, zero dependencies)
- `src/EventHub.Application/` (.NET 8 class library, references Domain)
- `src/EventHub.Infrastructure/` (.NET 8 class library, references Application)
- `src/EventHub.Api/` (ASP.NET Core 8 Web API, references Application + Infrastructure)
- `src/EventHub.Function/` (Azure Function .NET 8 isolated, references Application + Infrastructure)
- `tests/EventHub.Api.Tests/` (xUnit, references Api)
- `tests/EventHub.Function.Tests/` (xUnit, references Function)
- `src/frontend/` (Angular 19 CLI workspace with SCSS, Angular Material, ESLint)
**And** `EventHub.sln` includes all projects with correct references
**And** `dotnet build` succeeds with zero errors
**And** `ng build` succeeds in the frontend workspace
**And** `.editorconfig` and `.gitignore` are present at repository root

### Story 1.2: Domain Model & Application Layer

As a **Developer**,
I want the core domain entities, DTOs, and interface contracts defined,
So that all layers have a shared vocabulary and dependency contracts to build against.

**Acceptance Criteria:**

**Given** the solution from Story 1.1
**When** the Domain and Application layers are implemented
**Then** `EventHub.Domain` contains:
- `Entities/Event.cs` with properties: `Id` (Guid), `UserId` (string), `Type` (EventType), `Description` (string), `CreatedAt` (DateTime UTC)
- `Enums/EventType.cs` with values: `PageView`, `Click`, `Purchase`
**And** `EventHub.Application` contains:
- `DTOs/CreateEventRequest.cs` with DataAnnotations: `[Required]`, `[MaxLength(100)]` on UserId, `[Required][EnumDataType]` on Type, `[Required][MaxLength(500)]` on Description
- `DTOs/EventResponse.cs` matching API response contract
- `DTOs/EventFilter.cs` with query params: Type, UserId, Description, From, To, Page, PageSize, SortBy, SortDir
- `DTOs/PagedResult.cs` generic: `{ Items, TotalCount, Page, PageSize }`
- `Messages/EventMessage.cs` for Service Bus contract
- `Interfaces/IEventRepository.cs` with `GetAllAsync(EventFilter)` and `CreateAsync(Event)`
- `Interfaces/IServiceBusPublisher.cs` with `PublishAsync(EventMessage)`
**And** Domain project has zero external dependencies
**And** Application references only Domain
**And** `dotnet build` succeeds

### Story 1.3: Infrastructure Layer & Database Setup

As a **Developer**,
I want EF Core database access, repository implementation, and Service Bus publisher in the Infrastructure layer,
So that the application has concrete data persistence and messaging capabilities.

**Acceptance Criteria:**

**Given** the Domain and Application layers from Story 1.2
**When** the Infrastructure layer is implemented
**Then** `EventHub.Infrastructure` contains:
- `Data/EventHubDbContext.cs` with `DbSet<Event>`
- `Data/Configurations/EventConfiguration.cs` using `IEntityTypeConfiguration<Event>` with: GUID primary key, string column types with max lengths, EventType stored as string, indexes on `CreatedAt`, `UserId`, `Type`
- `Repositories/EventRepository.cs` implementing `IEventRepository` with IQueryable-based filtering, sorting (`OrderBy`/`OrderByDescending`), and pagination (`Skip`/`Take`)
- `Services/ServiceBusPublisher.cs` implementing `IServiceBusPublisher` using `Azure.Messaging.ServiceBus` SDK
- `Extensions/ServiceCollectionExtensions.cs` with `AddInfrastructure(IConfiguration)` registering DbContext, repositories, and services
**And** an initial EF Core migration is generated
**And** Infrastructure references only Application (not Api or Function)
**And** `dotnet build` succeeds

### Story 1.4: API Scaffold & Configuration

As a **Developer**,
I want a configured ASP.NET Core Web API with middleware pipeline, CORS, HTTPS, structured logging, and controller stubs,
So that the API is runnable and ready for endpoint implementation.

**Acceptance Criteria:**

**Given** the Infrastructure layer from Story 1.3
**When** the API project is configured
**Then** `Program.cs` (composition root) includes:
- `AddApplication()` and `AddInfrastructure(config)` DI registration
- Serilog with Console sink configured
- CORS: permissive for `localhost:4200` in Development, restricted in Production (NFR-S2)
- HTTPS redirection enabled (NFR-S1)
- Swagger/OpenAPI enabled in Development
**And** `Controllers/EventsController.cs` exists with `[ApiController][Route("api/events")]` and empty `[HttpPost]` / `[HttpGet]` stubs returning `NotImplemented`
**And** `Controllers/NegotiateController.cs` exists with `[Route("api/negotiate")]` stub
**And** `Middleware/ExceptionHandlingMiddleware.cs` catches unhandled exceptions and returns `{"errors": {"server": "message"}}` with Serilog logging
**And** `appsettings.json` and `appsettings.Development.json` contain connection string placeholders for Azure SQL and Service Bus (NFR-S3, NFR-M2)
**And** `dotnet run` starts the API on `https://localhost:5001` with Swagger UI accessible

### Story 1.5: Azure Function Scaffold

As a **Developer**,
I want a configured Azure Function project with Service Bus trigger stub and structured logging,
So that the async event processor is runnable and ready for implementation.

**Acceptance Criteria:**

**Given** the Infrastructure layer from Story 1.3
**When** the Function project is configured
**Then** `EventHub.Function` uses .NET 8 isolated worker model
**And** `Functions/ProcessEvent.cs` has a `[ServiceBusTrigger]` method with empty processing stub that logs the received message
**And** `Services/EventProcessingService.cs` exists with stub for DB write + idempotency logic
**And** `Program.cs` registers `AddApplication()` and `AddInfrastructure(config)` via DI
**And** Serilog with Console sink is configured
**And** `host.json` and `local.settings.json` contain connection string placeholders for Azure SQL, Service Bus, and Azure SignalR Service (NFR-S3)
**And** `func start` runs the Function on `localhost:7071` without errors

### Story 1.6: Angular SPA Foundation & Glass Theme

As a **Developer**,
I want the Angular workspace configured with Angular Material, custom dark Glass theme, NgRx store shell, and SCSS architecture,
So that the frontend is runnable with the visual foundation ready for feature components.

**Acceptance Criteria:**

**Given** the Angular workspace from Story 1.1
**When** the SPA foundation is configured
**Then** Angular Material is installed with a custom dark theme via `mat.define-dark-theme()`
**And** `src/styles/` contains:
- `_variables.scss` with CSS custom properties (`--bg-base: #060714`, `--bg-surface: #111111`, `--accent: #7c3aed`, all tokens from UX spec)
- `_glass.scss` with glassmorphism mixin (`backdrop-filter: blur(24px)`, border, border-radius)
- `_typography.scss` with Inter + JetBrains Mono `@font-face` declarations
- `_material-overrides.scss` with Angular Material dark Glass theme overrides
**And** `styles.scss` imports all partials
**And** `index.html` includes Google Fonts CDN links for Inter and JetBrains Mono
**And** `app/shared/components/glass-panel/` component exists with `ng-content` projection, default and compact variants
**And** NgRx store is bootstrapped in `app.config.ts` with empty slices: `events`, `submission`, `signalr`
**And** `environments/environment.ts` points to `https://localhost:5001`
**And** `environments/environment.prod.ts` has production placeholder
**And** `app.component` renders a basic shell: header with "Event Hub" title, placeholder for SignalR status dot, and main content area wrapped in glass panel
**And** `ng serve` starts on `localhost:4200` showing the Glass-themed shell
**And** Page background is `#060714` with violet/navy radial gradients per UX spec

## Epic 2: Event Submission Pipeline (Full Stack)

End User can submit events via the Angular form with validation, and events are persisted through the full async pipeline (Form → API → Service Bus → Function → Azure SQL). API Consumer can submit events via POST endpoint.

### Story 2.1: API POST Endpoint & Server-Side Validation

As a **API Consumer**,
I want to submit a new event via `POST /api/events` with server-side validation,
So that valid events are accepted into the async pipeline and invalid requests are rejected with clear error details.

**Acceptance Criteria:**

**Given** a valid `CreateEventRequest` with UserId, Type, and Description
**When** the API Consumer sends `POST /api/events`
**Then** the system generates a new `Id` (GUID) and `CreatedAt` (UTC timestamp)
**And** the system publishes an `EventMessage` to Azure Service Bus queue via `IServiceBusPublisher`
**And** the API returns `201 Created` with an `EventResponse` body containing `id`, `userId`, `type`, `description`, `createdAt`

**Given** a request with missing or invalid fields (empty UserId, invalid Type, missing Description)
**When** the API Consumer sends `POST /api/events`
**Then** the API returns `400 Bad Request` with structured JSON: `{"errors": {"field": "message"}}` (FR23)
**And** the Service Bus is NOT called — pipeline stays clean

**Given** an unexpected server error during processing
**When** the API Consumer sends `POST /api/events`
**Then** `ExceptionHandlingMiddleware` catches the error, logs it via Serilog (FR24), and returns `500` with `{"errors": {"server": "An unexpected error occurred."}}`

### Story 2.2: Azure Function Event Processing & DB Persistence

As a **System**,
I want the Azure Function to consume events from Service Bus and persist them to Azure SQL with idempotency,
So that every submitted event is reliably stored exactly once.

**Acceptance Criteria:**

**Given** an `EventMessage` arrives on the Service Bus queue
**When** the `ProcessEvent` function triggers
**Then** `EventProcessingService` maps the message to a Domain `Event` entity and calls `IEventRepository.CreateAsync()`
**And** the event is persisted to Azure SQL with all fields (Id, UserId, Type, Description, CreatedAt)

**Given** a duplicate `EventMessage` arrives (same Id, at-least-once delivery)
**When** the `ProcessEvent` function triggers
**Then** the system catches the UNIQUE constraint violation on `Event.Id`
**And** logs "Duplicate event {Id} ignored" via Serilog (graceful no-op, NFR-I2)
**And** no duplicate record is written to the database

**Given** an unrecoverable error during event processing
**When** the `ProcessEvent` function triggers
**Then** the error is logged via Serilog with full context (FR24)
**And** the message is moved to dead-letter queue after retry exhaustion (NFR-I1)

### Story 2.3: NgRx Submission Store & Event Service

As a **Developer**,
I want the Angular submission NgRx store slice and EventService HTTP integration,
So that form submission state is managed predictably and API calls are centralized.

**Acceptance Criteria:**

**Given** the NgRx store shell from Epic 1
**When** the submission store slice is implemented
**Then** `store/submission/submission.actions.ts` contains: `submitEvent`, `submitEventSuccess`, `submitEventFailure`
**And** `store/submission/submission.reducer.ts` manages state: `{ status: 'idle' | 'submitting' | 'success' | 'failure', error: string | null }`
**And** `store/submission/submission.effects.ts` handles: `submitEvent` → `EventService.create()` → success/failure actions
**And** `core/services/event.service.ts` implements `create(request: CreateEventRequest): Observable<EventResponse>` calling `POST ${environment.apiUrl}/api/events`
**And** HTTP errors are caught by the effect and dispatched as `submitEventFailure`

### Story 2.4: Event Creation Form Component

As an **End User**,
I want to fill out a form with UserId, Type, and Description to submit a new event,
So that I can create events quickly with clear validation feedback.

**Acceptance Criteria:**

**Given** the Event Hub page is loaded
**When** the End User views the form panel
**Then** the form displays three fields: UserId (text input), Type (mat-select with PageView/Click/Purchase), Description (text input)
**And** UserId field receives focus on page load
**And** the Submit button shows gradient styling (`#7c3aed → #5b21b6`) with glow effect

**Given** the End User leaves a required field empty or exceeds max length
**When** the field loses focus (blur)
**Then** `mat-error` displays inline validation message below the field (e.g., "Required", "Must be 100 characters or fewer")
**And** the field border changes to `--error` color (#ef4444)

**Given** all fields are valid
**When** the End User clicks Submit or presses Enter from the Description field
**Then** the form dispatches `[Event Form] Submit Event` NgRx action with the form values
**And** the Submit button becomes disabled with `aria-busy="true"` during submission

**Given** submission succeeds (API returns 201)
**When** `submitEventSuccess` action fires
**Then** the form resets to empty and UserId field receives focus

**Given** submission fails (API returns 4xx/5xx)
**When** `submitEventFailure` action fires
**Then** the form preserves all entered values (no data loss)
**And** the Submit button re-enables immediately

### Story 2.5: Form Submission Feedback (Toast Notifications)

As an **End User**,
I want to see clear toast notifications after submitting an event,
So that I know whether my event was accepted or what went wrong.

**Acceptance Criteria:**

**Given** a successful event submission (API returns 201 Created)
**When** `submitEventSuccess` action fires
**Then** a success toast appears via `MatSnackBar` with message "Event submitted successfully"
**And** the toast has Glass theme styling: dark background (`rgba(17,17,17,0.95)`), `backdrop-filter: blur(16px)`, green left border
**And** the toast auto-dismisses after 3 seconds

**Given** a failed event submission (API returns 400 or 500)
**When** `submitEventFailure` action fires
**Then** an error toast appears with message "Failed to submit event. Please try again." (for 500) or specific field errors (for 400)
**And** the toast has red left border (`#ef4444`)
**And** the toast shows for 5 seconds with a dismiss button

**Given** a network error occurs
**When** the HTTP request fails with no response
**Then** an error toast appears with "Connection error. Check your network."
**And** the toast shows for 5 seconds with a dismiss button

## Epic 3: Event Discovery & Table Display (Full Stack)

End User can view stored events in a table with filtering, sorting, and pagination. API Consumer can retrieve filtered events via GET endpoint.

### Story 3.1: API GET Endpoint with Server-Side Filtering, Sorting & Pagination

As an **API Consumer**,
I want to retrieve stored events via `GET /api/events` with query parameters for filtering, sorting, and pagination,
So that I can access exactly the data I need without over-fetching.

**Acceptance Criteria:**

**Given** events exist in the database
**When** the API Consumer sends `GET /api/events` with no parameters
**Then** the API returns a `PagedResult<EventResponse>` with `{ items, totalCount, page: 1, pageSize: 20 }` sorted by `createdAt` descending

**Given** the API Consumer provides filter parameters `?type=Click&userId=olena&description=checkout&from=2026-01-01&to=2026-12-31`
**When** the request is processed
**Then** only events matching ALL specified filters are returned (AND logic)
**And** Type filter uses exact match, UserId uses exact match, Description uses case-insensitive substring (contains) matching
**And** date range filters on `createdAt >= from AND createdAt <= to`

**Given** the API Consumer provides pagination parameters `?page=2&pageSize=10`
**When** the request is processed
**Then** the response contains items for page 2 (items 11–20) with correct `totalCount` reflecting filtered dataset size

**Given** the API Consumer provides sort parameters `?sortBy=userId&sortDir=asc`
**When** the request is processed
**Then** the response items are sorted by `userId` ascending
**And** sortable fields are: `id`, `userId`, `type`, `description`, `createdAt`

**Given** no events match the filter criteria
**When** the request is processed
**Then** the API returns `{ items: [], totalCount: 0, page: 1, pageSize: 20 }`

### Story 3.2: NgRx Events Store & Data Fetching

As a **Developer**,
I want the Angular events NgRx store slice with reactive data fetching on filter, sort, and page changes,
So that the table state is predictable and API calls are debounced efficiently.

**Acceptance Criteria:**

**Given** the NgRx store shell from Epic 1
**When** the events store slice is implemented
**Then** `store/events/events.actions.ts` contains: `loadEvents`, `loadEventsSuccess`, `loadEventsFailure`, `changeFilter`, `changePage`, `changeSort`
**And** `store/events/events.reducer.ts` manages state: `{ items: Event[], totalCount: number, loading: boolean, error: string | null, filters: EventFilter, pagination: { page, pageSize }, sort: { sortBy, sortDir } }`
**And** default state has: `page: 1, pageSize: 20, sortBy: 'createdAt', sortDir: 'desc'`, empty filters

**Given** a `changeFilter` action is dispatched
**When** the events effect processes it
**Then** it waits `debounceTime(300ms)` before triggering an API call via `EventService.getAll(filter)`
**And** pagination resets to page 1

**Given** a `changePage` or `changeSort` action is dispatched
**When** the events effect processes it
**Then** it triggers an API call immediately (no debounce)

**Given** `loadEvents` is dispatched
**When** the effect fires
**Then** `loading` is set to `true` in the reducer
**And** on success, items and totalCount are updated and `loading` is set to `false`
**And** `core/services/event.service.ts` implements `getAll(filter: EventFilter): Observable<PagedResult<Event>>` calling `GET ${environment.apiUrl}/api/events` with query params

### Story 3.3: Events Table Component

As an **End User**,
I want to view stored events in a sortable, paginated table with all event fields displayed,
So that I can browse and explore event data efficiently.

**Acceptance Criteria:**

**Given** events are loaded from the API
**When** the table renders
**Then** it displays 5 columns: Id, UserId, Type, Description, CreatedAt
**And** Id column shows truncated GUID (first 8 characters + "…") in JetBrains Mono font with `matTooltip` showing the full GUID on hover
**And** UserId column uses JetBrains Mono font
**And** Type column renders `EventTypeChipComponent` (color-coded pill)
**And** CreatedAt column displays ISO 8601 UTC format in JetBrains Mono font

**Given** the table is displayed
**When** the End User clicks a column header
**Then** `MatSort` toggles sort direction (asc → desc → unsorted → default)
**And** a `changeSort` NgRx action is dispatched
**And** the table re-fetches from the API with new sort params

**Given** the table is displayed
**When** the End User interacts with `mat-paginator`
**Then** page size options are [10, 20, 50] with default 20
**And** paginator shows "Items per page: [20 ▼]  1–20 of N  [‹] [›]"
**And** a `changePage` NgRx action is dispatched on page change

**Given** the page loads for the first time
**When** the events store initializes
**Then** `loadEvents` is dispatched automatically
**And** the table displays the first page sorted by CreatedAt descending

### Story 3.4: EventTypeChip Component

As an **End User**,
I want event types displayed as color-coded pill chips in the table,
So that I can quickly scan and identify event types at a glance.

**Acceptance Criteria:**

**Given** an event with Type "PageView"
**When** the chip renders
**Then** it displays "PageView" with background `#1e3a5f`, text color `#60a5fa`, border `1px solid #3b82f6`

**Given** an event with Type "Click"
**When** the chip renders
**Then** it displays "Click" with background `#451a03`, text color `#fbbf24`, border `1px solid #f59e0b`

**Given** an event with Type "Purchase"
**When** the chip renders
**Then** it displays "Purchase" with background `#052e16`, text color `#4ade80`, border `1px solid #22c55e`

**Given** any event type chip
**When** it renders
**Then** it has pill shape (`border-radius: 20px`) and `aria-label="Event type: {type}"`

### Story 3.5: Events Filter Bar & Reactive Filtering

As an **End User**,
I want to filter events by Type, UserId, Description, and date range with instant reactive updates,
So that I can quickly narrow down to the events I'm looking for.

**Acceptance Criteria:**

**Given** the filter bar is displayed above the table
**When** the End User types in the UserId filter input
**Then** a `changeFilter` action is dispatched (debounced 300ms) and the table updates with matching results

**Given** the filter bar is displayed
**When** the End User selects a Type from the mat-select dropdown (PageView / Click / Purchase / All)
**Then** a `changeFilter` action is dispatched immediately and the table updates

**Given** the filter bar is displayed
**When** the End User types in the Description filter input
**Then** a `changeFilter` action is dispatched (debounced 300ms) and the table updates with substring-matching results

**Given** the filter bar is displayed
**When** the End User selects a date range via `mat-date-range-input`
**Then** a `changeFilter` action is dispatched and the table shows events within the selected range

**Given** any filter is active
**When** the End User looks at the filter bar
**Then** a "Clear all filters" ghost button (`mat-button`) is visible
**And** clicking it resets all filters to empty and dispatches `changeFilter` with empty values

**Given** any filter changes
**When** the events effect processes the change
**Then** pagination resets to page 1 automatically

### Story 3.6: Loading & Empty States

As an **End User**,
I want to see clear loading indicators and helpful empty states,
So that I always know what the system is doing and what to do next.

**Acceptance Criteria:**

**Given** the events store has `loading: true`
**When** the table area renders
**Then** a `mat-progress-bar` with `mode="indeterminate"` spans the full table width above the table header
**And** the loading indicator appears within 200ms of the data fetch initiation (NFR-P5)

**Given** the events load completes with 0 events and no filters are active
**When** the table area renders
**Then** `EmptyStateComponent` displays in `no-data` state: outlined icon, "No events yet" title, "Submit your first event using the form on the left." subtitle
**And** the component has `role="status"` with descriptive text for screen readers

**Given** filters are active and 0 events match
**When** the table area renders
**Then** `EmptyStateComponent` displays in `no-results` state: search-off icon, "No events match your filters" title, and a focusable "Clear all filters" ghost button
**And** clicking the button resets all filters and returns to the full event list

## Epic 4: Real-Time Updates & Live Experience

End User sees newly persisted events appear automatically without page refresh. The flying chip animation completes the signature "send → watch → arrive" experience.

### Story 4.1: Azure Function SignalR Output Binding & Negotiate Endpoint

As a **System**,
I want the Azure Function to broadcast new events via Azure SignalR Service after DB persistence, and the API to provide a negotiate endpoint for client connections,
So that all connected clients receive real-time event notifications.

**Acceptance Criteria:**

**Given** `ProcessEvent` successfully persists an event to Azure SQL
**When** the function completes processing
**Then** it returns a `SignalRMessageAction` with target `"newEvent"` and the full `Event` object as argument
**And** Azure SignalR Service delivers the message to all connected clients

**Given** an Angular client needs to establish a SignalR connection
**When** the client sends `POST /api/negotiate`
**Then** `NegotiateController` returns SignalR connection info (endpoint URL + access token) from the Azure SignalR Service configuration
**And** the response enables the client to connect via WebSocket

**Given** the Azure SignalR Service connection string is configured in `appsettings.json` (API) and `local.settings.json` (Function)
**When** both services start
**Then** the API can serve negotiate requests and the Function can send SignalR messages without additional configuration

### Story 4.2: Angular SignalR Service & NgRx Integration

As an **End User**,
I want the application to maintain a persistent SignalR connection and automatically refresh the table when new events arrive,
So that I see live data without manual page refresh.

**Acceptance Criteria:**

**Given** the Angular app initializes
**When** `SignalRService` starts
**Then** it negotiates a connection via `POST ${environment.apiUrl}/api/negotiate`
**And** establishes a WebSocket connection to Azure SignalR Service
**And** dispatches `[SignalR] Connected` NgRx action

**Given** an active SignalR connection
**When** a `newEvent` message is received from the server
**Then** `SignalRService` dispatches `[SignalR] Event Received` NgRx action with the event payload
**And** the `signalr` effect checks if the user is on page 1: if yes, dispatches `loadEvents` to re-fetch current data

**Given** the SignalR connection drops unexpectedly
**When** the client detects disconnect
**Then** it dispatches `[SignalR] Reconnecting` and attempts automatic reconnection with exponential backoff intervals: 0s, 2s, 10s, 30s (NFR-I3)
**And** on successful reconnect, dispatches `[SignalR] Connected`
**And** on permanent failure, dispatches `[SignalR] Disconnected`

**Given** the NgRx `signalr` store slice
**When** connection status changes
**Then** the reducer updates `connectionStatus: 'connected' | 'reconnecting' | 'disconnected'`

### Story 4.3: SignalR Status Dot Component

As an **End User**,
I want to see a visual indicator of the real-time connection status in the page header,
So that I know whether live updates are active.

**Acceptance Criteria:**

**Given** the SignalR connection is established
**When** the status dot renders
**Then** it shows a green dot (`#22c55e`) with glow (`box-shadow: 0 0 8px #22c55e`) and label "Connected"

**Given** the SignalR connection is reconnecting
**When** the status dot renders
**Then** it shows an amber dot (`#f59e0b`) with pulsing glow animation and label "Reconnecting…"

**Given** the SignalR connection is disconnected
**When** the status dot renders
**Then** it shows a grey dot (`#4a4a4a`) with no glow and label "Disconnected"

**Given** any connection state
**When** the dot renders
**Then** it has `role="status"` and `aria-live="polite"` for screen reader announcements
**And** a `matTooltip` shows full connection status message on hover

### Story 4.4: Flying Chip Animation

As an **End User**,
I want to see a visual chip animate from the form to the table when I submit an event,
So that I experience the async pipeline as a tangible, satisfying journey.

**Acceptance Criteria:**

**Given** the End User clicks Submit with valid form data
**When** the submission NgRx action fires
**Then** a `FlyingChipComponent` is created programmatically via `ViewContainerRef.createComponent()`
**And** the chip displays event Type label + UserId (truncated to 12 chars) with Glass styling (violet semi-transparent background, `backdrop-filter: blur(8px)`, pill shape)

**Given** the chip is created
**When** the materializing phase begins
**Then** the chip scales from 0 to 1 at the Submit button's position (via `getBoundingClientRect()`) over 150ms with `ease-out`

**Given** the chip has materialized
**When** the in-flight phase begins
**Then** the chip arcs toward the table header position over 400–600ms using spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`
**And** the chip has `opacity: 0.85` and `pointer-events: none` during flight

**Given** the chip reaches the table area and SignalR has NOT yet fired
**When** the hovering phase begins
**Then** the chip hovers above the table header with a subtle pulse animation (scale 0.97↔1.03) until the SignalR event arrives

**Given** the SignalR `newEvent` is received
**When** the landing phase begins
**Then** the chip snaps down with a bounce effect (300ms, spring easing) then dissolves (200ms, `ease-in`, opacity 1→0)
**And** the chip is removed from the DOM after dissolve completes

**Given** the user has `prefers-reduced-motion: reduce` enabled
**When** an event is submitted
**Then** the flying chip animation is skipped entirely
**And** the new row appears with a simple fade-in instead

**Given** any animation state
**When** the chip is present
**Then** it has `role="status"` with `aria-label="Event submitting"`

### Story 4.5: Row Insert Animation & Context-Aware Feedback

As an **End User**,
I want newly arrived events to animate into the table with contextual feedback based on my current view,
So that I always know a new event was created regardless of my filter and pagination state.

**Acceptance Criteria:**

**Given** a SignalR `newEvent` arrives and the user is on page 1 with no filters (or filters that match the new event)
**When** the table re-fetches and the new row appears
**Then** the row unfolds top-to-bottom via max-height animation (~300ms, `ease-out`)
**And** the row highlights with violet glow (`rgba(124,58,237,0.12)`) for ~1.5s then fades to normal

**Given** a SignalR `newEvent` arrives and the user has active filters that EXCLUDE the new event
**When** the event is received
**Then** the flying chip completes its arc to the table header area, bounces, and dissolves (no row to land into)
**And** an info toast appears: "New event added — hidden by current filters" with a "Clear filters" action link (violet left border)
**And** clicking "Clear filters" resets all filters and shows the full event list

**Given** a SignalR `newEvent` arrives and the user is on page 2 or later
**When** the event is received
**Then** the flying chip completes its animation (lands at table header, bounces, dissolves)
**And** an info toast appears: "New event added" with a "Go to page 1" action link
**And** the `totalCount` in the paginator updates
**And** no automatic page jump occurs — user stays on their current page

**Given** `prefers-reduced-motion: reduce` is enabled
**When** a new row appears
**Then** the row appears instantly without unfold animation
**And** a static violet tint shows for 1s then clears instantly

## Epic 5: UI Polish, Accessibility & Developer Documentation

End User has a responsive, accessible, keyboard-navigable experience across all devices. Technical Reviewer can evaluate code quality through comprehensive documentation and BMAD artifacts.

### Story 5.1: Responsive Layout (3 Breakpoints)

As an **End User**,
I want the application to adapt its layout for desktop, tablet, and mobile screen sizes,
So that I can use Event Hub comfortably on any device.

**Acceptance Criteria:**

**Given** a desktop viewport (≥1024px)
**When** the page renders
**Then** the layout is side-by-side: form panel (380px fixed) on the left, table panel (flex: 1) on the right
**And** all 5 table columns are visible (Id, UserId, Type, Description, CreatedAt)
**And** the flying chip animation plays with full arc trajectory
**And** max-width is 1280px centered with 32px horizontal padding

**Given** a tablet viewport (768px–1023px)
**When** the page renders
**Then** the layout is compressed side-by-side: form panel (260px) on the left, table panel on the right
**And** Id and Description columns are hidden from the table
**And** the filter bar collapses into a "Filters" toggle button that expands/collapses the filter inputs
**And** the flying chip animation plays with a shorter arc

**Given** a mobile viewport (<768px)
**When** the page renders
**Then** the layout is stacked: form panel full-width on top, table panel full-width below
**And** the Submit button is full-width
**And** the table has `overflow-x: auto` with `min-width: 560px` for horizontal scrolling
**And** the flying chip animation is replaced by form fade-out → row fade-in
**And** filters are behind a "Filters" icon-button with active filter count badge

**Given** any viewport
**When** the layout responds to breakpoint changes
**Then** `BreakpointObserver` updates `displayedColumns` dynamically
**And** CSS transitions use mobile-first media queries (`@media (min-width: 768px)`, `@media (min-width: 1024px)`)

### Story 5.2: Keyboard Navigation & Focus Management

As an **End User**,
I want to operate all primary interactions via keyboard with visible focus indicators,
So that I can use Event Hub efficiently without a mouse.

**Acceptance Criteria:**

**Given** the page is loaded
**When** the End User presses Tab
**Then** focus moves in order: UserId → Type → Description → Submit → filter inputs → table sort headers → paginator controls

**Given** the End User is focused on the Description field
**When** they press Enter
**Then** the form submits (equivalent to clicking Submit button)

**Given** the End User is focused on a filter text input
**When** they press Escape
**Then** the filter input clears its value

**Given** any interactive element receives focus
**When** focus is applied
**Then** a visible focus ring appears: `outline: 2px solid #7c3aed; outline-offset: 2px`

**Given** the Submit button is disabled during async cycle
**When** it receives focus via Tab
**Then** the button still shows focus ring and `aria-busy="true"` is announced by screen readers

**Given** sort column headers in the table
**When** the End User presses Enter or Space on a focused header
**Then** the sort direction toggles (same behavior as click)

**Given** paginator previous/next buttons
**When** the End User presses Enter or Space
**Then** the page navigates accordingly

### Story 5.3: Swagger/OpenAPI Documentation

As an **API Consumer**,
I want comprehensive API documentation accessible via Swagger UI,
So that I can understand and integrate with Event Hub API without reading source code.

**Acceptance Criteria:**

**Given** the API is running in Development mode
**When** the API Consumer navigates to `/swagger`
**Then** Swagger UI displays all available endpoints: `POST /api/events`, `GET /api/events`, `POST /api/negotiate`

**Given** the Swagger UI is open
**When** the API Consumer inspects `POST /api/events`
**Then** the request schema shows `CreateEventRequest` with field descriptions, types, and validation constraints
**And** the response schemas show `EventResponse` (201) and error format `{"errors": {...}}` (400, 500)

**Given** the Swagger UI is open
**When** the API Consumer inspects `GET /api/events`
**Then** all query parameters are documented: `type`, `userId`, `description`, `from`, `to`, `page`, `pageSize`, `sortBy`, `sortDir`
**And** the response schema shows `PagedResult<EventResponse>`

**Given** the Swagger documentation
**When** reviewed for completeness
**Then** XML comments on controller methods provide operation summaries and parameter descriptions

### Story 5.4: README & Architecture Documentation

As a **Technical Reviewer**,
I want comprehensive README documentation with architecture overview, local setup instructions, and links to decision rationale,
So that I can understand the full system without asking the developer any questions.

**Acceptance Criteria:**

**Given** the repository root
**When** the reviewer opens `README.md`
**Then** it contains: project overview, architecture diagram (text or Mermaid), technology stack with versions, and the full E2E data flow description

**Given** the README
**When** the reviewer looks for local setup
**Then** step-by-step instructions cover: prerequisites (Node 22, .NET 8 SDK, Azure CLI, Azure Functions Core Tools), Azure resource provisioning, connection string configuration, and commands to run all 3 components (`ng serve`, `dotnet run`, `func start`)

**Given** the README
**When** the reviewer looks for architectural decisions
**Then** each of the 6 ADRs is summarized with trade-off explanation and linked to the Architecture Doc
**And** the reviewer can trace database choice, message broker, real-time strategy, project structure, state management, and pagination decisions to documented rationale (FR26, FR27)

**Given** the `_bmad-output/` folder
**When** the reviewer inspects it
**Then** Project Brief, PRD, Architecture Doc, and UX Design Spec are all present and accessible (FR28)
**And** README includes direct links to each BMAD artifact

### Story 5.5: Code Quality & Linting Configuration

As a **Developer**,
I want linting and code analysis configured with zero-error policies,
So that code quality is enforced automatically at build time.

**Acceptance Criteria:**

**Given** the Angular workspace
**When** `ng lint` is executed
**Then** ESLint runs with zero errors across all TypeScript and HTML files

**Given** the .NET solution
**When** `dotnet build` is executed
**Then** a `Directory.Build.props` at solution root enables `TreatWarningsAsErrors` and `EnforceCodeStyleInBuild`
**And** the build completes with zero warnings

**Given** both linting configurations
**When** a developer introduces a code style violation
**Then** the build or lint step fails, preventing the violation from being committed

**Given** the `.editorconfig` at repository root
**When** any editor with EditorConfig support opens a file
**Then** consistent formatting rules (indentation, line endings, charset) are applied across both .NET and Angular codebases
