# Story 5.3: Swagger/OpenAPI Documentation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **API Consumer**,
I want comprehensive API documentation accessible via Swagger UI,
so that I can understand and integrate with Event Hub API without reading source code.

## Acceptance Criteria

1. **Given** the API is running in Development mode, **When** the API Consumer navigates to `/swagger`, **Then** Swagger UI displays all available endpoints: `POST /api/events`, `GET /api/events`, `POST /api/negotiate`.

2. **Given** the Swagger UI is open, **When** the API Consumer inspects `POST /api/events`, **Then** the request schema shows `CreateEventRequest` with field descriptions, types, and validation constraints **And** the response schemas show `EventResponse` (201) and error format `{"errors": {...}}` (400, 500).

3. **Given** the Swagger UI is open, **When** the API Consumer inspects `GET /api/events`, **Then** all query parameters are documented: `type`, `userId`, `description`, `from`, `to`, `page`, `pageSize`, `sortBy`, `sortDir` **And** the response schema shows `PagedResult<EventResponse>`.

4. **Given** the Swagger documentation, **When** reviewed for completeness, **Then** XML comments on controller methods provide operation summaries and parameter descriptions.

## Tasks / Subtasks

- [x] Task 1: Enable XML documentation file generation (AC: #4)
  - [x] 1.1 In `src/EventHub.Api/EventHub.Api.csproj`, add `<GenerateDocumentationFile>true</GenerateDocumentationFile>` and `<NoWarn>$(NoWarn);1591</NoWarn>` to the `<PropertyGroup>` — the 1591 suppression prevents "missing XML comment" build warnings for non-controller members
  - [x] 1.2 In `src/EventHub.Application/EventHub.Application.csproj`, add `<GenerateDocumentationFile>true</GenerateDocumentationFile>` and `<NoWarn>$(NoWarn);1591</NoWarn>` — required for DTO property descriptions to appear in Swagger
  - [x] 1.3 Verify `dotnet build` succeeds with zero errors after the csproj changes

- [ ] Task 2: Configure Swashbuckle to use XML comments and API metadata (AC: #1, #2, #3, #4)
  - [ ] 2.1 In `src/EventHub.Api/Program.cs`, replace the bare `builder.Services.AddSwaggerGen()` call with a configured version that sets `c.SwaggerDoc("v1", new OpenApiInfo {...})` with title "Event Hub API", version "v1", and a short description
  - [ ] 2.2 In the same `AddSwaggerGen()` call, add the XML comments include for the Api project: `var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml"; var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile); c.IncludeXmlComments(xmlPath);`
  - [ ] 2.3 Also include the Application layer XML file: `var appXmlFile = "EventHub.Application.xml"; var appXmlPath = Path.Combine(AppContext.BaseDirectory, appXmlFile); c.IncludeXmlComments(appXmlPath, includeControllerXmlComments: false);` — adds DTO property descriptions to Swagger schemas
  - [ ] 2.4 Add `using System.Reflection;` and `using Microsoft.OpenApi.Models;` at the top of `Program.cs`

- [ ] Task 3: Add XML documentation to `EventsController` (AC: #2, #3, #4)
  - [ ] 3.1 Add `/// <summary>Submits a new event to the processing pipeline.</summary>` + `/// <param name="request">Event creation payload with UserId, Type, and Description.</param>` + `/// <returns>The created event with generated Id and CreatedAt timestamp.</returns>` above the `[HttpPost]` `Create` action
  - [ ] 3.2 Add `[ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]` to the `Create` action to document the 500 error scenario (matches AC#2 requirement)
  - [ ] 3.3 Replace the existing partial `/// <summary>` block on the `GetAll` action with a complete XML doc: `/// <summary>Retrieves a paginated, filtered, and sorted list of events.</summary>` + `/// <param name="filter">Query parameters: type, userId, description, from, to, page, pageSize, sortBy, sortDir.</param>` + `/// <returns>Paged result with items, totalCount, page, and pageSize.</returns>`
  - [ ] 3.4 Add `[ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]` to the `GetAll` action

- [ ] Task 4: Add XML documentation to `NegotiateController` (AC: #1, #4)
  - [ ] 4.1 Add `/// <summary>Returns Azure SignalR Service connection info for client WebSocket connections.</summary>` + `/// <returns>SignalR negotiation response with endpoint URL and access token.</returns>` above the `[HttpPost]` `Negotiate` action
  - [ ] 4.2 Add `[ProducesResponseType(typeof(object), StatusCodes.Status200OK)]` to the `Negotiate` action — documents the 200 response explicitly in Swagger UI

- [ ] Task 5: Add XML documentation to Application DTOs (AC: #2, #3, #4)
  - [ ] 5.1 In `src/EventHub.Application/DTOs/CreateEventRequest.cs`, add `/// <summary>` doc comments above the class and above each property: `UserId` ("Identifier of the user submitting the event. Max 100 characters."), `Type` ("Event type: PageView, Click, or Purchase."), `Description` ("Human-readable event description. Max 500 characters.")
  - [ ] 5.2 In `src/EventHub.Application/DTOs/EventResponse.cs`, add class-level and property-level `/// <summary>` comments: `Id` ("Unique event identifier (GUID)."), `UserId`, `Type`, `Description`, `CreatedAt` ("UTC timestamp of event creation. ISO 8601 format.")
  - [ ] 5.3 In `src/EventHub.Application/DTOs/EventFilter.cs`, add class-level `/// <summary>` and property docs for all 9 properties matching the query parameter names in Swagger
  - [ ] 5.4 In `src/EventHub.Application/DTOs/PagedResult.cs`, add class-level and property docs: `Items`, `TotalCount`, `Page`, `PageSize`

- [ ] Task 6: Unit tests — verify ProducesResponseType completeness (AC: #2, #3)
  - [ ] 6.1 In `tests/EventHub.Api.Tests/Controllers/EventsControllerTests.cs`, add a test using reflection: `Create_Action_HasProducesResponseType_201()` — verifies `[ProducesResponseType(201)]` attribute exists on the `Create` method
  - [ ] 6.2 Add `Create_Action_HasProducesResponseType_400()` — verifies `[ProducesResponseType(400)]` attribute exists
  - [ ] 6.3 Add `Create_Action_HasProducesResponseType_500()` — verifies `[ProducesResponseType(500)]` attribute exists (new, added in Task 3.2)
  - [ ] 6.4 Add `GetAll_Action_HasProducesResponseType_200()` — verifies `[ProducesResponseType(200)]` attribute exists on `GetAll`
  - [ ] 6.5 Add `GetAll_Action_HasProducesResponseType_500()` — verifies `[ProducesResponseType(500)]` attribute exists on `GetAll` (new)
  - [ ] 6.6 Verify `dotnet build` succeeds with zero errors and `dotnet test` passes all tests

## Dev Notes

### Architecture Patterns & Constraints

- **Clean Architecture (ADR-4):** This is a backend-only story. All changes are in `src/EventHub.Api/` and `src/EventHub.Application/`. No Angular frontend changes. No Function changes.
- **Enforcement Rule #8:** `[ApiController]` already on controllers — automatic `ModelState` validation with 400 responses is already working. Story 5.3 only *documents* it in Swagger.
- **Enforcement Rule #13:** Application layer must NOT reference API layer. Adding XML docs to DTOs in `EventHub.Application` is safe — XML comments have no runtime dependencies.
- **Enforcement Rule #3:** All errors follow `{"errors": {"field": "message"}}` format. The 400 response in Swagger should describe `{"errors": {...}}`, not the default validation problem details format (which is already overridden in `Program.cs`).
- **Swashbuckle.AspNetCore v6.4.0** is already installed in `EventHub.Api.csproj` — no new packages needed.

### Current State (Confirmed by File Reads)

| File | Current State | What Story 5.3 Adds |
|------|--------------|---------------------|
| `EventHub.Api.csproj` | No `<GenerateDocumentationFile>` | Add GenerateDocumentationFile + NoWarn 1591 |
| `EventHub.Application.csproj` | No `<GenerateDocumentationFile>` | Add GenerateDocumentationFile + NoWarn 1591 |
| `Program.cs` | `AddSwaggerGen()` bare, no config | Add OpenApiInfo + IncludeXmlComments |
| `EventsController.cs [HttpPost]` | `[ProducesResponseType(201)]`, `[ProducesResponseType(400)]`, NO summary | Add `/// <summary>`, add `[ProducesResponseType(500)]` |
| `EventsController.cs [HttpGet]` | Partial `/// <summary>` comment, `[ProducesResponseType(200)]`, NO 500 | Complete summary, add `[ProducesResponseType(500)]` |
| `NegotiateController.cs [HttpPost]` | No docs, no `[ProducesResponseType]` | Add `/// <summary>`, add `[ProducesResponseType(200)]` |
| `CreateEventRequest.cs` | DataAnnotations only, no XML comments | Add class + property `/// <summary>` |
| `EventResponse.cs` | No XML comments | Add class + property `/// <summary>` |
| `EventFilter.cs` | No XML comments | Add class + property `/// <summary>` |
| `PagedResult.cs` | No XML comments | Add class + property `/// <summary>` |

### Critical Implementation Details

#### Task 1: csproj Changes

**`src/EventHub.Api/EventHub.Api.csproj`:**
```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <InvariantGlobalization>false</InvariantGlobalization>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
```

> **Why `NoWarn 1591`?** CS1591 is "Missing XML comment for publicly visible type or member". Without suppression, the build warns for every public member without a `/// <summary>`. We only want docs on controllers + DTOs — not on `Program.cs`, middleware, etc. The 1591 suppression lets us add docs selectively without drowning in warnings.

**`src/EventHub.Application/EventHub.Application.csproj`:**
```xml
<PropertyGroup>
  <TargetFramework>net8.0</TargetFramework>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
```

#### Task 2: Program.cs `AddSwaggerGen()` Configuration

```csharp
using System.Reflection;
using Microsoft.OpenApi.Models;

// Replace bare AddSwaggerGen() with:
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Event Hub API",
        Version = "v1",
        Description = "REST API for submitting and querying events. Supports server-side filtering, sorting, and pagination."
    });

    // Include XML comments from Api project
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);

    // Include XML comments from Application layer (DTO property descriptions)
    var appXmlFile = "EventHub.Application.xml";
    var appXmlPath = Path.Combine(AppContext.BaseDirectory, appXmlFile);
    if (File.Exists(appXmlPath))
    {
        c.IncludeXmlComments(appXmlPath);
    }
});
```

> **Why `File.Exists` guard on Application XML?** In production builds or clean CI environments, the Application XML may not be copied to the output directory if not referenced. The guard prevents a `FileNotFoundException` at startup while keeping the code resilient.

> **`AddEndpointsApiExplorer()` is already in `Program.cs`** — do NOT add it again. It's required for Swashbuckle + minimal APIs; for controllers, it's already sufficient.

#### Task 3: `EventsController.cs` XML Docs

```csharp
/// <summary>
/// Submits a new event to the processing pipeline.
/// </summary>
/// <param name="request">Event creation payload with UserId, Type, and Description.</param>
/// <returns>The created event with generated Id and CreatedAt timestamp.</returns>
/// <response code="201">Event accepted and queued for async processing.</response>
/// <response code="400">Validation failed — returns field-level error details: {"errors": {"field": "message"}}.</response>
/// <response code="500">Unexpected server error — returns {"errors": {"server": "An unexpected error occurred."}}.</response>
[HttpPost]
[ProducesResponseType(typeof(EventResponse), StatusCodes.Status201Created)]
[ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
public async Task<ActionResult<EventResponse>> Create(CreateEventRequest request)
```

```csharp
/// <summary>
/// Retrieves a paginated, filtered, and sorted list of events.
/// </summary>
/// <param name="filter">Query parameters: type, userId, description, from, to, page, pageSize, sortBy, sortDir.</param>
/// <returns>Paged result containing items, totalCount, page, and pageSize.</returns>
/// <response code="200">Successfully retrieved events.</response>
/// <response code="500">Unexpected server error — returns {"errors": {"server": "An unexpected error occurred."}}.</response>
[HttpGet]
[ProducesResponseType(typeof(PagedResult<EventResponse>), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
public async Task<ActionResult<PagedResult<EventResponse>>> GetAll([FromQuery] EventFilter filter)
```

> **`/// <response>` tags** are recognized by Swashbuckle and populate the "Responses" section in Swagger UI with the description text. They complement `[ProducesResponseType]` attributes — the attribute provides the HTTP status code and type, the XML tag provides the human-readable description.

#### Task 4: `NegotiateController.cs` XML Docs

```csharp
/// <summary>
/// Returns Azure SignalR Service connection info for establishing a client WebSocket connection.
/// </summary>
/// <returns>SignalR negotiation response containing endpoint URL and access token.</returns>
/// <response code="200">Negotiation successful — client can proceed to connect via WebSocket.</response>
[HttpPost]
[ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
public async Task<IActionResult> Negotiate(CancellationToken cancellationToken)
```

#### Task 5: DTO XML Documentation

**`CreateEventRequest.cs`:**
```csharp
/// <summary>
/// Request model for submitting a new event.
/// </summary>
public class CreateEventRequest
{
    /// <summary>Identifier of the user submitting the event. Max 100 characters.</summary>
    [Required]
    [MaxLength(100)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>Event type: PageView, Click, or Purchase.</summary>
    [Required]
    [EnumDataType(typeof(EventType))]
    public EventType Type { get; set; }

    /// <summary>Human-readable description of the event. Max 500 characters.</summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
}
```

**`EventResponse.cs`:**
```csharp
/// <summary>
/// Response model representing a persisted event.
/// </summary>
public class EventResponse
{
    /// <summary>Unique event identifier (GUID).</summary>
    public Guid Id { get; set; }

    /// <summary>Identifier of the user who submitted the event.</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>Event type: PageView, Click, or Purchase.</summary>
    public EventType Type { get; set; }

    /// <summary>Human-readable description of the event.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>UTC timestamp of event creation. ISO 8601 format (e.g., "2026-02-24T12:00:00Z").</summary>
    public DateTime CreatedAt { get; set; }
}
```

**`EventFilter.cs`:**
```csharp
/// <summary>
/// Query parameters for filtering, sorting, and paginating the events list.
/// </summary>
public class EventFilter
{
    /// <summary>Filter by event type (PageView, Click, or Purchase). Optional.</summary>
    public EventType? Type { get; set; }

    /// <summary>Filter by exact UserId match. Optional.</summary>
    public string? UserId { get; set; }

    /// <summary>Filter by Description substring (case-insensitive contains). Optional.</summary>
    public string? Description { get; set; }

    /// <summary>Filter events created on or after this UTC date. Optional.</summary>
    public DateTime? From { get; set; }

    /// <summary>Filter events created on or before this UTC date. Optional.</summary>
    public DateTime? To { get; set; }

    /// <summary>Page number (1-based). Default: 1.</summary>
    public int Page { get; set; } = 1;

    /// <summary>Number of items per page. Default: 20.</summary>
    public int PageSize { get; set; } = 20;

    /// <summary>Field to sort by: id, userId, type, description, createdAt. Default: createdAt.</summary>
    public string SortBy { get; set; } = "createdAt";

    /// <summary>Sort direction: asc or desc. Default: desc.</summary>
    public string SortDir { get; set; } = "desc";
}
```

#### Task 6: Unit Tests (Reflection-Based Attribute Verification)

```csharp
// In EventsControllerTests.cs — add to existing test class

[Fact]
public void Create_Action_HasProducesResponseType_201()
{
    var method = typeof(EventsController).GetMethod(nameof(EventsController.Create));
    var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
        .FirstOrDefault(a => a.StatusCode == StatusCodes.Status201Created);
    Assert.NotNull(attr);
}

[Fact]
public void Create_Action_HasProducesResponseType_400()
{
    var method = typeof(EventsController).GetMethod(nameof(EventsController.Create));
    var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
        .FirstOrDefault(a => a.StatusCode == StatusCodes.Status400BadRequest);
    Assert.NotNull(attr);
}

[Fact]
public void Create_Action_HasProducesResponseType_500()
{
    var method = typeof(EventsController).GetMethod(nameof(EventsController.Create));
    var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
        .FirstOrDefault(a => a.StatusCode == StatusCodes.Status500InternalServerError);
    Assert.NotNull(attr);
}

[Fact]
public void GetAll_Action_HasProducesResponseType_200()
{
    var method = typeof(EventsController).GetMethod(nameof(EventsController.GetAll));
    var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
        .FirstOrDefault(a => a.StatusCode == StatusCodes.Status200OK);
    Assert.NotNull(attr);
}

[Fact]
public void GetAll_Action_HasProducesResponseType_500()
{
    var method = typeof(EventsController).GetMethod(nameof(EventsController.GetAll));
    var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
        .FirstOrDefault(a => a.StatusCode == StatusCodes.Status500InternalServerError);
    Assert.NotNull(attr);
}
```

> **Why reflection-based tests?** The story's acceptance criteria require `[ProducesResponseType]` attributes to be present so Swagger can document them. Reflection tests verify this contract at the code level without requiring a running server. This matches the project's xUnit + Moq unit test strategy (no integration or E2E tests in MVP scope per architecture doc).

### Critical Anti-Patterns to Avoid

- **DO NOT** add `<GenerateDocumentationFile>true</GenerateDocumentationFile>` without `<NoWarn>$(NoWarn);1591</NoWarn>` — the build will emit hundreds of CS1591 warnings for every public member in Application and Api layers without XML comments.
- **DO NOT** remove the existing `[ProducesResponseType(typeof(EventResponse), 201)]` and `[ProducesResponseType(typeof(object), 400)]` from `EventsController` — only ADD the missing 500 attribute.
- **DO NOT** add `<GenerateDocumentationFile>` to `EventHub.Domain.csproj`, `EventHub.Infrastructure.csproj`, or Function projects — only Api and Application layers need it for Swagger.
- **DO NOT** use `/// <remarks>` tags as a substitute for `/// <response>` — Swashbuckle requires `/// <response code="N">` syntax to populate the Responses section.
- **DO NOT** hardcode the XML file path (e.g., `"EventHub.Api.xml"`) — use `Assembly.GetExecutingAssembly().GetName().Name + ".xml"` to handle project renames correctly.
- **DO NOT** add XML comments to `Program.cs` or `ExceptionHandlingMiddleware.cs` — these are not public API surface; the 1591 suppression already handles them.
- **DO NOT** use `EnableAnnotations()` in `AddSwaggerGen()` — the project already uses `[ProducesResponseType]` attributes (standard ASP.NET Core approach), not Swashbuckle annotations. Mixing both causes duplication.
- **DO NOT** add `[SwaggerOperation]` or `[SwaggerResponse]` Swashbuckle-specific attributes — use standard XML comments + `[ProducesResponseType]` per architecture enforcement rules (no extra packages).
- **DO NOT** change `app.UseSwaggerUI()` — the default Swagger UI path `/swagger` already satisfies AC#1.
- **DO NOT** add `includeControllerXmlComments: true` to the Application XML include — controller-level XML comments come from the Api assembly, not Application. The Application XML provides only DTO property docs.

### Project Structure Notes

#### Files to MODIFY:

| File | Change |
|------|--------|
| `src/EventHub.Api/EventHub.Api.csproj` | Add `<GenerateDocumentationFile>true</GenerateDocumentationFile>` + `<NoWarn>$(NoWarn);1591</NoWarn>` |
| `src/EventHub.Application/EventHub.Application.csproj` | Add `<GenerateDocumentationFile>true</GenerateDocumentationFile>` + `<NoWarn>$(NoWarn);1591</NoWarn>` |
| `src/EventHub.Api/Program.cs` | Replace bare `AddSwaggerGen()` with configured version (OpenApiInfo + IncludeXmlComments); add `using System.Reflection;` + `using Microsoft.OpenApi.Models;` |
| `src/EventHub.Api/Controllers/EventsController.cs` | Add `/// <summary>` + `/// <param>` + `/// <response>` to both actions; add `[ProducesResponseType(500)]` to both |
| `src/EventHub.Api/Controllers/NegotiateController.cs` | Add `/// <summary>` + `/// <response>` to `Negotiate` action; add `[ProducesResponseType(200)]` |
| `src/EventHub.Application/DTOs/CreateEventRequest.cs` | Add class + property `/// <summary>` docs |
| `src/EventHub.Application/DTOs/EventResponse.cs` | Add class + property `/// <summary>` docs |
| `src/EventHub.Application/DTOs/EventFilter.cs` | Add class + property `/// <summary>` docs |
| `src/EventHub.Application/DTOs/PagedResult.cs` | Add class + property `/// <summary>` docs |
| `tests/EventHub.Api.Tests/Controllers/EventsControllerTests.cs` | Add 5 reflection-based `[ProducesResponseType]` verification tests |

#### Files NOT to touch:

| File | Reason |
|------|--------|
| `src/EventHub.Domain/**` | No public API surface to document |
| `src/EventHub.Infrastructure/**` | Internal implementation layer; not exposed in Swagger |
| `src/EventHub.Function/**` | Azure Function does not have a Swagger endpoint |
| `src/EventHub.Api/Middleware/ExceptionHandlingMiddleware.cs` | Internal middleware; not part of API surface |
| `src/frontend/**` | Frontend-agnostic story; no Angular changes |
| `tests/EventHub.Api.Tests/Controllers/NegotiateControllerTests.cs` | NegotiateController tests already exist; no new tests needed there |
| `tests/EventHub.Function.Tests/**` | Function tests unaffected |

### Library & Framework Requirements

| Package | Version | Status |
|---------|---------|--------|
| `Swashbuckle.AspNetCore` | `6.4.0` | Already installed in `EventHub.Api.csproj` — **no new packages needed** |
| `Microsoft.OpenApi.Models` | Included with Swashbuckle | Already available — just add `using` |

**No new NuGet packages required.** `OpenApiInfo` and `IncludeXmlComments` are part of the already-installed Swashbuckle.AspNetCore package.

### Testing Requirements

**Framework:** xUnit + Moq (already configured in `tests/EventHub.Api.Tests/`)

**Reflection-based approach rationale:** Swagger integration tests (calling `/swagger/v1/swagger.json` via WebApplicationFactory) would require a full test host with all Azure services mocked (SignalR connection string, Service Bus, SQL). Reflection tests validate the same contract — that `[ProducesResponseType]` attributes are present — without infrastructure complexity. This aligns with the architecture's "unit tests only for MVP" strategy.

**Existing test pattern to follow:**
```csharp
// Existing tests in EventsControllerTests.cs already:
// - Use _controller = new EventsController(...mocks...) directly (no WebApplicationFactory)
// - Follow xUnit [Fact] convention
// - New reflection tests follow the same pattern (no additional mocks needed)
```

**Additional required imports for test file:**
```csharp
using Microsoft.AspNetCore.Mvc;  // ProducesResponseTypeAttribute
using System.Reflection;          // GetCustomAttributes<T>
```
(Both already available in the test project — no new package references needed.)

### Previous Story Intelligence (Stories 5.1 & 5.2)

**Key learnings from Stories 5.1 and 5.2 that are relevant:**

- **This is a backend-only story** — unlike 5.1 (Angular responsive) and 5.2 (Angular keyboard), Story 5.3 touches only .NET files. No Angular spec files or SCSS.
- **Test baseline from 5.2:** Angular tests are at 235 passing. Story 5.3 adds 5 new .NET xUnit tests. Angular test count unchanged.
- **`dotnet build` validation is critical** — Stories 5.1 and 5.2 both verified `ng build` zero errors. Story 5.3 must verify `dotnet build` zero errors + zero warnings (after NoWarn suppression).
- **Commit pattern:** `feat: {story-key} - {Story Title}` from `git log` — squash merge commit matches this pattern.

### Git Intelligence

**Recent commit pattern:** `feat: {story-key} - {Story Title}` (from squash merge commits)

**Last 3 commits:**
- `30ed232` chore: update sprint-status 5-2 to review
- `4cab58b` feat: 5-2-keyboard-navigation-and-focus-management - Keyboard Navigation & Focus Management
- `4c00207` chore: update sprint-status 5-1 to review

**Patterns established:**
- Feature branches: `feature/{story-key}` (e.g., `feature/5-3-swagger-openapi-documentation`)
- Branch created from `master` with `git checkout -b feature/5-3-swagger-openapi-documentation`
- Commits per task: `feat(5-3-swagger-openapi-documentation): complete task N - {Task Title}`
- Squash merge: `feat: 5-3-swagger-openapi-documentation - Swagger/OpenAPI Documentation`

### Latest Technical Information

- **Swashbuckle.AspNetCore 6.4.0** (installed version): The `IncludeXmlComments(path)` method is available in this version. The `includeControllerXmlComments` parameter (second argument) controls whether class-level XML comments from the XML file are used as controller descriptions. Default is `false`.
- **`<GenerateDocumentationFile>true`** in .csproj: Generates `{AssemblyName}.xml` in the build output directory (`bin/Debug/net8.0/` or `bin/Release/net8.0/`). When the Api project references Application, the Application XML is copied to the Api output directory automatically — `Path.Combine(AppContext.BaseDirectory, "EventHub.Application.xml")` will find it.
- **`/// <response code="N">` tag**: Swashbuckle parses this specifically to add response descriptions in the Swagger UI. It renders as a description line next to the HTTP status code in the "Responses" table.
- **`[ProducesResponseType]` attribute behavior**: The `typeof(object)` for 400 and 500 tells Swashbuckle to show the response in Swagger without a specific schema — which is correct since the error format `{"errors": {...}}` is a dynamic dictionary, not a typed DTO.
- **ASP.NET Core `[ApiController]` + DataAnnotations**: The 400 response is already generated automatically by `[ApiController]` when model validation fails. Story 5.3 ensures it is *documented* in Swagger UI — the runtime behavior is unchanged.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] — Acceptance criteria and user story
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — `[ApiController]` pattern, error format `{"errors": {...}}`
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rules #3, #8, #13
- [Source: _bmad-output/planning-artifacts/prd.md#FR18] — "API Consumer can inspect available endpoints, request/response schemas, and error formats via a built-in API documentation interface"
- [Source: src/EventHub.Api/Program.cs] — Current bare `AddSwaggerGen()` and `UseSwagger()` / `UseSwaggerUI()` setup
- [Source: src/EventHub.Api/Controllers/EventsController.cs] — Existing `[ProducesResponseType]` attributes, partial XML comment on `GetAll`
- [Source: src/EventHub.Api/Controllers/NegotiateController.cs] — No existing docs
- [Source: src/EventHub.Api/EventHub.Api.csproj] — No `<GenerateDocumentationFile>`, Swashbuckle.AspNetCore 6.4.0 already installed
- [Source: src/EventHub.Application/DTOs/CreateEventRequest.cs] — DataAnnotations, no XML comments
- [Source: src/EventHub.Application/DTOs/EventFilter.cs] — 9 properties, no XML comments
- [Source: tests/EventHub.Api.Tests/Controllers/EventsControllerTests.cs] — Existing test structure with Mock<IServiceBusPublisher>, Mock<ILogger<EventsController>>, Mock<IEventRepository>

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-02-24 | Story 5.3 created — Swagger/OpenAPI Documentation (ready-for-dev) |
