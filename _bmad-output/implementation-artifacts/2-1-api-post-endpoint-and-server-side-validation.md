# Story 2.1: API POST Endpoint & Server-Side Validation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **API Consumer**,
I want to submit a new event via `POST /api/events` with server-side validation,
so that valid events are accepted into the async pipeline and invalid requests are rejected with clear error details.

## Acceptance Criteria

1. **AC1: Successful Event Submission** — Given a valid `CreateEventRequest` with UserId, Type, and Description, when the API Consumer sends `POST /api/events`, then the system generates a new `Id` (GUID) and `CreatedAt` (UTC timestamp), publishes an `EventMessage` to Azure Service Bus queue via `IServiceBusPublisher`, and returns `201 Created` with an `EventResponse` body containing `id`, `userId`, `type`, `description`, `createdAt`.

2. **AC2: Validation Rejection** — Given a request with missing or invalid fields (empty UserId, invalid Type, missing Description, exceeding max lengths), when the API Consumer sends `POST /api/events`, then the API returns `400 Bad Request` with structured JSON: `{"errors": {"field": "message"}}` (FR23), and the Service Bus is NOT called — pipeline stays clean.

3. **AC3: Server Error Handling** — Given an unexpected server error during processing (e.g., Service Bus unavailable), when the API Consumer sends `POST /api/events`, then `ExceptionHandlingMiddleware` catches the error, logs it via Serilog (FR24), and returns `500` with `{"errors": {"server": "An unexpected error occurred."}}`.

## Tasks / Subtasks

