# Story 1.5: Azure Function Scaffold

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want a configured Azure Function project with Service Bus trigger stub and structured logging,
so that the async event processor is runnable and ready for implementation.

## Acceptance Criteria

1. **AC1: Isolated Worker Model** — `EventHub.Function` uses .NET 8 isolated worker model (already scaffolded — verify `Program.cs` uses `HostBuilder` with `ConfigureFunctionsWebApplication()`).

2. **AC2: ProcessEvent Function** — `Functions/ProcessEvent.cs` has a `[ServiceBusTrigger]` method with empty processing stub that logs the received message via Serilog (structured logging with `EventMessage` properties).

3. **AC3: EventProcessingService** — `Services/EventProcessingService.cs` exists with stub for DB write + idempotency logic. Accepts `EventMessage`, maps to Domain `Event`, calls `IEventRepository.CreateAsync()`. Idempotency: catches UNIQUE constraint violation on `Event.Id` and logs "Duplicate event {Id} ignored" (graceful no-op).

4. **AC4: DI Composition Root** — `Program.cs` registers `AddApplication()` and `AddInfrastructure(config)` via DI, plus registers `EventProcessingService` as scoped service.

5. **AC5: Serilog Logging** — Serilog with Console sink is configured via `UseSerilog()` on the `HostBuilder`. Uses `ReadFrom.Configuration()` pattern consistent with API project.

6. **AC6: Configuration Files** — `host.json` and `local.settings.json` contain connection string placeholders for Azure SQL (`DefaultConnection`), Service Bus (`ServiceBus`), and Azure SignalR Service (`AzureSignalRConnectionString`) (NFR-S3).

7. **AC7: Function Runnable** — `func start` runs the Function on `localhost:7071` without errors (note: Service Bus trigger will fail to connect without a real connection string, but the host must start without crash).

8. **AC8: Build Verification** — `dotnet build` succeeds with zero errors and zero warnings across the entire solution. `dotnet test` passes all existing tests.

## Tasks / Subtasks

