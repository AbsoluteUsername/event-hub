# Story 1.4: API Scaffold & Configuration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want a configured ASP.NET Core Web API with middleware pipeline, CORS, HTTPS, structured logging, and controller stubs,
so that the API is runnable and ready for endpoint implementation.

## Acceptance Criteria

1. **AC1: Composition Root (Program.cs)** — `Program.cs` includes `AddApplication()` and `AddInfrastructure(config)` DI registration, Serilog with Console sink configured, CORS permissive for `localhost:4200` in Development and restricted in Production (NFR-S2), HTTPS redirection enabled (NFR-S1), Swagger/OpenAPI enabled in Development.

2. **AC2: EventsController** — `Controllers/EventsController.cs` exists with `[ApiController][Route("api/events")]` and empty `[HttpPost]` returning `StatusCode(501)` and `[HttpGet]` returning `StatusCode(501)`.

3. **AC3: NegotiateController** — `Controllers/NegotiateController.cs` exists with `[Route("api/negotiate")]` stub returning `StatusCode(501)`.

4. **AC4: ExceptionHandlingMiddleware** — `Middleware/ExceptionHandlingMiddleware.cs` catches unhandled exceptions and returns `{"errors": {"server": "message"}}` with Serilog structured logging (FR23, FR24).

5. **AC5: Configuration Files** — `appsettings.json` and `appsettings.Development.json` contain connection string placeholders for Azure SQL (`DefaultConnection`) and Service Bus (`ServiceBus`) (NFR-S3, NFR-M2).

6. **AC6: API Runnable** — `dotnet run` starts the API on HTTPS with Swagger UI accessible at `/swagger` in Development mode.

7. **AC7: Template Cleanup** — WeatherForecast sample code (controller + model) is removed.

8. **AC8: Build Verification** — `dotnet build` succeeds with zero errors and zero warnings across the entire solution.

## Tasks / Subtasks

