# Story 4.1: Azure Function SignalR Output Binding & Negotiate Endpoint

Status: review
Story-Key: 4-1-azure-function-signalr-output-binding-and-negotiate-endpoint
Epic: 4 — Real-Time Updates & Live Experience
Date: 2026-02-24
FRs: FR13, FR14
NFRs: NFR-P3, NFR-P4, NFR-I3

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **System**,
I want the Azure Function to broadcast new events via Azure SignalR Service after DB persistence, and the API to provide a negotiate endpoint for client connections,
So that all connected clients receive real-time event notifications.

## Acceptance Criteria

1. **Given** `ProcessEvent` successfully persists an event to Azure SQL
   **When** the function completes processing
   **Then** it returns a `SignalRMessageAction` with target `"newEvent"` and the full `Event` object as argument
   **And** Azure SignalR Service delivers the message to all connected clients

2. **Given** an Angular client needs to establish a SignalR connection
   **When** the client sends `POST /api/negotiate`
   **Then** `NegotiateController` returns SignalR connection info (endpoint URL + access token) from the Azure SignalR Service configuration
   **And** the response enables the client to connect via WebSocket

3. **Given** the Azure SignalR Service connection string is configured in `appsettings.json` (API) and `local.settings.json` (Function)
   **When** both services start
   **Then** the API can serve negotiate requests and the Function can send SignalR messages without additional configuration

## Tasks / Subtasks