- [x] Task 1: Implement EventsController.Create() method (AC: #1, #2, #3)
  - [x] Inject `IServiceBusPublisher` and `ILogger<EventsController>` via constructor DI
  - [x] Remove existing `StatusCode(501)` stub from `Create()` method
  - [x] Accept `CreateEventRequest request` parameter (DataAnnotations validation auto-applied by `[ApiController]`)
  - [x] Generate `Guid.NewGuid()` for event Id
  - [x] Generate `DateTime.UtcNow` for CreatedAt
  - [x] Create `EventMessage` from request data + generated Id + CreatedAt
  - [x] Call `await _serviceBusPublisher.PublishAsync(eventMessage)`
  - [x] Map to `EventResponse` DTO
  - [x] Return `CreatedAtAction(null, new { id = response.Id }, response)` for 201 status
  - [x] Log successful submission at Information level: `"Event {EventId} accepted and published to Service Bus"`

- [x] Task 2: Update EventsController unit tests (AC: #1, #2, #3)
  - [x] Remove existing placeholder tests that assert 501 status
  - [x] Add Moq mocks for `IServiceBusPublisher` and `ILogger<EventsController>`
  - [x] Test: valid request → 201 Created with correct EventResponse body (verify Id and CreatedAt are generated)
  - [x] Test: valid request → verify `IServiceBusPublisher.PublishAsync()` was called exactly once with correct EventMessage
  - [x] Test: verify EventMessage.Id matches response.Id (consistency)
  - [x] Test: Service Bus throws exception → verify exception propagates (middleware handles it)

- [x] Task 3: Integration-style validation tests (AC: #2)
  - [x] Create `tests/EventHub.Api.Tests/Validation/CreateEventRequestValidationTests.cs`
  - [x] Test: empty UserId → validation error on "UserId" field
  - [x] Test: UserId exceeding 100 chars → validation error
  - [x] Test: missing Description → validation error on "Description" field
  - [x] Test: Description exceeding 500 chars → validation error
  - [x] Test: invalid EventType value → validation error on "Type" field
  - [x] Test: all fields valid → no validation errors

- [x] Task 4: Build and test verification (AC: #1, #2, #3)
  - [x] Run `dotnet build` — verify 0 errors, 0 warnings across entire solution
  - [x] Run `dotnet test` — verify all existing + new tests pass
  - [ ] Manual test with Swagger UI: POST valid request → 201 with response body
  - [ ] Manual test with Swagger UI: POST invalid request → 400 with structured errors

## Dev Notes

### Critical Context — What This Story Does

This is the **first implementation story in Epic 2** (Event Submission Pipeline). It implements the API entry point for the entire async pipeline: `POST /api/events`. The controller accepts validated requests, generates system fields (Id, CreatedAt), publishes to Service Bus, and returns 201. **No database write happens here** — that's Story 2.2 (Azure Function). This story is fire-and-forget publish only.

**Data flow for this story:**
```
API Consumer → POST /api/events → [ApiController] auto-validates →
  → EventsController.Create() → IServiceBusPublisher.PublishAsync() →
    → Azure Service Bus Queue → (consumed by Function in Story 2.2)
  → Return 201 Created with EventResponse
```

### What Already Exists (DO NOT Recreate)

The entire scaffolding is complete from Epic 1. These files exist and are FUNCTIONAL:

| Component | File | Status |
|-----------|------|--------|
| Controller stub | `src/EventHub.Api/Controllers/EventsController.cs` | EXISTS — has `[HttpPost]` returning 501 |
| CreateEventRequest DTO | `src/EventHub.Application/DTOs/CreateEventRequest.cs` | EXISTS — has DataAnnotations (`[Required]`, `[MaxLength]`, `[EnumDataType]`) |
| EventResponse DTO | `src/EventHub.Application/DTOs/EventResponse.cs` | EXISTS — has Id, UserId, Type, Description, CreatedAt |
| EventMessage | `src/EventHub.Application/Messages/EventMessage.cs` | EXISTS — Service Bus contract |
| IServiceBusPublisher | `src/EventHub.Application/Interfaces/IServiceBusPublisher.cs` | EXISTS — `PublishAsync(EventMessage)` |
| ServiceBusPublisher | `src/EventHub.Infrastructure/Services/ServiceBusPublisher.cs` | EXISTS — serializes to JSON, sets MessageId for dedup |
| ExceptionHandlingMiddleware | `src/EventHub.Api/Middleware/ExceptionHandlingMiddleware.cs` | EXISTS — catches exceptions → 500 with structured JSON |
| Validation error factory | `src/EventHub.Api/Program.cs` | EXISTS — `InvalidModelStateResponseFactory` returns `{"errors": {"field": "message"}}` |
| Event entity | `src/EventHub.Domain/Entities/Event.cs` | EXISTS — GUID Id, string UserId, EventType Type, string Description, DateTime CreatedAt |
| EventType enum | `src/EventHub.Domain/Enums/EventType.cs` | EXISTS — PageView, Click, Purchase |
| DI registrations | `src/EventHub.Infrastructure/Extensions/ServiceCollectionExtensions.cs` | EXISTS — DbContext, ServiceBusClient, EventRepository, ServiceBusPublisher all registered |
| Serilog | `src/EventHub.Api/Program.cs` | EXISTS — Console sink configured |
| CORS | `src/EventHub.Api/Program.cs` | EXISTS — AllowFrontend policy for localhost:4200 |
| Swagger | `src/EventHub.Api/Program.cs` | EXISTS — enabled in Development |

**DO NOT:** Create new DTOs, interfaces, or services. **DO:** Wire existing components together in the controller.

### Architecture Patterns & Constraints

**MUST FOLLOW — Enforcement Rules relevant to this story:**

- **Rule #3:** Return API errors in `{"errors": {"field": "message"}}` format — no exceptions. ALREADY handled by `InvalidModelStateResponseFactory` in Program.cs for validation errors, and by `ExceptionHandlingMiddleware` for 500 errors.
- **Rule #4:** Use `async/await` in all C# code — never `.Result` or `.Wait()`
- **Rule #7:** Use Serilog structured logging — never `Console.WriteLine`. Use `_logger.LogInformation("Event {EventId} accepted", id)` with structured property placeholders.
- **Rule #8:** Use `[ApiController]` attribute — never manual `ModelState.IsValid` checks. The `[ApiController]` attribute auto-validates and returns 400 via the custom `InvalidModelStateResponseFactory`.
- **Rule #13:** Follow Clean Architecture dependency rule — controller injects interfaces from Application layer, never concrete Infrastructure classes.
- **Rule #14:** Interface definitions in `EventHub.Application/Interfaces/` — implementations in `EventHub.Infrastructure/`. Already done.

**NFR Compliance:**
- **NFR-P1:** POST response must not exceed 500ms at 95th percentile. The publish is fire-and-forget (Service Bus SDK handles connection pooling via singleton `ServiceBusClient`). No DB call in this endpoint.
- **NFR-S3:** Connection strings in config, not code. Already handled by Infrastructure DI registration.
- **NFR-M1:** API layer must contain no direct database access code. This endpoint does NOT call `IEventRepository` — it only publishes to Service Bus.

### Implementation Pattern — EventsController.Create()

The controller method should follow this exact pattern:

```csharp
[HttpPost]
[ProducesResponseType(typeof(EventResponse), StatusCodes.Status201Created)]
[ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
public async Task<ActionResult<EventResponse>> Create(CreateEventRequest request)
{
    var id = Guid.NewGuid();
    var createdAt = DateTime.UtcNow;

    var eventMessage = new EventMessage
    {
        Id = id,
        UserId = request.UserId,
        Type = request.Type,
        Description = request.Description,
        CreatedAt = createdAt
    };

    await _serviceBusPublisher.PublishAsync(eventMessage);

    _logger.LogInformation("Event {EventId} accepted and published to Service Bus", id);

    var response = new EventResponse
    {
        Id = id,
        UserId = request.UserId,
        Type = request.Type,
        Description = request.Description,
        CreatedAt = createdAt
    };

    return CreatedAtAction(null, new { id = response.Id }, response);
}
```

**Key decisions in this pattern:**
1. **`Guid.NewGuid()` + `DateTime.UtcNow`** generated server-side — never accepted from client input (per data model constraints)
2. **`EventMessage`** (not `Event` entity) is published to Service Bus — this is the messaging contract, not the domain entity
3. **No `IEventRepository` call** — the API does not write to the database. Story 2.2 (Azure Function) handles DB persistence.
4. **`CreatedAtAction(null, ...)`** returns 201 with Location header. Using `null` for action name since there is no GET-by-ID endpoint yet.
5. **`[ProducesResponseType]`** attributes enable Swagger documentation of response types (Story 5.3 will benefit)
6. **Service Bus failure propagates** — if `PublishAsync()` throws, `ExceptionHandlingMiddleware` catches it and returns structured 500. No try/catch needed in the controller.

### Validation — How It Works (Already Configured)

The validation pipeline is ALREADY COMPLETE from Story 1.4. Here's how it flows:

```
Request body → ASP.NET model binding → DataAnnotations validation →
  → [ApiController] checks ModelState →
    → If invalid: InvalidModelStateResponseFactory returns 400 with {"errors": {...}}
    → If valid: Controller method executes
```

**CreateEventRequest validation rules (existing):**
- `UserId`: `[Required]`, `[MaxLength(100)]` → errors: "The UserId field is required.", "The field UserId must be a string with a maximum length of 100."
- `Type`: `[Required]`, `[EnumDataType(typeof(EventType))]` → errors: "The Type field is required.", "The field Type is invalid."
- `Description`: `[Required]`, `[MaxLength(500)]` → errors: "The Description field is required.", "The field Description must be a string with a maximum length of 500."

**Custom InvalidModelStateResponseFactory (in Program.cs):**
```csharp
options.InvalidModelStateResponseFactory = context =>
{
    var errors = context.ModelState
        .Where(e => e.Value?.Errors.Count > 0)
        .ToDictionary(
            e => e.Key,
            e => e.Value!.Errors.First().ErrorMessage);
    return new BadRequestObjectResult(new { errors });
};
```

**DO NOT add manual `ModelState.IsValid` checks.** The `[ApiController]` attribute handles this automatically.

### JSON Serialization Notes

The API uses `System.Text.Json` (ASP.NET Core default):
- **Property naming:** camelCase by default (`userId`, `createdAt`, `type`)
- **Enum serialization:** By default, enums serialize as integers. **CRITICAL CHECK:** Verify if `JsonStringEnumConverter` is configured in `Program.cs` or `JsonSerializerOptions`. The architecture specifies enums as strings in JSON (`"PageView"`, not `0`). If not configured, add `builder.Services.Configure<JsonOptions>(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));` to Program.cs.
- **Null handling:** `DefaultIgnoreCondition = WhenWritingNull` should be set (per architecture). Check if configured.

### Error Response Format (FR23)

All errors must follow this format:
```json
// 400 Bad Request (validation)
{
  "errors": {
    "userId": "The UserId field is required.",
    "type": "The field Type is invalid."
  }
}

// 500 Internal Server Error (unhandled)
{
  "errors": {
    "server": "An unexpected error occurred."
  }
}
```

**Both are already implemented:**
- 400: `InvalidModelStateResponseFactory` in Program.cs
- 500: `ExceptionHandlingMiddleware` in Middleware/

### ServiceBusPublisher Behavior

The existing `ServiceBusPublisher` (Infrastructure layer):
- Serializes `EventMessage` to JSON via `System.Text.Json`
- Sets `ServiceBusMessage.MessageId = message.Id.ToString()` (GUID → string for deduplication per ADR-2)
- Sets `ContentType = "application/json"`
- Queue name: `"events"` (hardcoded in publisher constructor)
- Uses singleton `ServiceBusClient` (connection pooled) with scoped `ServiceBusPublisher` (creates `ServiceBusSender` per instance)

**Potential runtime issue:** If `ConnectionStrings:ServiceBus` is empty/placeholder, `ServiceBusClient` constructor will throw. This is expected in local dev without a real Service Bus instance. `ExceptionHandlingMiddleware` will catch and return 500.

### Testing Strategy

**Unit tests (xUnit + Moq):**

| Test | What it verifies | Mock setup |
|------|-----------------|------------|
| `Create_ValidRequest_Returns201WithResponse` | 201 status, response body has Id/CreatedAt/matching fields | Mock `IServiceBusPublisher` → returns Task.CompletedTask |
| `Create_ValidRequest_PublishesEventMessage` | `PublishAsync` called once with correct EventMessage | Mock `IServiceBusPublisher` → verify call with argument matcher |
| `Create_ValidRequest_EventMessageIdMatchesResponseId` | Consistency between published message and response | Capture EventMessage argument, compare Id |
| `Create_ServiceBusThrows_ExceptionPropagates` | Exception not swallowed | Mock `IServiceBusPublisher` → throws ServiceBusException |

**Validation tests (DataAnnotations):**

Use `System.ComponentModel.DataAnnotations.Validator.TryValidateObject()` to test DTO validation rules directly (no need to spin up ASP.NET test server):

```csharp
var request = new CreateEventRequest { UserId = "", Type = EventType.Click, Description = "test" };
var context = new ValidationContext(request);
var results = new List<ValidationResult>();
var isValid = Validator.TryValidateObject(request, context, results, validateAllProperties: true);
Assert.False(isValid);
Assert.Contains(results, r => r.MemberNames.Contains("UserId"));
```

**Existing tests to remove:**
- `EventsControllerTests.Create_ReturnsNotImplemented` — replace with real tests
- Keep `GetAll_ReturnsNotImplemented` — that's Story 3.1

### Previous Story Intelligence

**From Story 1.5 (Azure Function Scaffold):**
- `EventProcessingService` is ready to consume messages from Service Bus queue `"events"`
- Message deserialization uses `PropertyNameCaseInsensitive = true` + `JsonStringEnumConverter` — the API must serialize enums consistently (verify string enum serialization in API)
- `Serilog.Settings.Configuration` package was needed additionally — already installed in API project via `Serilog.AspNetCore`

**From Story 1.6 (Angular SPA Foundation):**
- Frontend `EventService` will call `POST ${environment.apiUrl}/api/events` in Story 2.3
- NgRx submission store will dispatch actions on success/failure in Story 2.3
- CORS is configured for `localhost:4200` — Angular can reach the API

**From Story 1.4 (API Scaffold):**
- `Serilog.AspNetCore` 10.0.0 used — includes `ReadFrom.Configuration()` support
- Custom validation error response factory configured — FR23 compliant
- `ExceptionHandlingMiddleware` returns structured 500 errors — FR24 compliant
- Swagger enabled in Development — available for manual testing

### Git Intelligence

Recent commit pattern:
```
d163efc feat: 1-5-azure-function-scaffold - Azure Function Scaffold
93db1eb feat(1-4-api-scaffold-and-configuration): story complete (#2)
62b84f2 feat: 1-4-api-scaffold-and-configuration - API Scaffold & Configuration
755574b feat: 1-3-infrastructure-layer-and-database-setup - Infrastructure Layer & Database Setup
```

- Branch naming: `feature/{story-key}`
- Commit message: `feat: {story-key} - {story title}`
- All .NET patterns established: Clean Architecture, Serilog, DI via extensions, xUnit + Moq testing
- API project last modified in Story 1.4 — controller stubs, middleware, Program.cs composition root

### Latest Technical Specifics

- **ASP.NET Core 8.0 LTS** — stable, no breaking changes since scaffold. `[ApiController]` auto-validation, `CreatedAtAction`, `[ProducesResponseType]` all standard.
- **Azure.Messaging.ServiceBus 7.20.1** — current stable. `ServiceBusMessage.MessageId` for dedup. No changes needed.
- **System.Text.Json** — built-in to .NET 8. `JsonStringEnumConverter` available in `System.Text.Json.Serialization`.
- **xUnit 2.4.2 + Moq 4.20** — standard test stack. Use `It.Is<EventMessage>(m => m.Id == expectedId)` for argument matching.

### Project Structure Notes

**Files to MODIFY:**
```
src/EventHub.Api/
  Controllers/
    EventsController.cs                    ← MODIFY (implement Create method, add DI)
  Program.cs                               ← POSSIBLY MODIFY (add JsonStringEnumConverter if missing)

tests/EventHub.Api.Tests/
  Controllers/
    EventsControllerTests.cs               ← MODIFY (replace 501 tests with real tests)
```

**Files to CREATE:**
```
tests/EventHub.Api.Tests/
  Validation/
    CreateEventRequestValidationTests.cs   ← NEW (DataAnnotations validation tests)
```

**Files NOT to modify:**
```
src/EventHub.Domain/                       ← No changes
src/EventHub.Application/                  ← No changes (DTOs, interfaces already complete)
src/EventHub.Infrastructure/               ← No changes (ServiceBusPublisher, EventRepository already complete)
src/EventHub.Function/                     ← No changes
src/frontend/                              ← No changes (this is backend-only story)
tests/EventHub.Function.Tests/             ← No changes
```

**Alignment with architecture doc:** Fully aligned. Controller pattern matches `architecture.md § API & Communication Patterns`. Error handling matches `architecture.md § Process Patterns`. No conflicts detected.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Controller-based API, `[ApiController]`, POST /api/events contract
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions § Data Architecture] — DataAnnotations validation, CreateEventRequest structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — 14 enforcement rules, naming conventions, error response format
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — API response JSON examples (success 201, error 400/500)
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — Service Bus message format, MessageId for dedup
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Error handling per layer (API: [ApiController] auto-validates + ExceptionHandlingMiddleware)
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Strategy] — xUnit + Moq for .NET; unit tests only for MVP
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria, user story, BDD scenarios
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] — FR1 (submit event), FR15 (POST returns Id), FR19 (async publish), FR21 (server-side validation), FR22 (reject malformed), FR23 (JSON error format), FR24 (log errors)
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR-P1 (POST < 500ms), NFR-I1 (at-least-once), NFR-M1 (layer separation)
- [Source: _bmad-output/implementation-artifacts/1-5-azure-function-scaffold.md] — EventProcessingService pattern, JsonStringEnumConverter requirement, Serilog patterns
- [Source: _bmad-output/implementation-artifacts/1-4-api-scaffold-and-configuration.md] — Program.cs composition root, InvalidModelStateResponseFactory, ExceptionHandlingMiddleware
- [Source: src/EventHub.Api/Controllers/EventsController.cs] — Current stub (501 NotImplemented)
- [Source: src/EventHub.Api/Program.cs] — DI setup, CORS, Swagger, validation factory, middleware pipeline
- [Source: src/EventHub.Application/DTOs/CreateEventRequest.cs] — DataAnnotations validation rules
- [Source: src/EventHub.Application/Interfaces/IServiceBusPublisher.cs] — PublishAsync(EventMessage) contract
- [Source: src/EventHub.Infrastructure/Services/ServiceBusPublisher.cs] — JSON serialization, MessageId dedup, queue "events"
- [Source: tests/EventHub.Api.Tests/Controllers/EventsControllerTests.cs] — Existing placeholder tests to replace

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No debug issues encountered. Build succeeded 0 errors 0 warnings on first attempt.

### Completion Notes List

- **Task 1:** Implemented `EventsController.Create()` with DI for `IServiceBusPublisher` and `ILogger<EventsController>`. Method generates GUID Id and UTC CreatedAt, creates EventMessage, publishes to Service Bus, and returns 201 Created with EventResponse. Added `[ProducesResponseType]` attributes for Swagger documentation. Added `JsonStringEnumConverter` to Program.cs for consistent enum serialization as strings (required by Azure Function consumer per Story 1.5 intelligence).
- **Task 2:** Replaced placeholder 501 test with 4 real unit tests using Moq: valid request returns 201, PublishAsync called once with correct message, EventMessage.Id matches response.Id, Service Bus exception propagates. Kept `GetAll_Returns501NotImplemented` test (Story 3.1 scope).
- **Task 3:** Created `CreateEventRequestValidationTests.cs` with 6 DataAnnotations validation tests covering all fields: empty UserId, UserId >100 chars, empty Description, Description >500 chars, invalid EventType value, all-valid scenario.
- **Task 4:** Full solution build: 0 errors, 0 warnings. Full test suite: 26/26 passed (16 API + 10 Function). No regressions. Manual Swagger UI tests left for user verification during review (requires running Service Bus instance).

### Change Log

- 2026-02-23: Implemented POST /api/events endpoint — controller wires existing DTOs, interfaces, and Service Bus publisher together. Added JsonStringEnumConverter for consistent JSON enum serialization. Replaced placeholder unit tests with comprehensive test suite (10 new tests). All 26 tests pass.

### File List

- `src/EventHub.Api/Controllers/EventsController.cs` — MODIFIED (implemented Create method with DI, removed 501 stub)
- `src/EventHub.Api/Program.cs` — MODIFIED (added JsonStringEnumConverter to JSON options)
- `tests/EventHub.Api.Tests/Controllers/EventsControllerTests.cs` — MODIFIED (replaced placeholder tests with Moq-based unit tests)
- `tests/EventHub.Api.Tests/Validation/CreateEventRequestValidationTests.cs` — NEW (DataAnnotations validation tests)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status: ready-for-dev → in-progress → review)
- `_bmad-output/implementation-artifacts/2-1-api-post-endpoint-and-server-side-validation.md` — MODIFIED (tasks marked complete, Dev Agent Record filled)
