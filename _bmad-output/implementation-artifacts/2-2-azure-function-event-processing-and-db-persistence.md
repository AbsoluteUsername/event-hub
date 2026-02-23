# Story 2.2: Azure Function Event Processing & DB Persistence

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **System**,
I want the Azure Function to consume events from Service Bus and persist them to Azure SQL with idempotency,
so that every submitted event is reliably stored exactly once.

## Acceptance Criteria

1. **AC1: Successful Event Processing & Persistence** — Given an `EventMessage` arrives on the Service Bus queue, when the `ProcessEvent` function triggers, then `EventProcessingService` maps the message to a Domain `Event` entity and calls `IEventRepository.CreateAsync()`, and the event is persisted to Azure SQL with all fields (Id, UserId, Type, Description, CreatedAt).

2. **AC2: Idempotent Duplicate Handling** — Given a duplicate `EventMessage` arrives (same Id, at-least-once delivery), when the `ProcessEvent` function triggers, then the system catches the UNIQUE constraint violation on `Event.Id`, logs "Duplicate event {Id} ignored" via Serilog (graceful no-op, NFR-I2), and no duplicate record is written to the database.

3. **AC3: Error Handling & Dead-Letter** — Given an unrecoverable error during event processing, when the `ProcessEvent` function triggers, then the error is logged via Serilog with full context (FR24), and the message is moved to dead-letter queue after retry exhaustion (NFR-I1).

## Tasks / Subtasks

