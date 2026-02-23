# Story 1.4: API Scaffold & Configuration

Status: ready-for-dev

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

- [ ] Task 1: Remove WeatherForecast template code (AC: #7)
  - [ ] Delete `src/EventHub.Api/Controllers/WeatherForecastController.cs`
  - [ ] Delete `src/EventHub.Api/WeatherForecast.cs`
  - [ ] Delete `src/EventHub.Api/EventHub.Api.http` (REST client test file for WeatherForecast)
  - [ ] Verify `dotnet build` still succeeds after removal

- [ ] Task 2: Install NuGet packages and configure Serilog (AC: #1)
  - [ ] Add `Serilog.AspNetCore` package to EventHub.Api project (use version compatible with .NET 8 LTS)
  - [ ] Add `Serilog.Sinks.Console` package to EventHub.Api project
  - [ ] Configure Serilog in `Program.cs` using `builder.Host.UseSerilog()` with Console sink
  - [ ] Add `app.UseSerilogRequestLogging()` to middleware pipeline
  - [ ] Remove default `Logging` section from `appsettings.json` (Serilog replaces built-in logging)

- [ ] Task 3: Create Application layer DI extension (AC: #1)
  - [ ] Create `src/EventHub.Application/Extensions/ServiceCollectionExtensions.cs` with `AddApplication()` method
  - [ ] Register any Application-layer services (currently placeholder — no services to register yet, but method must exist for composition root)

- [ ] Task 4: Configure Program.cs composition root (AC: #1)
  - [ ] Add `builder.Services.AddApplication()` call
  - [ ] Add `builder.Services.AddInfrastructure(builder.Configuration)` call (requires Story 1.3 to provide `AddInfrastructure` — see Dependencies)
  - [ ] Configure CORS: `AllowFrontendDev` policy for Development (`http://localhost:4200`), restricted for Production
  - [ ] Ensure `app.UseHttpsRedirection()` is present (already exists)
  - [ ] Ensure Swagger is enabled in Development (already exists)
  - [ ] Add `app.UseCors()` to middleware pipeline (BEFORE `app.UseAuthorization()`)
  - [ ] Add ExceptionHandlingMiddleware to pipeline (BEFORE other middleware)
  - [ ] Update middleware pipeline order: ExceptionHandling → Serilog Request Logging → CORS → HTTPS → Swagger → Auth → Controllers

- [ ] Task 5: Create ExceptionHandlingMiddleware (AC: #4)
  - [ ] Create `src/EventHub.Api/Middleware/ExceptionHandlingMiddleware.cs`
  - [ ] Implement `IMiddleware` pattern or RequestDelegate pattern
  - [ ] Catch all unhandled exceptions
  - [ ] Log exception details via Serilog (structured: `Log.Error(ex, "Unhandled exception")`)
  - [ ] Return HTTP 500 with body: `{"errors": {"server": "An unexpected error occurred."}}`
  - [ ] Set `Content-Type: application/json` on error response
  - [ ] Create extension method `UseExceptionHandling()` for clean Program.cs registration

- [ ] Task 6: Create EventsController stub (AC: #2)
  - [ ] Create `src/EventHub.Api/Controllers/EventsController.cs`
  - [ ] Add `[ApiController]` and `[Route("api/events")]` attributes
  - [ ] Add `[HttpPost]` method `Create` returning `StatusCode(StatusCodes.Status501NotImplemented)`
  - [ ] Add `[HttpGet]` method `GetAll` returning `StatusCode(StatusCodes.Status501NotImplemented)`
  - [ ] Use proper async signatures: `Task<IActionResult>`

- [ ] Task 7: Create NegotiateController stub (AC: #3)
  - [ ] Create `src/EventHub.Api/Controllers/NegotiateController.cs`
  - [ ] Add `[ApiController]` and `[Route("api/negotiate")]` attributes
  - [ ] Add `[HttpPost]` method returning `StatusCode(StatusCodes.Status501NotImplemented)`

- [ ] Task 8: Update configuration files (AC: #5)
  - [ ] Update `appsettings.json` with ConnectionStrings section: `"DefaultConnection": ""` and `"ServiceBus": ""`
  - [ ] Update `appsettings.Development.json` with development connection string placeholders
  - [ ] Add Serilog configuration section to `appsettings.json` (MinimumLevel, WriteTo Console)
  - [ ] Add CORS origins configuration: `"AllowedOrigins": ["http://localhost:4200"]` in Development

- [ ] Task 9: Update launchSettings.json for correct ports (AC: #6)
  - [ ] Update HTTPS URL to `https://localhost:5001` (architecture spec) and HTTP to `http://localhost:5000`
  - [ ] Ensure `ASPNETCORE_ENVIRONMENT` is set to `Development`
  - [ ] Keep `launchUrl: "swagger"` for Swagger UI on startup

- [ ] Task 10: Build verification (AC: #8)
  - [ ] Run `dotnet build` for entire solution — verify 0 errors, 0 warnings
  - [ ] Run `dotnet run --project src/EventHub.Api` — verify API starts on https://localhost:5001
  - [ ] Verify Swagger UI is accessible at `/swagger`
  - [ ] Verify CORS headers are present for localhost:4200 origin
  - [ ] Run `dotnet test` — verify all existing tests pass

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