- [x] Task 1: Add SignalR NuGet packages (AC: #1, #2, #3)
  - [x] 1.1 Add `Microsoft.Azure.Functions.Worker.Extensions.SignalRService` to `src/EventHub.Function/EventHub.Function.csproj`
  - [x] 1.2 Add `Microsoft.Azure.SignalR.Management` to `src/EventHub.Api/EventHub.Api.csproj`

- [x] Task 2: Update EventProcessingService to return persisted Event (AC: #1)
  - [x] 2.1 Change `EventProcessingService.ProcessAsync()` return type from `Task` to `Task<Event?>` — return the persisted `Event` entity on success, `null` on duplicate (idempotent no-op)
  - [x] 2.2 Update the method body: after `_repository.CreateAsync(entity)` succeeds, return the mapped `Event` entity
  - [x] 2.3 On duplicate (caught exception), return `null` instead of just logging
  - [x] 2.4 Update any existing tests for `EventProcessingService` to expect the new return type

- [x] Task 3: Add SignalR Output Binding to ProcessEvent Function (AC: #1)
  - [x] 3.1 Change `ProcessEvent.Run()` method signature:
    - Return type: `Task<SignalRMessageAction?>` (nullable — no message on duplicate)
    - Add attribute: `[SignalROutput(HubName = "eventHub", ConnectionStringSetting = "AzureSignalRConnectionString")]`
  - [x] 3.2 After `_processingService.ProcessAsync(eventMessage)` returns:
    - If result is non-null (event persisted): construct and return `new SignalRMessageAction("newEvent") { Arguments = new object[] { eventResponse } }` where `eventResponse` is the Event mapped to the API response format (id, userId, type, description, createdAt)
    - If result is null (duplicate): return `null` (no SignalR broadcast)
  - [x] 3.3 Map the persisted `Event` entity to the response format expected by the Angular client (camelCase JSON: `{ id, userId, type, description, createdAt }`) — use a simple anonymous object or create a mapping helper
  - [x] 3.4 Add `using Microsoft.Azure.Functions.Worker.Extensions.SignalRService;` to imports

- [x] Task 4: Implement NegotiateController in API (AC: #2)
  - [x] 4.1 Register `ServiceManager` as singleton in `Program.cs`:
    ```
    builder.Services.AddSingleton(new ServiceManagerBuilder()
        .WithOptions(o => o.ConnectionString = builder.Configuration["AzureSignalRConnectionString"])
        .BuildServiceManager());
    ```
  - [x] 4.2 Update `NegotiateController` constructor to inject `ServiceManager`
  - [x] 4.3 Implement `Negotiate()` method:
    - Create `ServiceHubContext` via `_serviceManager.CreateHubContextAsync("eventHub")`
    - Call `hubContext.NegotiateAsync()` to get connection info
    - Return `Ok(negotiationResponse)` with endpoint URL + access token
    - Dispose `ServiceHubContext` properly (or cache as singleton)
  - [x] 4.4 Replace the existing `501 NotImplemented` stub with real implementation
  - [x] 4.5 Ensure CORS allows the negotiate endpoint (already configured for `localhost:4200` — verify `AllowCredentials()` is present)

- [x] Task 5: Add SignalR Connection String Configuration (AC: #3)
  - [x] 5.1 Add `"AzureSignalRConnectionString": ""` to `src/EventHub.Api/appsettings.json`
  - [x] 5.2 Add `"AzureSignalRConnectionString": ""` to `src/EventHub.Api/appsettings.Development.json`
  - [x] 5.3 Verify `"AzureSignalRConnectionString"` key already exists in `src/EventHub.Function/local.settings.json` (confirmed: present with empty value)
  - [x] 5.4 Add a comment in README or dev notes: actual connection string must be set to a real Azure SignalR Service endpoint before running

- [x] Task 6: Unit Tests — ProcessEvent SignalR Output (AC: #1)
  - [x] 6.1 Create or update `tests/EventHub.Function.Tests/Functions/ProcessEventTests.cs`
  - [x] 6.2 Test: when `ProcessAsync` returns a valid Event, `Run()` returns a `SignalRMessageAction` with target `"newEvent"` and correct payload
  - [x] 6.3 Test: when `ProcessAsync` returns null (duplicate), `Run()` returns null (no SignalR message)
  - [x] 6.4 Test: SignalR payload contains all expected fields (id, userId, type, description, createdAt) in correct format
  - [x] 6.5 Update existing `EventProcessingServiceTests` for new `Task<Event?>` return type

- [x] Task 7: Unit Tests — NegotiateController (AC: #2)
  - [x] 7.1 Update `tests/EventHub.Api.Tests/Controllers/NegotiateControllerTests.cs`
  - [x] 7.2 Replace existing 501 test with new tests
  - [x] 7.3 Test: `Negotiate()` returns `200 OK` with connection info object (mock `ServiceManager`)
  - [x] 7.4 Test: response contains `url` and `accessToken` properties
  - [x] 7.5 Test: negotiate works without userId (anonymous connections for this MVP)

- [x] Task 8: Verify End-to-End Build
  - [x] 8.1 Run `dotnet build` on EventHub.sln — zero errors
  - [x] 8.2 Run `dotnet test` on all test projects — all tests pass
  - [x] 8.3 Verify `func start` doesn't crash (will show connection warnings if no real SignalR Service configured — acceptable)
  - [x] 8.4 Verify `dotnet run` on API starts without errors

## Dev Notes

### CRITICAL: Architecture Decision — Azure SignalR Service Serverless Mode (ADR-3)

This story implements **ADR-3: Azure SignalR Service (Serverless)** — the most important architectural decision for real-time functionality:

| Component | Responsibility |
|-----------|---------------|
| Azure Function | DB write + SignalR output binding → broadcasts `newEvent` to all clients |
| API | Negotiate endpoint only — returns connection info, no Hub code |
| Azure SignalR Service | Manages WebSocket connections, message routing |
| Angular Client | Connects via negotiate → WebSocket → receives `newEvent` messages |

**Data flow:**
```
ProcessEvent (Function)
  → EventProcessingService.ProcessAsync() → IEventRepository.CreateAsync() → Azure SQL
  → return SignalRMessageAction("newEvent", Event)
    → Azure SignalR Service
      → All connected Angular clients
```

### CRITICAL: Hub Name Consistency

The hub name must be **identical** across all components:
- Function `[SignalROutput]` attribute: `HubName = "eventHub"`
- API negotiate: `_serviceManager.CreateHubContextAsync("eventHub")`
- Angular `@microsoft/signalr` client: connects to the URL returned by negotiate (hub name is embedded in the URL)

**Hub name: `"eventHub"`** — use this exact string everywhere.

### Existing Code State — What Exists vs. What Needs Changes

| File | Current State | Action |
|------|--------------|--------|
| `Function/Functions/ProcessEvent.cs` | Returns `Task` (void), no output binding | **MODIFY:** Change return type to `Task<SignalRMessageAction?>`, add `[SignalROutput]` attribute |
| `Function/Services/EventProcessingService.cs` | Returns `Task` (void) | **MODIFY:** Change to `Task<Event?>`, return persisted entity |
| `Function/EventHub.Function.csproj` | No SignalR package | **MODIFY:** Add SignalR extension package |
| `Function/local.settings.json` | `AzureSignalRConnectionString: ""` key present | **NO CHANGE** — key already exists |
| `Function/host.json` | ServiceBus extension only | **NO CHANGE** — NuGet auto-registers extension |
| `Function/Program.cs` | No SignalR DI | **NO CHANGE** — output binding is declarative |
| `Api/Controllers/NegotiateController.cs` | Returns 501 stub | **MODIFY:** Full negotiate implementation |
| `Api/EventHub.Api.csproj` | No SignalR package | **MODIFY:** Add Management SDK package |
| `Api/Program.cs` | No SignalR services | **MODIFY:** Register `ServiceManager` singleton |
| `Api/appsettings.json` | No SignalR config | **MODIFY:** Add connection string key |
| `Api/appsettings.Development.json` | No SignalR config | **MODIFY:** Add connection string key |
| `Application/` layer | No SignalR interfaces | **NO CHANGE** — output binding is declarative, no abstraction needed |
| `Infrastructure/` layer | No SignalR services | **NO CHANGE** — output binding is declarative |

### NuGet Packages Required

| Project | Package | Version | Purpose |
|---------|---------|---------|---------|
| EventHub.Function | `Microsoft.Azure.Functions.Worker.Extensions.SignalRService` | 2.0.1+ | SignalR output binding (`[SignalROutput]`, `SignalRMessageAction`) |
| EventHub.Api | `Microsoft.Azure.SignalR.Management` | Latest stable | `ServiceManager` for negotiate endpoint |

### SignalR Message Payload Format

The `newEvent` SignalR message must carry the full Event object matching the `EventResponse` DTO format that the Angular client expects:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "olena",
  "type": "PageView",
  "description": "Viewed homepage",
  "createdAt": "2026-02-24T14:30:00Z"
}
```

**IMPORTANT:** The `type` field must be the **string enum name** (e.g., `"PageView"`, not `0`) — matches the API's JSON serialization strategy. Use `JsonStringEnumConverter` or construct the payload manually with `type.ToString()`.

### Implementation Pattern — ProcessEvent with SignalR Output

```csharp
// ProcessEvent.cs — REFERENCE IMPLEMENTATION
[Function("ProcessEvent")]
[SignalROutput(HubName = "eventHub", ConnectionStringSetting = "AzureSignalRConnectionString")]
public async Task<SignalRMessageAction?> Run(
    [ServiceBusTrigger("events", Connection = "ServiceBus")] string messageBody)
{
    _logger.LogInformation("Processing event message");

    var eventMessage = JsonSerializer.Deserialize<EventMessage>(messageBody, _jsonOptions);
    if (eventMessage is null)
    {
        _logger.LogWarning("Failed to deserialize event message");
        return null;
    }

    var persistedEvent = await _processingService.ProcessAsync(eventMessage);

    if (persistedEvent is null)
    {
        // Duplicate event — no broadcast needed
        return null;
    }

    _logger.LogInformation("Broadcasting newEvent for {EventId}", persistedEvent.Id);

    return new SignalRMessageAction("newEvent")
    {
        Arguments = new object[]
        {
            new
            {
                id = persistedEvent.Id,
                userId = persistedEvent.UserId,
                type = persistedEvent.Type.ToString(),
                description = persistedEvent.Description,
                createdAt = persistedEvent.CreatedAt
            }
        }
    };
}
```

### Implementation Pattern — NegotiateController

```csharp
// NegotiateController.cs — REFERENCE IMPLEMENTATION
[ApiController]
[Route("api/negotiate")]
public class NegotiateController : ControllerBase
{
    private readonly ServiceManager _serviceManager;

    public NegotiateController(ServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }

    [HttpPost]
    public async Task<IActionResult> Negotiate(CancellationToken cancellationToken)
    {
        var hubContext = await _serviceManager.CreateHubContextAsync("eventHub", cancellationToken);
        var negotiationResponse = await hubContext.NegotiateAsync(new NegotiationOptions(), cancellationToken);
        await hubContext.DisposeAsync();
        return Ok(negotiationResponse);
    }
}
```

### Implementation Pattern — ServiceManager Registration

```csharp
// In Program.cs — ADD before builder.Build()
builder.Services.AddSingleton(new ServiceManagerBuilder()
    .WithOptions(option =>
    {
        option.ConnectionString = builder.Configuration["AzureSignalRConnectionString"];
    })
    .BuildServiceManager());
```

### Architecture Patterns & Constraints

- **Enforcement rule #4:** Use `async/await` in all C# code — never `.Result` or `.Wait()`
- **Enforcement rule #7:** Use Serilog structured logging — log SignalR broadcast events
- **Enforcement rule #13:** Clean Architecture dependency rule — Function references Application + Infrastructure, NOT directly to API
- **Enforcement rule #14:** Interfaces in `Application/Interfaces/` — NO new interface needed for SignalR (output binding is declarative)
- **ADR-3:** Azure SignalR Service serverless mode — Function sends via output binding, API only negotiate
- **NFR-S3:** Connection strings in environment configuration, never in source code — use `appsettings.json` placeholders
- **NFR-P3:** SignalR notification < 1s after DB write — output binding fires immediately after function return

### Critical Anti-Patterns to Avoid

- **DO NOT** add `AddSignalR()` or `AddAzureSignalR()` in the API `Program.cs` — we are NOT hosting a Hub; we use the Management SDK for serverless negotiate only
- **DO NOT** create a Hub class in the API — ADR-3 explicitly says "No SignalR Hub code"
- **DO NOT** create an `ISignalRNotifier` interface in Application layer — the output binding is declarative and does not need an abstraction
- **DO NOT** send the SignalR message from the API — it must come from the Function after DB persistence
- **DO NOT** use the in-process `IAsyncCollector<SignalRMessage>` pattern — we use isolated worker `SignalRMessageAction` return type
- **DO NOT** hardcode the hub name as a string literal in multiple places — but for MVP, using `"eventHub"` consistently is acceptable
- **DO NOT** broadcast on duplicate events — return `null` from the function when `ProcessAsync` returns `null`
- **DO NOT** use `SignalRConnectionInfo` attribute (in-process model) — use `[SignalROutput]` for sending and `ServiceManager` for negotiate

### EventProcessingService Return Type Change

The current `ProcessAsync()` returns `Task` (void). It needs to return `Task<Event?>` so the Function can use the persisted entity for the SignalR payload:

```csharp
// BEFORE:
public virtual async Task ProcessAsync(EventMessage message) { ... }

// AFTER:
public virtual async Task<Event?> ProcessAsync(EventMessage message)
{
    var entity = new Event { ... }; // map from message
    try
    {
        await _repository.CreateAsync(entity);
        _logger.LogInformation("Event {EventId} persisted", entity.Id);
        return entity; // <-- Return persisted entity
    }
    catch (DbUpdateException ex) when (IsDuplicateKeyException(ex))
    {
        _logger.LogWarning("Duplicate event {EventId} ignored", message.Id);
        return null; // <-- Signal duplicate
    }
}
```

### CORS Considerations

The negotiate endpoint (`POST /api/negotiate`) is already covered by the existing CORS configuration:
- `AllowedOrigins: ["http://localhost:4200"]` in Development
- `AllowCredentials()` is configured (required for SignalR)
- No additional CORS changes needed

### Connection String Configuration Note

Both projects need the same `AzureSignalRConnectionString` value pointing to the same Azure SignalR Service instance:
- **Function:** `local.settings.json` → `Values.AzureSignalRConnectionString` (key already exists, empty)
- **API:** `appsettings.json` / `appsettings.Development.json` → `AzureSignalRConnectionString` (key needs to be added)

**Format:** `Endpoint=https://<name>.service.signalr.net;AccessKey=<key>;Version=1.0;`

For local development, a real Azure SignalR Service instance is required (no local emulator available). Free tier supports 20 concurrent connections and 20,000 messages/day — sufficient for development.

### Project Structure Notes

```
src/EventHub.Function/                        # MODIFY
├── Functions/
│   └── ProcessEvent.cs                       # MODIFY — add [SignalROutput], change return type
├── Services/
│   └── EventProcessingService.cs             # MODIFY — change return type to Task<Event?>
├── host.json                                 # NO CHANGE
├── local.settings.json                       # NO CHANGE — key already exists
├── Program.cs                                # NO CHANGE
└── EventHub.Function.csproj                  # MODIFY — add SignalR extension package

src/EventHub.Api/                             # MODIFY
├── Controllers/
│   ├── EventsController.cs                   # NO CHANGE
│   └── NegotiateController.cs                # MODIFY — full negotiate implementation
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs        # NO CHANGE
├── Program.cs                                # MODIFY — register ServiceManager
├── appsettings.json                          # MODIFY — add connection string key
├── appsettings.Development.json              # MODIFY — add connection string key
└── EventHub.Api.csproj                       # MODIFY — add Management SDK

src/EventHub.Application/                     # NO CHANGE
src/EventHub.Infrastructure/                  # NO CHANGE
src/EventHub.Domain/                          # NO CHANGE

tests/EventHub.Function.Tests/                # MODIFY
└── Functions/
    └── ProcessEventTests.cs                  # CREATE or update — SignalR output tests

tests/EventHub.Api.Tests/                     # MODIFY
└── Controllers/
    └── NegotiateControllerTests.cs           # MODIFY — replace 501 tests with negotiate tests
```

**Alignment with Architecture Doc:**
- ProcessEvent + SignalR output binding: matches architecture's `Function → output binding → SignalR Service → clients` flow
- NegotiateController in API: matches architecture's `Api/Controllers/NegotiateController.cs` location
- Management SDK (not AddAzureSignalR): matches ADR-3 "No SignalR Hub code" in API
- Connection strings in config files: matches NFR-S3

### Previous Story Intelligence

**From Story 3.6 (Loading & Empty States — in-progress):**
- Angular NgRx store already has a `signalr` slice stubbed out (from Epic 1.6) — Story 4.2 will populate it
- `events.effects.ts` will eventually listen to SignalR events and re-fetch on page 1 — but that's Story 4.2's concern
- The loading indicator pattern in 3.6 is important context: when SignalR triggers a re-fetch, `loading: true` will display the progress bar

**From Story 2.2 (Azure Function Event Processing — review):**
- `EventProcessingService.ProcessAsync()` was implemented here — the change to `Task<Event?>` return type is backward-compatible in principle but needs test updates
- Idempotency via UNIQUE constraint catch was established — the null-return pattern extends this cleanly

**From Story 1.4 (API Scaffold — review):**
- `NegotiateController` was created as a 501 stub — this story replaces it
- CORS with `AllowCredentials()` was configured — critical for SignalR negotiate
- `Program.cs` composition root pattern is established — add `ServiceManager` registration alongside existing registrations

**From Story 1.5 (Azure Function Scaffold — review):**
- `AzureSignalRConnectionString` was added as a placeholder in `local.settings.json` — confirmed present
- `ProcessEvent.cs` uses isolated worker model with `[ServiceBusTrigger]` — the `[SignalROutput]` attribute augments this

### Git Intelligence

Recent commit pattern: `feat: {story-key} - {Story Title}`
```
ef6926e feat: 3-5-events-filter-bar-and-reactive-filtering - Events Filter Bar & Reactive Filtering
99d4596 feat: 3-4-event-type-chip-component - EventTypeChip Component
ce3df04 feat: 3-3-events-table-component - Events Table Component
3f6c3db feat: 3-2-ngrx-events-store-and-data-fetching - NgRx Events Store & Data Fetching
72bce06 feat: 3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination
```

Commit this story as: `feat: 4-1-azure-function-signalr-output-binding-and-negotiate-endpoint - Azure Function SignalR Output Binding & Negotiate Endpoint`

### Latest Tech Notes

**Azure Functions SignalR Extension (Isolated Worker) — v2.0.1:**
- Package: `Microsoft.Azure.Functions.Worker.Extensions.SignalRService`
- Output binding attribute: `[SignalROutput(HubName = "...", ConnectionStringSetting = "...")]` on the **method**
- Return type: `SignalRMessageAction` (not `SignalRMessage` which is in-process only)
- `SignalRMessageAction` constructor: `new SignalRMessageAction("targetMethod") { Arguments = new object[] { ... } }`
- Nullable return (`SignalRMessageAction?`) — returning `null` means no message is sent
- Connection string setting defaults to `"AzureSignalRConnectionString"` if `ConnectionStringSetting` is omitted
- No DI registration needed — binding is declarative via attributes

**Azure SignalR Management SDK:**
- Package: `Microsoft.Azure.SignalR.Management`
- Use `ServiceManagerBuilder` to create a `ServiceManager` singleton
- `ServiceManager.CreateHubContextAsync("hubName")` returns `ServiceHubContext`
- `ServiceHubContext.NegotiateAsync(new NegotiationOptions())` returns connection info for clients
- `ServiceHubContext` should be disposed after use (or cached as singleton)
- **DO NOT** use `AddSignalR().AddAzureSignalR()` — that's for hub server mode, not serverless

**SignalR Connection String Format:**
```
Endpoint=https://<resource>.service.signalr.net;AccessKey=<key>;Version=1.0;
```

**Azure SignalR Service Free Tier:**
- 20 concurrent connections
- 20,000 messages/day
- Sufficient for local development and demo

### Reusability for Future Stories

This story establishes the SignalR infrastructure that subsequent Epic 4 stories depend on:
- **Story 4.2 (Angular SignalR Service & NgRx Integration):** Depends on the negotiate endpoint working — the Angular `@microsoft/signalr` client will call `POST /api/negotiate` implemented here
- **Story 4.3 (SignalR Status Dot Component):** Depends on the connection status from 4.2 which depends on negotiate from 4.1
- **Story 4.4 (Flying Chip Animation):** Depends on `newEvent` SignalR messages being broadcast — implemented here
- **Story 4.5 (Row Insert Animation):** Depends on SignalR events triggering table re-fetch

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1 Azure Function SignalR Output Binding & Negotiate Endpoint]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-3 Real-Time — Azure SignalR Service (Serverless)]
- [Source: _bmad-output/planning-artifacts/architecture.md#SignalR + Pagination + Animation Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points — Data Flow]
- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations — Azure SignalR Service]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines rules #4, #7, #13, #14]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns — SignalR Event Names]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Boundaries — SignalR negotiate]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries — Function owns SignalR output]
- [Source: _bmad-output/planning-artifacts/prd.md#FR13 Live event appearance]
- [Source: _bmad-output/planning-artifacts/prd.md#FR14 Broadcast new events]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P3 SignalR < 1s]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P4 E2E < 3s]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-I3 Auto reconnect]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-S3 Secrets in config]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SignalR + Pagination Edge Case]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SignalRStatusDotComponent]
- [Source: src/EventHub.Function/Functions/ProcessEvent.cs — current implementation to modify]
- [Source: src/EventHub.Function/Services/EventProcessingService.cs — return type change]
- [Source: src/EventHub.Function/EventHub.Function.csproj — add SignalR package]
- [Source: src/EventHub.Function/local.settings.json — AzureSignalRConnectionString already present]
- [Source: src/EventHub.Api/Controllers/NegotiateController.cs — 501 stub to replace]
- [Source: src/EventHub.Api/EventHub.Api.csproj — add Management SDK]
- [Source: src/EventHub.Api/Program.cs — add ServiceManager registration]
- [Source: src/EventHub.Api/appsettings.json — add connection string]
- [Source: src/EventHub.Api/appsettings.Development.json — add connection string]
- [Source: tests/EventHub.Api.Tests/Controllers/NegotiateControllerTests.cs — replace 501 tests]
- [Source: tests/EventHub.Function.Tests/Services/EventProcessingServiceTests.cs — update for new return type]
- [Docs: Azure Functions SignalR Service bindings — https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-signalr-service]
- [Docs: Azure SignalR Management SDK — https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-howto-use-management-sdk]
- [Docs: Azure SignalR connection strings — https://learn.microsoft.com/en-us/azure/azure-signalr/concept-connection-string]

## Change Log

- 2026-02-24: Implemented all 8 tasks — SignalR output binding on ProcessEvent, NegotiateController with ServiceManager, connection string configuration, comprehensive unit tests. 38 total tests passing (23 API + 15 Function).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No debug issues encountered. All tasks completed cleanly on first implementation pass.

### Completion Notes List

- Task 1: Added `Microsoft.Azure.Functions.Worker.Extensions.SignalRService` v2.0.1 to Function project, `Microsoft.Azure.SignalR.Management` v1.26.0 to API project
- Task 2: Changed `EventProcessingService.ProcessAsync()` return type from `Task` to `Task<Event?>` — returns entity on success, null on duplicate. Updated 7 existing tests for new return type.
- Task 3: Added `[SignalROutput]` attribute to `ProcessEvent.Run()`, changed return type to `Task<SignalRMessageAction?>`. On successful persist, broadcasts `newEvent` with camelCase payload (id, userId, type as string, description, createdAt). Returns null on duplicate — no broadcast.
- Task 4: Replaced 501 stub in `NegotiateController` with full implementation using injected `ServiceManager`. Registered `ServiceManager` singleton in `Program.cs` using `ServiceManagerBuilder`. Controller creates hub context, calls `NegotiateAsync`, disposes context, returns OK.
- Task 5: Added `AzureSignalRConnectionString` placeholder to `appsettings.json` and `appsettings.Development.json`. Verified key already exists in `local.settings.json`.
- Task 6: Added 3 new SignalR-specific tests to ProcessEventTests: SignalR message target verification, null return on duplicate, payload field validation (id, userId, type string, description, createdAt).
- Task 7: Replaced 501 test with 3 new negotiate tests: 200 OK response, url+accessToken validation, anonymous connection support. Mocked `ServiceManager` and `ServiceHubContext`.
- Task 8: Full solution build — 0 errors, 0 warnings. All 38 tests pass (23 API + 15 Function).

### File List

- src/EventHub.Function/EventHub.Function.csproj (modified — added SignalR extension package)
- src/EventHub.Function/Functions/ProcessEvent.cs (modified — SignalR output binding, new return type)
- src/EventHub.Function/Services/EventProcessingService.cs (modified — return type Task<Event?>)
- src/EventHub.Api/EventHub.Api.csproj (modified — added Management SDK package)
- src/EventHub.Api/Controllers/NegotiateController.cs (modified — full negotiate implementation)
- src/EventHub.Api/Program.cs (modified — ServiceManager singleton registration)
- src/EventHub.Api/appsettings.json (modified — added AzureSignalRConnectionString)
- src/EventHub.Api/appsettings.Development.json (modified — added AzureSignalRConnectionString)
- tests/EventHub.Function.Tests/Functions/ProcessEventTests.cs (modified — SignalR output tests)
- tests/EventHub.Function.Tests/Services/EventProcessingServiceTests.cs (modified — updated for Task<Event?> return type)
- tests/EventHub.Api.Tests/Controllers/NegotiateControllerTests.cs (modified — replaced 501 tests with negotiate tests)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — status updated)
- _bmad-output/implementation-artifacts/4-1-azure-function-signalr-output-binding-and-negotiate-endpoint.md (modified — task checkboxes, dev record, status)