- [x] Task 1: Install required NuGet packages (AC: #1, #2, #5)
  - [x] Add `Microsoft.Azure.Functions.Worker.Extensions.ServiceBus` package to EventHub.Function (for `[ServiceBusTrigger]` attribute)
  - [x] Add `Serilog.Extensions.Hosting` package to EventHub.Function (for `UseSerilog()` on HostBuilder)
  - [x] Add `Serilog.Sinks.Console` package to EventHub.Function
  - [x] Verify `dotnet restore` succeeds

- [x] Task 2: Configure Program.cs composition root (AC: #4, #5)
  - [x] Add `using EventHub.Application.Extensions;` and `using EventHub.Infrastructure.Extensions;` and `using Serilog;`
  - [x] Add `.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration).WriteTo.Console())` to HostBuilder
  - [x] Add `services.AddApplication();` in ConfigureServices
  - [x] Add `services.AddInfrastructure(builder.Configuration);` in ConfigureServices — **CRITICAL:** Must access `IConfiguration` from `HostBuilderContext`. Use pattern: `.ConfigureServices((context, services) => { services.AddInfrastructure(context.Configuration); })`
  - [x] Register `EventProcessingService` as scoped: `services.AddScoped<EventProcessingService>();`
  - [x] Keep existing Application Insights configuration

- [x] Task 3: Create EventProcessingService stub (AC: #3)
  - [x] Create directory `src/EventHub.Function/Services/`
  - [x] Create `Services/EventProcessingService.cs`
  - [x] Inject `IEventRepository` and `ILogger<EventProcessingService>` via constructor
  - [x] Implement `ProcessAsync(EventMessage message)` method:
    - Map `EventMessage` → Domain `Event` entity (property-by-property copy)
    - Call `await _repository.CreateAsync(eventEntity);`
    - Wrap in try/catch for `DbUpdateException` (UNIQUE constraint violation on Id)
    - On duplicate: log `"Duplicate event {EventId} ignored"` at Warning level
    - On other errors: log and rethrow
  - [x] Use `async Task` return type (not void)

- [x] Task 4: Create ProcessEvent function stub (AC: #2)
  - [x] Create directory `src/EventHub.Function/Functions/`
  - [x] Create `Functions/ProcessEvent.cs`
  - [x] Add `[Function("ProcessEvent")]` attribute on the class method
  - [x] Add `[ServiceBusTrigger("events", Connection = "ServiceBus")]` parameter binding on `string messageBody`
  - [x] Inject `EventProcessingService` and `ILogger<ProcessEvent>` via constructor
  - [x] In the method body: log the received message at Information level with structured properties
  - [x] Deserialize `messageBody` to `EventMessage` using `System.Text.Json.JsonSerializer.Deserialize<EventMessage>()`
  - [x] Call `await _processingService.ProcessAsync(eventMessage);`
  - [x] Log successful processing at Information level

- [x] Task 5: Update local.settings.json with connection string placeholders (AC: #6)
  - [x] Add `"ConnectionStrings:DefaultConnection": ""` (Azure SQL placeholder)
  - [x] Add `"ConnectionStrings:ServiceBus": ""` (Service Bus connection string — also used by trigger via `Connection = "ServiceBus"`)
  - [x] Add `"AzureSignalRConnectionString": ""` (Azure SignalR Service placeholder for Story 4.1)
  - [x] Keep existing `AzureWebJobsStorage` and `FUNCTIONS_WORKER_RUNTIME` values

- [x] Task 6: Update host.json for Service Bus configuration (AC: #6)
  - [x] Add Service Bus extensions configuration (optional for scaffold, but good practice):
    ```json
    "extensions": {
      "serviceBus": {
        "prefetchCount": 1,
        "messageHandlerOptions": {
          "maxConcurrentCalls": 1
        }
      }
    }
    ```

- [x] Task 7: Build and test verification (AC: #7, #8)
  - [x] Run `dotnet build` for entire solution — verify 0 errors, 0 warnings
  - [x] Run `dotnet test` — verify all existing tests pass
  - [ ] Verify `func start --csharp` in EventHub.Function directory starts without immediate crash (trigger registration should appear in logs even if connection fails) — NOTE: Azure Functions Core Tools not installed in this environment; build verification confirms host is structurally correct

## Dev Notes

### Critical Dependencies

- **Story 1.3 (Infrastructure Layer)** — COMPLETED. Provides `AddInfrastructure(IConfiguration)`, `IEventRepository`, `EventRepository`, `ServiceBusPublisher`, `EventHubDbContext`. All available and functional.
- **Story 1.2 (Application Layer)** — COMPLETED. Provides `AddApplication()`, `IEventRepository`, `IServiceBusPublisher`, `EventMessage`, `Event` entity, `EventType` enum.
- **Story 1.4 (API Scaffold)** — COMPLETED. Established Serilog pattern (`UseSerilog` with `ReadFrom.Configuration` + `Console` sink). Follow same pattern.

### Architecture Patterns & Constraints

- **Enforcement Rule #4:** Use `async/await` in all C# code — never `.Result` or `.Wait()`
- **Enforcement Rule #7:** Use Serilog structured logging — never `Console.WriteLine`
- **Enforcement Rule #13:** Follow Clean Architecture dependency rule — inner layers NEVER reference outer layers
- **Enforcement Rule #14:** Place interface definitions in `EventHub.Application/Interfaces/` — implementations in `EventHub.Infrastructure/`
- **Function project is Presentation layer** — references Application + Infrastructure (same as API)
- **NFR-M1:** Event processing layer must contain no HTTP-handling code; API layer must contain no direct database access code
- **NFR-I2:** Event processing component must process events idempotently using the event Id as a unique database key — duplicate message delivery results in a logged, graceful no-op
- **NFR-I1:** At-least-once delivery — message broker guarantees no permanent loss on transient failure

### Azure Functions Isolated Worker Model

The Function project already uses the .NET 8 isolated worker model (`ConfigureFunctionsWebApplication()`). Key differences from in-process model:
- DI is registered via `ConfigureServices` on `HostBuilder` (not `Startup.cs`)
- `ILogger<T>` is injected via constructor (not method parameter)
- Functions are regular classes with `[Function]` attribute
- `ServiceBusTrigger` uses `Microsoft.Azure.Functions.Worker.Extensions.ServiceBus` (not `Microsoft.Azure.WebJobs.Extensions.ServiceBus`)

### Service Bus Trigger Configuration

- Queue name: `"events"` (per architecture — single queue for MVP, ADR-2)
- Connection setting: `"ServiceBus"` — resolves to `ConnectionStrings:ServiceBus` in local.settings.json or app settings
- Message body is received as `string` and manually deserialized (isolated worker pattern)
- **CRITICAL:** In isolated worker model, the `Connection` parameter in `[ServiceBusTrigger]` refers to a setting name (NOT a full connection string). Azure Functions runtime resolves `"ServiceBus"` → looks for `ConnectionStrings:ServiceBus` or `ServiceBus` in settings.

### EventProcessingService Design

```csharp
// Pattern to follow:
public class EventProcessingService
{
    private readonly IEventRepository _repository;
    private readonly ILogger<EventProcessingService> _logger;

    public async Task ProcessAsync(EventMessage message)
    {
        var entity = new Event
        {
            Id = message.Id,
            UserId = message.UserId,
            Type = message.Type,
            Description = message.Description,
            CreatedAt = message.CreatedAt
        };

        try
        {
            await _repository.CreateAsync(entity);
            _logger.LogInformation("Event {EventId} processed successfully", message.Id);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            _logger.LogWarning("Duplicate event {EventId} ignored", message.Id);
        }
    }
}
```

**Idempotency via UNIQUE constraint:** The `Event.Id` is a GUID primary key in the database (configured in `EventConfiguration.cs`). If a duplicate message arrives (at-least-once delivery), the `INSERT` will throw a `DbUpdateException` with a unique constraint violation. The service catches this specific error and logs it as a graceful no-op.

**How to detect UNIQUE constraint violation in EF Core + SQL Server:**
- Catch `DbUpdateException`
- Check inner exception for `SqlException` with Number `2627` (UNIQUE KEY violation) or `2601` (UNIQUE INDEX violation)
- Alternative: check inner exception message contains "duplicate key" (less precise but cross-database)

### ProcessEvent Function Design

```csharp
// Pattern to follow:
public class ProcessEvent
{
    private readonly EventProcessingService _processingService;
    private readonly ILogger<ProcessEvent> _logger;

    [Function("ProcessEvent")]
    public async Task Run(
        [ServiceBusTrigger("events", Connection = "ServiceBus")] string messageBody)
    {
        _logger.LogInformation("Processing event message: {MessageBody}", messageBody);

        var eventMessage = JsonSerializer.Deserialize<EventMessage>(messageBody, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        await _processingService.ProcessAsync(eventMessage!);
    }
}
```

**JSON Deserialization:** Use `PropertyNameCaseInsensitive = true` because the API publishes in camelCase (System.Text.Json default) while C# properties are PascalCase.

**Enum handling:** `EventType` enum values (`PageView`, `Click`, `Purchase`) are serialized as strings in the architecture. Use `JsonStringEnumConverter` in deserialization options or configure globally.

### Serilog in Azure Functions Isolated Worker

For isolated worker model, Serilog integrates via `Serilog.Extensions.Hosting`:

```csharp
var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .UseSerilog((context, config) => config
        .ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console())
    .ConfigureServices((context, services) =>
    {
        services.AddApplication();
        services.AddInfrastructure(context.Configuration);
        services.AddScoped<EventProcessingService>();
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();
    })
    .Build();
```

**IMPORTANT:** Serilog configuration in `local.settings.json` uses the `Values` section (flat key-value), NOT nested JSON. For now, Console sink configured in code is sufficient. If adding Serilog config via settings, use:
```json
"Serilog__MinimumLevel__Default": "Information"
```

### Configuration Structure

```json
// local.settings.json (updated)
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "AzureSignalRConnectionString": ""
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EventHub;Trusted_Connection=true;TrustServerCertificate=true;",
    "ServiceBus": "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=placeholder"
  }
}
```

**CRITICAL:** Service Bus connection string must be under `ConnectionStrings` section for the `Connection = "ServiceBus"` binding to resolve correctly. The trigger looks for `ConnectionStrings:ServiceBus` first, then falls back to `Values:ServiceBus`.

### Previous Story Learnings (from 1.4)

- Serilog.AspNetCore 10.0.0 was used in API — for Function use `Serilog.Extensions.Hosting` instead (no ASP.NET Core dependency needed in Function)
- `AddApplication()` is a placeholder with no registrations yet — still call it for forward compatibility
- `AddInfrastructure(config)` registers DbContext (SQL Server), ServiceBusClient (singleton), EventRepository (scoped), ServiceBusPublisher (scoped)
- CRITICAL: `AddInfrastructure()` creates a `ServiceBusClient` from `ConnectionStrings:ServiceBus`. With empty/placeholder connection strings, this will throw at runtime. Ensure `func start` is tested with awareness that the trigger connection may fail (host should still start, trigger registration appears in logs).
- Existing test `UnitTest1.cs` in Function.Tests is a placeholder — should be replaced or removed when real tests are added

### `InvariantGlobalization` Note

Unlike the API project, the Function project does NOT have `<InvariantGlobalization>true</InvariantGlobalization>` in its csproj. This is fine — it means culture-specific formatting is available if needed.

### SignalR Output Binding (Future — Story 4.1)

The `AzureSignalRConnectionString` placeholder in `local.settings.json` prepares for Story 4.1 when `ProcessEvent` will return a `SignalRMessageAction` to broadcast the new event. For now, only the connection string placeholder is needed — the NuGet package `Microsoft.Azure.Functions.Worker.Extensions.SignalRService` will be added in Story 4.1.

### Project Structure Notes

**Files to CREATE:**
```
src/EventHub.Function/
  Functions/
    ProcessEvent.cs              ← NEW
  Services/
    EventProcessingService.cs    ← NEW
  Program.cs                     ← MODIFY (add DI + Serilog)
  local.settings.json            ← MODIFY (add connection strings)
  host.json                      ← MODIFY (add Service Bus config)
  EventHub.Function.csproj       ← MODIFY (add NuGet packages)
```

**Files NOT to modify:**
```
src/EventHub.Domain/             ← No changes
src/EventHub.Application/        ← No changes
src/EventHub.Infrastructure/     ← No changes
src/EventHub.Api/                ← No changes
```

**Alignment with unified project structure:** Fully aligned with architecture doc's directory layout (§ Project Structure & Boundaries). The `Functions/` and `Services/` directories match the specified structure at `EventHub.Function/Functions/ProcessEvent.cs` and `EventHub.Function/Services/EventProcessingService.cs`.

**Detected conflicts or variances:** None. The scaffold extends the existing project structure without modifying any other layers.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Azure Function initialization, isolated worker model, NuGet packages
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — Clean Architecture layers, Service Bus message format
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming conventions, enforcement rules, structure patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points] — E2E data flow (Service Bus → Function → DB → SignalR)
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Serilog configuration, environment config, local development ports
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR-S3 (secrets), NFR-M1 (layer separation), NFR-M2 (externalized config), NFR-I1 (at-least-once), NFR-I2 (idempotency)
- [Source: _bmad-output/implementation-artifacts/1-4-api-scaffold-and-configuration.md] — Serilog pattern, DI registration pattern, middleware pipeline, port configuration
- [Source: _bmad-output/implementation-artifacts/1-3-infrastructure-layer-and-database-setup.md] — AddInfrastructure() extension, EventRepository, ServiceBusPublisher, EventHubDbContext
- [Source: src/EventHub.Application/Messages/EventMessage.cs] — EventMessage contract (Id, UserId, Type, Description, CreatedAt)
- [Source: src/EventHub.Application/Interfaces/IEventRepository.cs] — CreateAsync(Event) method signature
- [Source: src/EventHub.Domain/Entities/Event.cs] — Event entity (Id, UserId, Type, Description, CreatedAt)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `Serilog.Settings.Configuration` package was additionally required for `ReadFrom.Configuration()` — not bundled with `Serilog.Extensions.Hosting` (unlike `Serilog.AspNetCore` used in API project)
- `EventProcessingService.ProcessAsync()` made `virtual` to support Moq mocking in `ProcessEventTests`
- Azure Functions Core Tools (`func`) not installed in dev environment — `func start` verification deferred to CI/manual testing
- `JsonStringEnumConverter` added to `ProcessEvent` deserialization options for proper `EventType` enum handling

### Completion Notes List

- **Task 1:** Installed 4 NuGet packages: `Microsoft.Azure.Functions.Worker.Extensions.ServiceBus` (5.24.0), `Serilog.Extensions.Hosting` (10.0.0), `Serilog.Sinks.Console` (6.1.1), `Serilog.Settings.Configuration` (10.0.0)
- **Task 2:** Configured Program.cs with UseSerilog, AddApplication(), AddInfrastructure(context.Configuration), AddScoped<EventProcessingService>(), kept Application Insights
- **Task 3:** Created EventProcessingService with IEventRepository + ILogger DI, ProcessAsync method mapping EventMessage→Event, idempotency via DbUpdateException catch with "duplicate key" message check
- **Task 4:** Created ProcessEvent function with [ServiceBusTrigger("events", Connection = "ServiceBus")], JSON deserialization with PropertyNameCaseInsensitive + JsonStringEnumConverter, structured logging
- **Task 5:** Updated local.settings.json with ConnectionStrings section (DefaultConnection, ServiceBus) and AzureSignalRConnectionString placeholder
- **Task 6:** Added Service Bus extensions configuration to host.json (prefetchCount: 1, maxConcurrentCalls: 1)
- **Task 7:** Build verification: 0 errors, 0 warnings. Test verification: 17/17 tests passed (7 API + 10 Function)

### File List

- `src/EventHub.Function/EventHub.Function.csproj` — MODIFIED (added 4 NuGet packages)
- `src/EventHub.Function/Program.cs` — MODIFIED (DI composition root + Serilog)
- `src/EventHub.Function/Services/EventProcessingService.cs` — NEW (event processing with idempotency)
- `src/EventHub.Function/Functions/ProcessEvent.cs` — NEW (Service Bus trigger function)
- `src/EventHub.Function/local.settings.json` — MODIFIED (connection string placeholders)
- `src/EventHub.Function/host.json` — MODIFIED (Service Bus extensions config)
- `tests/EventHub.Function.Tests/EventHub.Function.Tests.csproj` — MODIFIED (added Moq, Application/Domain references)
- `tests/EventHub.Function.Tests/Services/EventProcessingServiceTests.cs` — NEW (6 unit tests)
- `tests/EventHub.Function.Tests/Functions/ProcessEventTests.cs` — NEW (3 unit tests)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status: in-progress → review)

## Change Log

- **2026-02-23:** Story 1.5 implementation complete — Azure Function scaffold with Service Bus trigger, EventProcessingService with idempotency, Serilog structured logging, DI composition root, configuration placeholders. 10 new unit tests added.