- [x] Task 1: Remove WeatherForecast template code (AC: #7)
  - [x] Delete `src/EventHub.Api/Controllers/WeatherForecastController.cs`
  - [x] Delete `src/EventHub.Api/WeatherForecast.cs`
  - [x] Delete `src/EventHub.Api/EventHub.Api.http` (REST client test file for WeatherForecast)
  - [x] Verify `dotnet build` still succeeds after removal

- [x] Task 2: Install NuGet packages and configure Serilog (AC: #1)
  - [x] Add `Serilog.AspNetCore` package to EventHub.Api project (use version compatible with .NET 8 LTS)
  - [x] Add `Serilog.Sinks.Console` package to EventHub.Api project
  - [x] Configure Serilog in `Program.cs` using `builder.Host.UseSerilog()` with Console sink
  - [x] Add `app.UseSerilogRequestLogging()` to middleware pipeline
  - [x] Remove default `Logging` section from `appsettings.json` (Serilog replaces built-in logging)

- [x] Task 3: Create Application layer DI extension (AC: #1)
  - [x] Create `src/EventHub.Application/Extensions/ServiceCollectionExtensions.cs` with `AddApplication()` method
  - [x] Register any Application-layer services (currently placeholder — no services to register yet, but method must exist for composition root)

- [x] Task 4: Configure Program.cs composition root (AC: #1)
  - [x] Add `builder.Services.AddApplication()` call
  - [x] Add `builder.Services.AddInfrastructure(builder.Configuration)` call (requires Story 1.3 to provide `AddInfrastructure` — see Dependencies)
  - [x] Configure CORS: `AllowFrontendDev` policy for Development (`http://localhost:4200`), restricted for Production
  - [x] Ensure `app.UseHttpsRedirection()` is present (already exists)
  - [x] Ensure Swagger is enabled in Development (already exists)
  - [x] Add `app.UseCors()` to middleware pipeline (BEFORE `app.UseAuthorization()`)
  - [x] Add ExceptionHandlingMiddleware to pipeline (BEFORE other middleware)
  - [x] Update middleware pipeline order: ExceptionHandling → Serilog Request Logging → CORS → HTTPS → Swagger → Auth → Controllers

- [x] Task 5: Create ExceptionHandlingMiddleware (AC: #4)
  - [x] Create `src/EventHub.Api/Middleware/ExceptionHandlingMiddleware.cs`
  - [x] Implement `IMiddleware` pattern or RequestDelegate pattern
  - [x] Catch all unhandled exceptions
  - [x] Log exception details via Serilog (structured: `Log.Error(ex, "Unhandled exception")`)
  - [x] Return HTTP 500 with body: `{"errors": {"server": "An unexpected error occurred."}}`
  - [x] Set `Content-Type: application/json` on error response
  - [x] Create extension method `UseExceptionHandling()` for clean Program.cs registration

- [x] Task 6: Create EventsController stub (AC: #2)
  - [x] Create `src/EventHub.Api/Controllers/EventsController.cs`
  - [x] Add `[ApiController]` and `[Route("api/events")]` attributes
  - [x] Add `[HttpPost]` method `Create` returning `StatusCode(StatusCodes.Status501NotImplemented)`
  - [x] Add `[HttpGet]` method `GetAll` returning `StatusCode(StatusCodes.Status501NotImplemented)`
  - [x] Use proper async signatures: `Task<IActionResult>`

- [x] Task 7: Create NegotiateController stub (AC: #3)
  - [x] Create `src/EventHub.Api/Controllers/NegotiateController.cs`
  - [x] Add `[ApiController]` and `[Route("api/negotiate")]` attributes
  - [x] Add `[HttpPost]` method returning `StatusCode(StatusCodes.Status501NotImplemented)`

- [x] Task 8: Update configuration files (AC: #5)
  - [x] Update `appsettings.json` with ConnectionStrings section: `"DefaultConnection": ""` and `"ServiceBus": ""`
  - [x] Update `appsettings.Development.json` with development connection string placeholders
  - [x] Add Serilog configuration section to `appsettings.json` (MinimumLevel, WriteTo Console)
  - [x] Add CORS origins configuration: `"AllowedOrigins": ["http://localhost:4200"]` in Development

- [x] Task 9: Update launchSettings.json for correct ports (AC: #6)
  - [x] Update HTTPS URL to `https://localhost:5001` (architecture spec) and HTTP to `http://localhost:5000`
  - [x] Ensure `ASPNETCORE_ENVIRONMENT` is set to `Development`
  - [x] Keep `launchUrl: "swagger"` for Swagger UI on startup

- [x] Task 10: Build verification (AC: #8)
  - [x] Run `dotnet build` for entire solution — verify 0 errors, 0 warnings
  - [x] Run `dotnet run --project src/EventHub.Api` — verify API starts on https://localhost:5001
  - [x] Verify Swagger UI is accessible at `/swagger`
  - [x] Verify CORS headers are present for localhost:4200 origin
  - [x] Run `dotnet test` — verify all existing tests pass

## Dev Notes

### Critical Dependencies

- **Story 1.3 (Infrastructure Layer)** must provide `AddInfrastructure(IConfiguration)` extension method in `EventHub.Infrastructure/Extensions/ServiceCollectionExtensions.cs`. As of story creation, **Infrastructure layer is empty** (ready-for-dev, no code written). If Story 1.3 is not yet complete when starting Story 1.4:
  - **Option A (Recommended):** Complete Story 1.3 first, then proceed with 1.4
  - **Option B:** Create a minimal placeholder `AddInfrastructure()` in Infrastructure layer that does nothing, and wire it up. Story 1.3 implementation will fill it in later.
- **Story 1.2 (Application Layer)** — Interfaces (`IEventRepository`, `IServiceBusPublisher`) and DTOs are complete. However, `AddApplication()` extension method does NOT exist yet — Task 3 of this story creates it.

### Architecture Patterns & Constraints

- **Enforcement Rule #3:** Return API errors in `{"errors": {"field": "message"}}` format — no exceptions. This applies to ExceptionHandlingMiddleware (500 errors) AND to validation errors (400, handled automatically by `[ApiController]`).
- **Enforcement Rule #4:** Use `async/await` in all C# code — never `.Result` or `.Wait()`
- **Enforcement Rule #7:** Use Serilog structured logging — never `Console.WriteLine`
- **Enforcement Rule #8:** Use `[ApiController]` attribute — never manual `ModelState.IsValid` checks
- **Enforcement Rule #13:** Follow Clean Architecture dependency rule — inner layers NEVER reference outer layers
- **Controller-based API** with `[ApiController]` attribute (not minimal API) — per ADR and architecture doc
- **Route pattern:** `api/[controller]` for EventsController → `/api/events`; fixed route `api/negotiate` for NegotiateController
- **JSON serialization:** System.Text.Json (default in .NET 8), camelCase property naming (default)
- **CORS placement:** `UseCors()` must come AFTER `UseRouting()` but BEFORE `UseAuthorization()` and `MapControllers()`

### Middleware Pipeline Order

The correct middleware pipeline order in `Program.cs` must be:

```
1. ExceptionHandlingMiddleware (first — catches all exceptions)
2. UseSerilogRequestLogging() (logs HTTP requests with timing)
3. UseSwagger() + UseSwaggerUI() (Development only)
4. UseHttpsRedirection()
5. UseCors("policyName")
6. UseAuthorization()
7. MapControllers()
```

### Error Response Format (FR23)

All errors must follow this format:

```json
// 400 Bad Request (automatic via [ApiController] + DataAnnotations)
{
  "errors": {
    "userId": "The UserId field is required.",
    "type": "The field Type is invalid."
  }
}

// 500 Internal Server Error (via ExceptionHandlingMiddleware)
{
  "errors": {
    "server": "An unexpected error occurred."
  }
}
```

**IMPORTANT:** The `[ApiController]` attribute automatically validates `ModelState` and returns 400 errors. However, the default format differs from our required format. You may need to configure `InvalidModelStateResponseFactory` in `builder.Services.AddControllers()` to customize the 400 response format to match FR23.

### Configuration Structure

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "",
    "ServiceBus": ""
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" }
    ]
  },
  "AllowedHosts": "*"
}

// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EventHub;Trusted_Connection=true;TrustServerCertificate=true;",
    "ServiceBus": "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=placeholder"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200"]
  }
}
```

### CORS Configuration Details (NFR-S2)

```csharp
// Development: permissive for Angular dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();  // Required for SignalR
    });
});

// Production: restrict to known frontend origin
// AllowedOrigins from configuration
```

**CRITICAL:** `AllowCredentials()` is REQUIRED because SignalR (Story 4.x) needs it for WebSocket negotiate. You CANNOT combine `AllowAnyOrigin()` with `AllowCredentials()` — this is a framework-enforced restriction.

### Serilog Configuration Pattern

```csharp
builder.Host.UseSerilog((context, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .WriteTo.Console());
```

Using `ReadFrom.Configuration` allows runtime log level changes via appsettings without recompilation.

### Port Configuration

The architecture specification requires:
- **HTTPS:** `https://localhost:5001`
- **HTTP:** `http://localhost:5000`

Current `launchSettings.json` uses ports 7010/5222 (default from `dotnet new webapi`). **Must update** to 5001/5000 to match architecture doc and Angular `environment.ts` which points to `https://localhost:5001`.

### `InvariantGlobalization` Warning

The current `EventHub.Api.csproj` has `<InvariantGlobalization>true</InvariantGlobalization>`. This disables culture-specific behaviors. For this project (demo scale, UTC dates, English-only data), this is acceptable. However, be aware:
- `DateTime.ToString()` formatting will use invariant culture
- String comparisons are culture-insensitive
- This is fine because all dates are ISO 8601 UTC and enum serialization is culture-independent

### Project Structure Notes

**Files to CREATE:**
```
src/EventHub.Api/
  Controllers/
    EventsController.cs          ← NEW (replace WeatherForecastController)
    NegotiateController.cs       ← NEW
  Middleware/
    ExceptionHandlingMiddleware.cs ← NEW
  Program.cs                     ← MODIFY (composition root)
  appsettings.json               ← MODIFY (add connection strings, Serilog config)
  appsettings.Development.json   ← MODIFY (add dev connection strings, CORS)
  Properties/
    launchSettings.json          ← MODIFY (update ports to 5001/5000)
  EventHub.Api.csproj            ← MODIFY (add Serilog packages)

src/EventHub.Application/
  Extensions/
    ServiceCollectionExtensions.cs ← NEW (AddApplication() placeholder)
```

**Files to DELETE:**
```
src/EventHub.Api/
  Controllers/WeatherForecastController.cs  ← DELETE
  WeatherForecast.cs                        ← DELETE
  EventHub.Api.http                         ← DELETE
```

**Alignment with unified project structure:** Fully aligned with architecture doc's directory layout (§ Project Structure & Boundaries). The Controllers/ and Middleware/ directories match the specified structure exactly.

**Detected conflicts or variances:**
- Port variance: launchSettings.json defaults (7010/5222) differ from architecture spec (5001/5000) — will be corrected
- No conflicts with existing code structure

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — Controller-based API, `[ApiController]`, Error Response Standard
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming conventions, middleware pipeline, enforcement rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Serilog configuration, environment config
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — CORS, HTTPS, Secrets
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR-S1 (HTTPS), NFR-S2 (CORS), NFR-S3 (secrets), NFR-M2 (externalized config)
- [Source: _bmad-output/implementation-artifacts/1-1-solution-scaffold-and-project-initialization.md] — WeatherForecast template code noted for removal in Story 1.4
- [Source: _bmad-output/implementation-artifacts/1-3-infrastructure-layer-and-database-setup.md] — Serilog logging will be configured in Story 1.4, connection strings format

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Story 1.3 dependency (AddInfrastructure) was already implemented — proceeded with Option A.
- Serilog.AspNetCore 10.0.0 installed (latest compatible with .NET 8).
- Added Microsoft.Extensions.DependencyInjection.Abstractions 8.0.* to Application project for AddApplication() extension.
- Configured InvalidModelStateResponseFactory to match FR23 error format for 400 responses.
- CORS policy reads AllowedOrigins from configuration, falling back to localhost:4200.
- Removed IIS Express profile from launchSettings.json (not needed).

### Completion Notes List

- **Task 1:** Deleted WeatherForecastController.cs, WeatherForecast.cs, and EventHub.Api.http. Build verified clean.
- **Task 2:** Installed Serilog.AspNetCore 10.0.0 and Serilog.Sinks.Console 6.1.1. Replaced default Logging section with Serilog config in appsettings.json.
- **Task 3:** Created Application/Extensions/ServiceCollectionExtensions.cs with placeholder AddApplication() method. Added DI abstractions NuGet package.
- **Task 4:** Fully configured Program.cs composition root with AddApplication(), AddInfrastructure(), Serilog, CORS (AllowFrontend policy with AllowCredentials for SignalR), and correct middleware pipeline order.
- **Task 5:** Created ExceptionHandlingMiddleware using RequestDelegate pattern. Returns FR23-compliant JSON error format. Includes UseExceptionHandling() extension method.
- **Task 6:** Created EventsController with [ApiController][Route("api/events")], HttpPost Create and HttpGet GetAll stubs returning 501.
- **Task 7:** Created NegotiateController with [ApiController][Route("api/negotiate")], HttpPost stub returning 501.
- **Task 8:** Updated appsettings.json with ConnectionStrings (empty placeholders), Serilog config. Updated appsettings.Development.json with dev connection strings and CORS origins.
- **Task 9:** Updated launchSettings.json ports from 7010/5222 to 5001/5000 per architecture spec.
- **Task 10:** Full solution build: 0 errors, 0 warnings. All 8 tests pass (7 Api + 1 Function). New tests: 6 tests covering ExceptionHandlingMiddleware (3), EventsController (2), NegotiateController (1).

### File List

**New files:**
- src/EventHub.Api/Controllers/EventsController.cs
- src/EventHub.Api/Controllers/NegotiateController.cs
- src/EventHub.Api/Middleware/ExceptionHandlingMiddleware.cs
- src/EventHub.Application/Extensions/ServiceCollectionExtensions.cs
- tests/EventHub.Api.Tests/Middleware/ExceptionHandlingMiddlewareTests.cs
- tests/EventHub.Api.Tests/Controllers/EventsControllerTests.cs
- tests/EventHub.Api.Tests/Controllers/NegotiateControllerTests.cs

**Modified files:**
- src/EventHub.Api/Program.cs
- src/EventHub.Api/EventHub.Api.csproj
- src/EventHub.Api/appsettings.json
- src/EventHub.Api/appsettings.Development.json
- src/EventHub.Api/Properties/launchSettings.json
- src/EventHub.Application/EventHub.Application.csproj
- tests/EventHub.Api.Tests/EventHub.Api.Tests.csproj
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/1-4-api-scaffold-and-configuration.md

**Deleted files:**
- src/EventHub.Api/Controllers/WeatherForecastController.cs
- src/EventHub.Api/WeatherForecast.cs
- src/EventHub.Api/EventHub.Api.http

## Change Log

- 2026-02-23: Story 1.4 implemented — API scaffold with Serilog logging, CORS, ExceptionHandlingMiddleware, controller stubs (Events, Negotiate), configuration files with connection string placeholders, ports updated to 5001/5000. All ACs satisfied. 8 tests pass (6 new + 2 existing).