- [x] Task 1: Verify & refine ProcessEvent function (AC: #1, #3)
  - [x] Verify `ProcessEvent.cs` Service Bus trigger configuration (queue name "events", connection "ServiceBus")
  - [x] Verify JSON deserialization with `PropertyNameCaseInsensitive = true` and `JsonStringEnumConverter` matches API publish format
  - [x] Verify error propagation — unhandled exceptions must NOT be caught (let Service Bus runtime handle retries + dead-letter)
  - [x] Add null-check guard for deserialized `EventMessage` (currently uses `!` null-forgiveness — consider explicit validation)
  - [x] Verify structured logging includes EventId for correlation

- [x] Task 2: Verify & refine EventProcessingService (AC: #1, #2)
  - [x] Verify `EventMessage` → `Event` entity mapping covers all 5 properties (Id, UserId, Type, Description, CreatedAt)
  - [x] Verify idempotency: `DbUpdateException` with UNIQUE constraint violation (SQL error 2627/2601) is caught and logged as Warning
  - [x] Verify non-duplicate `DbUpdateException` rethrows (does not swallow real DB errors)
  - [x] Verify `ProcessAsync` is `virtual` for Moq testability

- [x] Task 3: Verify & enhance unit tests (AC: #1, #2, #3)
  - [x] Verify `ProcessEventTests.cs` covers: deserialization, processing service invocation, logging
  - [x] Verify `EventProcessingServiceTests.cs` covers: successful persist, property mapping, duplicate handling (2627 + 2601), non-duplicate rethrow, success logging
  - [x] Add test: `ProcessEvent.Run` with malformed JSON → exception propagates (dead-letter scenario)
  - [x] Add test: `EventProcessingService.ProcessAsync` with null message → appropriate error

- [x] Task 4: Build and test verification (AC: #1, #2, #3)
  - [x] Run `dotnet build` — verify 0 errors, 0 warnings across entire solution
  - [x] Run `dotnet test` — verify all existing + new tests pass
  - [x] Verify Function project compiles with all Service Bus trigger bindings

## Dev Notes

### Critical Context — What This Story Does

This is the **second story in Epic 2** (Event Submission Pipeline). It implements the downstream processor that consumes events published by the API (Story 2.1) and persists them to Azure SQL. This completes the backend write path: `API → Service Bus → Function → Azure SQL`.

**CRITICAL FINDING: Most implementation already exists from Story 1.5 scaffolding.** The dev agent in Story 1.5 implemented full working code (not stubs) for `ProcessEvent.cs`, `EventProcessingService.cs`, and comprehensive tests. Story 2.2 is primarily about **verification, edge case hardening, and adding any missing test coverage**.

**Data flow for this story:**
```
Azure Service Bus Queue ("events")
  → [ServiceBusTrigger] ProcessEvent.Run(string messageBody)
    → JsonSerializer.Deserialize<EventMessage>(messageBody)
      → EventProcessingService.ProcessAsync(eventMessage)
        → Map EventMessage → Event entity
          → IEventRepository.CreateAsync(entity)
            → EventHubDbContext.Events.Add() → SaveChangesAsync()
              → Azure SQL INSERT
        → On duplicate: catch DbUpdateException → log Warning → no-op
        → On other error: exception propagates → Service Bus retries → dead-letter
```

### What Already Exists (DO NOT Recreate)

The entire implementation is complete from Story 1.5. These files exist and are FUNCTIONAL:

| Component | File | Status |
|-----------|------|--------|
| Service Bus trigger | `src/EventHub.Function/Functions/ProcessEvent.cs` | EXISTS — full implementation with deserialization + logging |
| Processing service | `src/EventHub.Function/Services/EventProcessingService.cs` | EXISTS — mapping + idempotency + logging |
| Repository impl | `src/EventHub.Infrastructure/Repositories/EventRepository.cs` | EXISTS — `CreateAsync()` with `SaveChangesAsync()` |
| DbContext | `src/EventHub.Infrastructure/Data/EventHubDbContext.cs` | EXISTS — `DbSet<Event>` |
| Entity config | `src/EventHub.Infrastructure/Data/Configurations/EventConfiguration.cs` | EXISTS — PK, indexes on CreatedAt/UserId/Type, enum-as-string |
| Function DI | `src/EventHub.Function/Program.cs` | EXISTS — `AddApplication()`, `AddInfrastructure()`, `EventProcessingService` scoped |
| host.json | `src/EventHub.Function/host.json` | EXISTS — `maxConcurrentCalls: 1`, `prefetchCount: 1` |
| local.settings.json | `src/EventHub.Function/local.settings.json` | EXISTS — connection string placeholders |
| ProcessEvent tests | `tests/EventHub.Function.Tests/Functions/ProcessEventTests.cs` | EXISTS — 3 tests (deserialization, logging, camelCase) |
| Service tests | `tests/EventHub.Function.Tests/Services/EventProcessingServiceTests.cs` | EXISTS — 6 tests (create, mapping, duplicate, rethrow, logging) |
| IEventRepository | `src/EventHub.Application/Interfaces/IEventRepository.cs` | EXISTS — `CreateAsync(Event)` |
| Event entity | `src/EventHub.Domain/Entities/Event.cs` | EXISTS — Id, UserId, Type, Description, CreatedAt |
| EventMessage | `src/EventHub.Application/Messages/EventMessage.cs` | EXISTS — matching message contract |

**DO NOT:** Create new files, restructure existing code, or rewrite what works. **DO:** Verify correctness, add edge-case tests, fix any gaps found.

### Architecture Patterns & Constraints

**MUST FOLLOW — Enforcement Rules relevant to this story:**

- **Rule #4:** Use `async/await` in all C# code — never `.Result` or `.Wait()`. ALREADY followed in ProcessEvent and EventProcessingService.
- **Rule #7:** Use Serilog structured logging — never `Console.WriteLine`. ALREADY followed with `_logger.LogInformation("Event {EventId} processed successfully", message.Id)`.
- **Rule #10:** Use `IEntityTypeConfiguration<T>` for EF Core config — already done in `EventConfiguration.cs`.
- **Rule #13:** Follow Clean Architecture dependency rule — Function references Application + Infrastructure, never Domain directly for interfaces.
- **Rule #14:** Interface definitions in `Application/Interfaces/` — implementations in `Infrastructure/`. Already done.

**NFR Compliance:**

- **NFR-I1 (At-least-once delivery):** Service Bus guarantees. If `ProcessAsync` throws, the message is retried. After retry exhaustion, message moves to dead-letter queue. The function must NOT catch and swallow unrecoverable exceptions.
- **NFR-I2 (Idempotent processing):** `EventProcessingService` catches `DbUpdateException` when it's a UNIQUE constraint violation (SQL Server error 2627/2601) and logs a warning. The `Event.Id` primary key constraint enforces uniqueness at the database level.
- **NFR-M1 (Layer separation):** Function layer contains no direct database access code — it delegates through `EventProcessingService` → `IEventRepository`. Infrastructure layer provides `EventRepository` implementation.

### Implementation Details — Existing Code Analysis

**ProcessEvent.cs — Service Bus Trigger:**
```csharp
[Function("ProcessEvent")]
public async Task Run(
    [ServiceBusTrigger("events", Connection = "ServiceBus")] string messageBody)
{
    _logger.LogInformation("Processing event message: {MessageBody}", messageBody);
    var eventMessage = JsonSerializer.Deserialize<EventMessage>(messageBody, JsonOptions);
    await _processingService.ProcessAsync(eventMessage!);
    _logger.LogInformation("Event message processed successfully");
}
```

**Key observations:**
1. `messageBody` is `string` — Azure Functions SDK deserializes the Service Bus message body to string automatically
2. `JsonOptions` configured with `PropertyNameCaseInsensitive = true` and `JsonStringEnumConverter` — matches API publish format from Story 2.1
3. `eventMessage!` uses null-forgiveness operator — potential `NullReferenceException` if deserialization fails silently. Consider adding explicit null check.
4. Unhandled exceptions propagate correctly — Service Bus runtime handles retries

**EventProcessingService.cs — Idempotency Logic:**
```csharp
public virtual async Task ProcessAsync(EventMessage message)
{
    var entity = new Event { Id = message.Id, UserId = message.UserId, ... };
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
```

**Key observations:**
1. `virtual` modifier on `ProcessAsync` enables Moq verification in tests ✅
2. `IsUniqueConstraintViolation` checks for "duplicate key" or "unique index" in inner exception message — cross-DB compatible ✅
3. Non-duplicate `DbUpdateException` correctly propagates (no catch) ✅
4. Logging uses structured templates with `{EventId}` ✅

**host.json — Sequential Processing:**
```json
"extensions": { "serviceBus": { "prefetchCount": 1, "messageHandlerOptions": { "maxConcurrentCalls": 1 } } }
```
- Single-threaded processing ensures no race conditions on duplicate detection
- At-least-once: if function crashes mid-processing, message remains in queue

### Testing Strategy

**Existing test coverage (10 tests):**

| Test Class | Tests | What's Covered |
|-----------|-------|---------------|
| `ProcessEventTests` | 3 | Deserialization + service call, logging (2 logs), camelCase JSON handling |
| `EventProcessingServiceTests` | 6 | Create + mapping, property mapping, duplicate (2627), duplicate (2601), non-duplicate rethrow, success logging |
| **Total** | **9** | Core paths covered |

**Recommended additions:**

| New Test | What it Verifies |
|----------|-----------------|
| `ProcessEvent.Run_MalformedJson_ThrowsException` | Malformed JSON propagates exception (triggers dead-letter) |
| `ProcessEvent.Run_NullDeserialization_ThrowsException` | Null deserialization result causes clear error |

**Test patterns (xUnit + Moq):**
- Mock `IEventRepository` for `EventProcessingService` tests
- Mock `EventProcessingService` (virtual method) for `ProcessEvent` tests
- Use `It.Is<T>()` for argument verification
- Use `DbUpdateException` with simulated inner messages for constraint tests

### Previous Story Intelligence

**From Story 2.1 (API POST Endpoint & Server-Side Validation):**
- `JsonStringEnumConverter` was added to API's `Program.cs` for consistent enum serialization as strings — the Function's `ProcessEvent.cs` already uses matching `JsonStringEnumConverter` for deserialization ✅
- Error response format `{"errors": {"field": "message"}}` established — not relevant for this story (Function doesn't return HTTP responses)
- `EventMessage` published with `MessageId = message.Id.ToString()` for Service Bus deduplication — the Function relies on DB-level idempotency (UNIQUE constraint) as a second line of defense ✅
- Build verified: 0 errors, 0 warnings. 26 tests passing (16 API + 10 Function)
- ServiceBusPublisher serializes with `System.Text.Json` using `JsonSerializerOptions` with camelCase naming — Function's `ProcessEvent` deserializes with `PropertyNameCaseInsensitive = true` which handles this correctly ✅

**From Story 1.5 (Azure Function Scaffold):**
- Full implementation was provided (not stubs) — Story 2.2 is verification + edge cases
- Serilog configured with Console sink via `ReadFrom.Configuration()`
- Application Insights telemetry worker service registered
- `EventProcessingService` registered as Scoped (matches DbContext lifetime)

### Git Intelligence

Recent commit pattern:
```
4702042 feat: 2-1-api-post-endpoint-and-server-side-validation - API POST Endpoint & Server-Side Validation
b6db634 feat: 1-6-angular-spa-foundation-and-glass-theme - Angular SPA Foundation & Glass Theme
d163efc feat: 1-5-azure-function-scaffold - Azure Function Scaffold
93db1eb feat(1-4-api-scaffold-and-configuration): story complete (#2)
```

- Branch naming: `feature/{story-key}`
- Commit message: `feat: {story-key} - {story title}`
- Most recent story (2.1) established API → Service Bus publish path. This story completes the downstream: Service Bus → Function → DB.
- All .NET patterns established: Clean Architecture, Serilog, DI via extensions, xUnit + Moq testing
- Function project last fully modified in Story 1.5 — full implementation, not stubs

### Latest Technical Specifics

- **Azure Functions .NET 8 isolated worker (v4)** — stable LTS. `ServiceBusTrigger` attribute with string body binding is standard pattern. No breaking changes.
- **Azure.Messaging.ServiceBus Extensions 5.24.0** — current stable. `[ServiceBusTrigger("events", Connection = "ServiceBus")]` maps to `ConnectionStrings:ServiceBus` in configuration.
- **EF Core 8.0 with SQL Server** — stable LTS. `DbUpdateException` with inner `SqlException` for constraint violations. `IsUniqueConstraintViolation` check on inner message is correct pattern.
- **System.Text.Json** — built-in to .NET 8. `PropertyNameCaseInsensitive = true` handles camelCase ↔ PascalCase mapping. `JsonStringEnumConverter` handles string enum values.
- **xUnit 2.4.2 + Moq 4.20** — standard test stack. Virtual method mocking for `EventProcessingService.ProcessAsync`.

### Project Structure Notes

**Files to potentially MODIFY:**
```
src/EventHub.Function/
  Functions/
    ProcessEvent.cs                    ← VERIFY (may add null-check guard for deserialized message)

tests/EventHub.Function.Tests/
  Functions/
    ProcessEventTests.cs              ← MODIFY (add malformed JSON test, null deserialization test)
```

**Files NOT to modify:**
```
src/EventHub.Function/Services/
  EventProcessingService.cs           ← No changes needed (implementation complete)
src/EventHub.Function/Program.cs      ← No changes needed (DI complete)
src/EventHub.Function/host.json       ← No changes needed (config complete)
src/EventHub.Infrastructure/          ← No changes (Repository, DbContext, EF config complete)
src/EventHub.Application/             ← No changes (interfaces, DTOs, messages complete)
src/EventHub.Domain/                  ← No changes
src/EventHub.Api/                     ← No changes (this is Function-only story)
src/frontend/                         ← No changes (this is backend-only story)
tests/EventHub.Function.Tests/Services/
  EventProcessingServiceTests.cs      ← No changes needed (6 comprehensive tests)
```

**Alignment with architecture doc:** Fully aligned. Function pattern matches `architecture.md § Implementation Patterns & Consistency Rules`. Layer separation matches `architecture.md § Architectural Boundaries`. No conflicts detected.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Service Bus message format, EventMessage contract
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions § Data Architecture] — EF Core Code-First, UNIQUE constraint for idempotency
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — 14 enforcement rules, async/await, Serilog, Clean Architecture dependency rule
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Error handling per layer (Function: try/catch → Serilog → dead-letter on retry exhaustion)
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Strategy] — xUnit + Moq for .NET Function tests; mock IEventRepository
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — Acceptance criteria, user story, BDD scenarios
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] — FR19 (async publish), FR20 (DB persist on message), FR24 (log processing errors)
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR-I1 (at-least-once), NFR-I2 (idempotent processing via Event.Id unique key)
- [Source: _bmad-output/implementation-artifacts/2-1-api-post-endpoint-and-server-side-validation.md] — Previous story: API → Service Bus publish path, JsonStringEnumConverter, test patterns
- [Source: src/EventHub.Function/Functions/ProcessEvent.cs] — Current implementation: Service Bus trigger, JSON deserialization, processing delegation
- [Source: src/EventHub.Function/Services/EventProcessingService.cs] — Current implementation: entity mapping, idempotency via UNIQUE constraint catch
- [Source: src/EventHub.Function/Program.cs] — DI: AddApplication(), AddInfrastructure(), EventProcessingService scoped
- [Source: src/EventHub.Function/host.json] — maxConcurrentCalls: 1, prefetchCount: 1 (sequential processing)
- [Source: src/EventHub.Infrastructure/Repositories/EventRepository.cs] — CreateAsync() with SaveChangesAsync()
- [Source: src/EventHub.Infrastructure/Data/Configurations/EventConfiguration.cs] — PK on Id (GUID), indexes on CreatedAt/UserId/Type, enum-as-string
- [Source: tests/EventHub.Function.Tests/Functions/ProcessEventTests.cs] — 3 existing tests for ProcessEvent
- [Source: tests/EventHub.Function.Tests/Services/EventProcessingServiceTests.cs] — 6 existing tests for EventProcessingService

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No debug issues encountered during implementation.

### Completion Notes List

- **Task 1:** Verified ProcessEvent.cs — trigger config, JSON deserialization, error propagation all correct. Replaced null-forgiveness operator (`eventMessage!`) with explicit null-check (`?? throw new InvalidOperationException`). Added `{EventId}` to success log for structured correlation.
- **Task 2:** Verified EventProcessingService.cs — all 5 property mappings correct, idempotency logic handles SQL 2627/2601, non-duplicate exceptions propagate correctly, `ProcessAsync` is virtual for Moq.
- **Task 3:** Verified existing 10 tests (3 ProcessEvent + 7 EventProcessingService). Added 3 new tests: malformed JSON exception propagation, null deserialization guard, null message handling. Total: 13 Function tests.
- **Task 4:** Build: 0 errors, 0 warnings. Tests: 29 passed (16 API + 13 Function), 0 failed.

### File List

- `src/EventHub.Function/Functions/ProcessEvent.cs` — Modified: added explicit null-check guard, improved structured logging with EventId
- `tests/EventHub.Function.Tests/Functions/ProcessEventTests.cs` — Modified: added 2 tests (malformed JSON, null deserialization)
- `tests/EventHub.Function.Tests/Services/EventProcessingServiceTests.cs` — Modified: added 1 test (null message)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: story status updated
- `_bmad-output/implementation-artifacts/2-2-azure-function-event-processing-and-db-persistence.md` — Modified: tasks marked complete, dev agent record updated

## Change Log

- **2026-02-23:** Story 2.2 implementation complete — verified existing ProcessEvent and EventProcessingService code from Story 1.5, added null-check guard for deserialized EventMessage, improved structured logging with EventId correlation, added 3 edge-case tests (malformed JSON, null deserialization, null message). Build: 0 errors/warnings. Tests: 29 passed (16 API + 13 Function).
