# Story 1.3: Infrastructure Layer & Database Setup

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want EF Core database access, repository implementation, and Service Bus publisher in the Infrastructure layer,
so that the application has concrete data persistence and messaging capabilities.

## Acceptance Criteria

1. **Given** the Domain and Application layers from Story 1.2 **When** the Infrastructure layer is implemented **Then** `EventHub.Infrastructure` contains:
   - `Data/EventHubDbContext.cs` with `DbSet<Event>` and configuration via `IEntityTypeConfiguration`
   - `Data/Configurations/EventConfiguration.cs` using `IEntityTypeConfiguration<Event>` with: GUID primary key, string column types with max lengths (`UserId` max 100, `Description` max 500), `EventType` stored as **string** (not integer), indexes on `CreatedAt`, `UserId`, `Type`
   - `Repositories/EventRepository.cs` implementing `IEventRepository` with IQueryable-based filtering, sorting (`OrderBy`/`OrderByDescending`), and pagination (`Skip`/`Take`)
   - `Services/ServiceBusPublisher.cs` implementing `IServiceBusPublisher` using `Azure.Messaging.ServiceBus` SDK
   - `Extensions/ServiceCollectionExtensions.cs` with `AddInfrastructure(IConfiguration)` registering DbContext, repositories, and services

2. **Given** the EventHubDbContext is configured **When** EF Core migration tooling is run **Then** an initial migration is generated in `Data/Migrations/` that creates the `Events` table with all columns, constraints, and indexes matching the entity configuration

3. **Given** the EventConfiguration **When** the database schema is inspected **Then**:
   - `Events` table has columns: `Id` (uniqueidentifier, PK), `UserId` (nvarchar(100)), `Type` (nvarchar(50), string enum), `Description` (nvarchar(500)), `CreatedAt` (datetime2)
   - Index `IX_Events_CreatedAt` exists on `CreatedAt`
   - Index `IX_Events_UserId` exists on `UserId`
   - Index `IX_Events_Type` exists on `Type`

4. **Given** the EventRepository implementation **When** `GetAllAsync(EventFilter)` is called with various filter combinations **Then**:
   - Type filter uses **exact match**
   - UserId filter uses **exact match**
   - Description filter uses **case-insensitive substring** (contains) matching
   - Date range filters on `CreatedAt >= From AND CreatedAt <= To`
   - All filters combine with AND logic
   - Results are sorted by the specified `SortBy` field in the specified `SortDir` direction
   - Results are paginated with `Skip((Page-1)*PageSize).Take(PageSize)`
   - Returns `PagedResult<Event>` with correct `TotalCount` reflecting filtered dataset size

5. **Given** the Infrastructure project **When** its dependencies are inspected **Then** it references only `EventHub.Application` (not Api or Function) and has NuGet packages only for EF Core and Azure Service Bus

6. **Given** all changes are complete **When** `dotnet build` is run from the solution root **Then** the build succeeds with zero errors and zero warnings

## Tasks / Subtasks

- [x] Task 1: Delete Infrastructure placeholder file (AC: #6)
  - [x] 1.1: Delete `src/EventHub.Infrastructure/Class1.cs` (template placeholder from Story 1.1) — already deleted by Story 1.2

- [x] Task 2: Add NuGet packages to Infrastructure project (AC: #5)
  - [x] 2.1: Add `Microsoft.EntityFrameworkCore.SqlServer` (8.0.24)
  - [x] 2.2: Add `Microsoft.EntityFrameworkCore.Tools` (8.0.24)
  - [x] 2.3: Add `Azure.Messaging.ServiceBus` (7.20.1)
  - [x] 2.4: Verify all EF Core packages are at the **same version** — confirmed both at 8.0.24

- [x] Task 3: Implement EventHubDbContext (AC: #1, #2, #3)
  - [x] 3.1: Create `Data/EventHubDbContext.cs` with `DbSet<Event> Events`
  - [x] 3.2: Override `OnModelCreating` to apply configurations via `modelBuilder.ApplyConfigurationsFromAssembly()`
  - [x] 3.3: Create `Data/Configurations/EventConfiguration.cs` implementing `IEntityTypeConfiguration<Event>`:
    - Configure `Id` as primary key (GUID)
    - Configure `UserId` as `nvarchar(100)` with `IsRequired()`
    - Configure `Type` as string enum via `.HasConversion<string>()` with `HasMaxLength(50)`
    - Configure `Description` as `nvarchar(500)` with `IsRequired()`
    - Configure `CreatedAt` as required
    - Add index on `CreatedAt` (named `IX_Events_CreatedAt`)
    - Add index on `UserId` (named `IX_Events_UserId`)
    - Add index on `Type` (named `IX_Events_Type`)

- [x] Task 4: Implement EventRepository (AC: #1, #4)
  - [x] 4.1: Create `Repositories/EventRepository.cs` implementing `IEventRepository`
  - [x] 4.2: Implement `GetAllAsync(EventFilter)` with:
    - Start with `_dbContext.Events.AsQueryable()`
    - Apply conditional `.Where()` for each non-null filter parameter
    - Type: exact match `.Where(e => e.Type == filter.Type)`
    - UserId: exact match `.Where(e => e.UserId == filter.UserId)`
    - Description: case-insensitive contains `.Where(e => e.Description.Contains(filter.Description))`
    - From: `.Where(e => e.CreatedAt >= filter.From)`
    - To: `.Where(e => e.CreatedAt <= filter.To)`
    - Get `TotalCount` via `.CountAsync()` on filtered query (before pagination)
    - Apply sorting via `SortBy`/`SortDir` using expression-based ordering
    - Apply pagination via `.Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize)`
    - Return `PagedResult<Event>` with items, totalCount, page, pageSize
  - [x] 4.3: Implement `CreateAsync(Event)` with `_dbContext.Events.Add(entity)` + `SaveChangesAsync()` returning the entity

- [x] Task 5: Implement ServiceBusPublisher (AC: #1)
  - [x] 5.1: Create `Services/ServiceBusPublisher.cs` implementing `IServiceBusPublisher`
  - [x] 5.2: Inject `ServiceBusClient` via constructor
  - [x] 5.3: Implement `PublishAsync(EventMessage)`:
    - Serialize message to JSON
    - Create `ServiceBusMessage` with `Body` set to JSON bytes
    - Set `MessageId` to `message.Id.ToString()` (for deduplication per NFR-I2)
    - Set `ContentType` to `"application/json"`
    - Send via `ServiceBusSender`
  - [x] 5.4: Implement `IAsyncDisposable` to dispose `ServiceBusSender` properly

- [x] Task 6: Implement DI registration extension (AC: #1)
  - [x] 6.1: Create `Extensions/ServiceCollectionExtensions.cs` with `AddInfrastructure(this IServiceCollection services, IConfiguration configuration)` method
  - [x] 6.2: Register `EventHubDbContext` with SQL Server connection string from `configuration.GetConnectionString("DefaultConnection")`
  - [x] 6.3: Register `ServiceBusClient` as singleton from `configuration.GetConnectionString("ServiceBus")`
  - [x] 6.4: Register `IEventRepository` → `EventRepository` as scoped
  - [x] 6.5: Register `IServiceBusPublisher` → `ServiceBusPublisher` as scoped

- [x] Task 7: Generate initial EF Core migration (AC: #2, #3)
  - [x] 7.1: Add `Microsoft.EntityFrameworkCore.Design` package to `EventHub.Api` project (8.0.24)
  - [x] 7.2: Created `DesignTimeDbContextFactory` in Infrastructure (no Program.cs modification needed)
  - [x] 7.3: Run `dotnet ef migrations add InitialCreate --project src/EventHub.Infrastructure --startup-project src/EventHub.Api`
  - [x] 7.4: Verified migration creates correct table schema — all columns, constraints, and indexes match AC #3
  - [x] 7.5: Verified SQL script is valid — produces correct CREATE TABLE, indexes, and migration history

- [x] Task 8: Verify build and dependencies (AC: #5, #6)
  - [x] 8.1: Verify `EventHub.Infrastructure.csproj` has exactly one `<ProjectReference>` to `EventHub.Application` — confirmed
  - [x] 8.2: Verify NuGet packages are only: `Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Tools`, `Azure.Messaging.ServiceBus` — confirmed
  - [x] 8.3: Run `dotnet build` from solution root — zero errors, zero warnings — confirmed

## Dev Notes

### Architecture Patterns & Constraints

- **Clean Architecture Dependency Rule (CRITICAL):** Infrastructure references ONLY Application. Never add Api, Function, or Domain direct references. Domain is accessed transitively through Application.
  ```
  Domain (zero deps) ← Application (→ Domain only) ← Infrastructure (→ Application only)
  ```
- **Enforcement Rule #10:** Use `IEntityTypeConfiguration<T>` for EF Core config — NEVER inline in `OnModelCreating`
- **Enforcement Rule #13:** Inner layers NEVER reference outer layers
- **Enforcement Rule #14:** Interface definitions in `EventHub.Application/Interfaces/` — implementations in `EventHub.Infrastructure/`
- **Enforcement Rule #4:** Use `async/await` in all C# code — never `.Result` or `.Wait()`
- **Enforcement Rule #7:** Use Serilog structured logging — never `Console.WriteLine` (logging will be configured in Story 1.4, but avoid console writes now)
- **ADR-1:** Azure SQL with EF Core Code-First Migrations, IQueryable-based server-side filtering
- **ADR-6:** Server-side pagination via `Skip/Take` with `PagedResult<T>` response format
- **NFR-I2:** Event.Id as unique database key for idempotent processing (UNIQUE constraint)
- **NFR-M1:** Infrastructure layer handles data access — API layer must NEVER access DB directly

### NuGet Packages & Versions

| Package | Version | Purpose |
|---------|---------|---------|
| `Microsoft.EntityFrameworkCore.SqlServer` | 8.0.x (latest patch) | Azure SQL / SQL Server provider |
| `Microsoft.EntityFrameworkCore.Tools` | 8.0.x (same version as SqlServer) | Migration CLI tooling (`dotnet ef`) |
| `Azure.Messaging.ServiceBus` | 7.x (latest stable, ~7.20.1) | Azure Service Bus client SDK |

**CRITICAL:** All `Microsoft.EntityFrameworkCore.*` packages MUST be at the same version. Version mismatch causes runtime errors.

**Migration tooling note:** `Microsoft.EntityFrameworkCore.Design` must be added to the **startup project** (`EventHub.Api`), not to Infrastructure. This is because `dotnet ef` requires the design-time services in the executable project.

### EventHubDbContext Implementation Details

```csharp
using EventHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EventHub.Infrastructure.Data;

public class EventHubDbContext : DbContext
{
    public EventHubDbContext(DbContextOptions<EventHubDbContext> options) : base(options) { }

    public DbSet<Event> Events => Set<Event>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(EventHubDbContext).Assembly);
    }
}
```

### EventConfiguration Implementation Details

```csharp
using EventHub.Domain.Entities;
using EventHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventHub.Infrastructure.Data.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.UserId)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(e => e.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName("IX_Events_CreatedAt");

        builder.HasIndex(e => e.UserId)
            .HasDatabaseName("IX_Events_UserId");

        builder.HasIndex(e => e.Type)
            .HasDatabaseName("IX_Events_Type");
    }
}
```

**Key decisions:**
- `HasConversion<string>()` stores enum as string (e.g., `"PageView"`, `"Click"`, `"Purchase"`) — per architecture naming patterns
- `HasMaxLength(50)` on Type allows for future enum value names
- Three indexes support the most common query patterns: filter by Type, UserId, and sort by CreatedAt (default sort)
- Table name defaults to `Events` (EF Core convention with `DbSet<Event> Events` property name)

### EventRepository Implementation Details

```csharp
using EventHub.Application.DTOs;
using EventHub.Application.Interfaces;
using EventHub.Domain.Entities;
using EventHub.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventHub.Infrastructure.Repositories;

public class EventRepository : IEventRepository
{
    private readonly EventHubDbContext _dbContext;

    public EventRepository(EventHubDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<Event>> GetAllAsync(EventFilter filter)
    {
        var query = _dbContext.Events.AsQueryable();

        // Apply filters (AND logic — all conditions must match)
        if (filter.Type.HasValue)
            query = query.Where(e => e.Type == filter.Type.Value);

        if (!string.IsNullOrWhiteSpace(filter.UserId))
            query = query.Where(e => e.UserId == filter.UserId);

        if (!string.IsNullOrWhiteSpace(filter.Description))
            query = query.Where(e => e.Description.Contains(filter.Description));

        if (filter.From.HasValue)
            query = query.Where(e => e.CreatedAt >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(e => e.CreatedAt <= filter.To.Value);

        // Get total count BEFORE pagination
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = ApplySorting(query, filter.SortBy, filter.SortDir);

        // Apply pagination
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResult<Event>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<Event> CreateAsync(Event entity)
    {
        _dbContext.Events.Add(entity);
        await _dbContext.SaveChangesAsync();
        return entity;
    }

    private static IQueryable<Event> ApplySorting(IQueryable<Event> query, string sortBy, string sortDir)
    {
        var isDescending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy?.ToLowerInvariant() switch
        {
            "id" => isDescending ? query.OrderByDescending(e => e.Id) : query.OrderBy(e => e.Id),
            "userid" => isDescending ? query.OrderByDescending(e => e.UserId) : query.OrderBy(e => e.UserId),
            "type" => isDescending ? query.OrderByDescending(e => e.Type) : query.OrderBy(e => e.Type),
            "description" => isDescending ? query.OrderByDescending(e => e.Description) : query.OrderBy(e => e.Description),
            "createdat" or _ => isDescending ? query.OrderByDescending(e => e.CreatedAt) : query.OrderBy(e => e.CreatedAt),
        };
    }
}
```

**Key decisions:**
- `Description.Contains()` translates to SQL `LIKE '%value%'` which is case-insensitive on SQL Server by default (depends on collation — default `SQL_Latin1_General_CP1_CI_AS` is CI)
- `CountAsync()` called on filtered query before pagination — required for correct `TotalCount` in `PagedResult`
- Sorting via switch expression — avoids reflection and keeps IQueryable translatable to SQL
- Default sort is `createdAt desc` (matches EventFilter defaults and ADR-6)
- Null/empty filter values are ignored (not applied to query)

### ServiceBusPublisher Implementation Details

```csharp
using System.Text.Json;
using Azure.Messaging.ServiceBus;
using EventHub.Application.Interfaces;
using EventHub.Application.Messages;

namespace EventHub.Infrastructure.Services;

public class ServiceBusPublisher : IServiceBusPublisher, IAsyncDisposable
{
    private readonly ServiceBusSender _sender;

    public ServiceBusPublisher(ServiceBusClient client)
    {
        _sender = client.CreateSender("events");
    }

    public async Task PublishAsync(EventMessage message)
    {
        var json = JsonSerializer.Serialize(message);
        var sbMessage = new ServiceBusMessage(json)
        {
            MessageId = message.Id.ToString(),
            ContentType = "application/json"
        };
        await _sender.SendMessageAsync(sbMessage);
    }

    public async ValueTask DisposeAsync()
    {
        await _sender.DisposeAsync();
    }
}
```

**Key decisions:**
- Queue name `"events"` — simple, matches the single-queue architecture (ADR-2)
- `MessageId` set to `event.Id.ToString()` — enables Service Bus deduplication (NFR-I2)
- `ContentType` set to `"application/json"` — per architecture communication patterns
- `System.Text.Json` used for serialization — .NET 8 default, no additional package needed
- `IAsyncDisposable` implemented for proper cleanup of `ServiceBusSender`

### DI Registration Details

```csharp
using Azure.Messaging.ServiceBus;
using EventHub.Application.Interfaces;
using EventHub.Infrastructure.Data;
using EventHub.Infrastructure.Repositories;
using EventHub.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EventHub.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // EF Core DbContext with SQL Server
        services.AddDbContext<EventHubDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection")));

        // Azure Service Bus client (singleton — thread-safe, connection-pooled)
        services.AddSingleton(_ =>
            new ServiceBusClient(
                configuration.GetConnectionString("ServiceBus")));

        // Repository (scoped — tied to DbContext lifetime)
        services.AddScoped<IEventRepository, EventRepository>();

        // Service Bus publisher (scoped — creates sender per scope)
        services.AddScoped<IServiceBusPublisher, ServiceBusPublisher>();

        return services;
    }
}
```

**Key decisions:**
- `ServiceBusClient` registered as **singleton** — it is thread-safe, manages connections internally, and should not be recreated per request
- `EventRepository` registered as **scoped** — matches DbContext lifetime (scoped by default with `AddDbContext`)
- `ServiceBusPublisher` registered as **scoped** — creates a `ServiceBusSender` per scope; disposed automatically at scope end
- Connection strings read from `configuration.GetConnectionString()` — stored in `appsettings.json` (NFR-S3, NFR-M2)
- Connection string keys: `"DefaultConnection"` for Azure SQL, `"ServiceBus"` for Service Bus

### Migration Generation Strategy

**Option A: Design-time DbContext factory (RECOMMENDED)**

Create a `DesignTimeDbContextFactory` in Infrastructure to enable `dotnet ef` without modifying Api's `Program.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace EventHub.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<EventHubDbContext>
{
    public EventHubDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<EventHubDbContext>();
        optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=EventHub;Trusted_Connection=True;");
        return new EventHubDbContext(optionsBuilder.Options);
    }
}
```

**Migration commands:**
```bash
# From solution root:
dotnet ef migrations add InitialCreate --project src/EventHub.Infrastructure --startup-project src/EventHub.Api

# Generate SQL script to verify:
dotnet ef migrations script --project src/EventHub.Infrastructure --startup-project src/EventHub.Api
```

**Note:** If `dotnet ef` tool is not installed globally, install it:
```bash
dotnet tool install --global dotnet-ef
```

### Connection String Format

**appsettings.Development.json (Story 1.4 will configure this, but noting format here):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=EventHub;Trusted_Connection=True;MultipleActiveResultSets=true",
    "ServiceBus": "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
  }
}
```

### Critical Anti-Patterns to Avoid

- **Do NOT inline EF Core configuration in `OnModelCreating`** — use `IEntityTypeConfiguration<T>` in separate files (Enforcement Rule #10)
- **Do NOT store `EventType` as integer** — architecture requires string storage via `HasConversion<string>()`
- **Do NOT add `[Key]`, `[Table]`, `[Column]` or any EF Core attributes to Domain entities** — Domain must remain persistence-ignorant. All configuration is in Infrastructure's `EventConfiguration.cs`
- **Do NOT reference `EventHub.Api` or `EventHub.Function` from Infrastructure** — violates Clean Architecture
- **Do NOT use `var context = new EventHubDbContext()`** — always inject via constructor (DI)
- **Do NOT use `.Result` or `.Wait()` on async calls** — always `await` (Enforcement Rule #4)
- **Do NOT hardcode connection strings** — always read from `IConfiguration` (NFR-S3)
- **Do NOT create a separate mapping library (e.g., AutoMapper)** — mapping will be done inline in Application services or controllers
- **Do NOT add `Microsoft.EntityFrameworkCore.Design` to Infrastructure** — it belongs in the startup project (`EventHub.Api`) for migration CLI
- **Do NOT use `EF.Functions.Like()` for Description filter** — `.Contains()` is sufficient and translates to `LIKE '%term%'` on SQL Server

### Learnings from Previous Stories

**From Story 1.1 (done):**
- .NET 8.0.418 SDK (runtime 8.0.14) confirmed working
- `--use-controllers` flag used for Web API — controller-based approach confirmed
- Azure Function project was manually scaffolded (func CLI unavailable) — works correctly
- Template placeholder files (`Class1.cs`) exist in Domain, Application, Infrastructure — **Infrastructure's Class1.cs must be deleted first**
- Zero-warnings build standard maintained — keep it that way
- WeatherForecast template code exists in Api project — will be replaced in Story 1.4

**From Story 1.2 (ready-for-dev, NOT yet implemented):**
- Story 1.3 DEPENDS on Story 1.2 — Domain entities and Application interfaces MUST exist before Infrastructure can implement them
- Story 1.2 defines: `Event.cs`, `EventType.cs`, `CreateEventRequest.cs`, `EventResponse.cs`, `EventFilter.cs`, `PagedResult.cs`, `EventMessage.cs`, `IEventRepository.cs`, `IServiceBusPublisher.cs`
- If Story 1.2 is not complete when dev starts 1.3, the developer MUST implement 1.2 first or simultaneously
- Story 1.2 also plans to delete Class1.cs from Domain and Application (and preemptively from Infrastructure)

### Git Intelligence

- **Latest commit:** `d7fac6a feat: solution scaffold and project initialization (Story 1-1)` — only commit so far
- **Files to be aware of:** `src/EventHub.Infrastructure/Class1.cs` (placeholder to delete), `src/EventHub.Infrastructure/EventHub.Infrastructure.csproj` (needs NuGet packages added)
- **Current Infrastructure .csproj:** Only has `<ProjectReference>` to Application — correct, just needs NuGet packages

### Latest Technology Notes (February 2026)

- **EF Core 8.0.x** — LTS until November 2026. Use latest 8.0.x patch (all EF packages must match versions)
- **Azure.Messaging.ServiceBus 7.x** — Latest stable (~7.20.1). Legacy Azure Service Bus SDKs retire September 30, 2026 — use this package
- **Breaking change awareness:** EF Core 8 changed discriminator column handling (not relevant for this entity, no inheritance). String key comparisons use case-insensitive ordinal by default on SQL Server

### File Naming Conventions

- C# files: **PascalCase** — `EventHubDbContext.cs`, `EventConfiguration.cs`, `EventRepository.cs`, `ServiceBusPublisher.cs`, `ServiceCollectionExtensions.cs`
- Namespaces match folder structure: `EventHub.Infrastructure.Data`, `EventHub.Infrastructure.Data.Configurations`, `EventHub.Infrastructure.Repositories`, `EventHub.Infrastructure.Services`, `EventHub.Infrastructure.Extensions`
- Folders: **PascalCase** — `Data/`, `Data/Configurations/`, `Data/Migrations/`, `Repositories/`, `Services/`, `Extensions/`

### Project Structure Notes

- All paths align with Architecture Doc Section "Complete Project Directory Structure"
- Infrastructure layer implements the contracts defined in Application layer
- `Data/Migrations/` folder will be auto-generated by `dotnet ef migrations add`
- No conflicts with existing project structure from Story 1.1

### Target Infrastructure Directory Structure

```
src/EventHub.Infrastructure/
├── Data/
│   ├── EventHubDbContext.cs
│   ├── Configurations/
│   │   └── EventConfiguration.cs
│   └── Migrations/
│       ├── YYYYMMDDHHMMSS_InitialCreate.cs           ← auto-generated
│       ├── YYYYMMDDHHMMSS_InitialCreate.Designer.cs  ← auto-generated
│       └── EventHubDbContextModelSnapshot.cs          ← auto-generated
├── Repositories/
│   └── EventRepository.cs
├── Services/
│   └── ServiceBusPublisher.cs
├── Extensions/
│   └── ServiceCollectionExtensions.cs
└── EventHub.Infrastructure.csproj
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-1: Database — Azure SQL]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2: Messaging — Service Bus Queue]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6: Pagination Strategy — Server-Side]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Validation: DataAnnotations]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Data Access: EF Core Code-First with Migrations]
- [Source: _bmad-output/planning-artifacts/architecture.md#.NET Clean Architecture Projects — EventHub.Infrastructure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns — Database (EF Core conventions)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns — C# Code]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines — Rules #4, #7, #10, #13, #14]
- [Source: _bmad-output/planning-artifacts/architecture.md#Service Bus Message Format]
- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations — Azure SQL, Azure Service Bus]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: Infrastructure Layer & Database Setup]
- [Source: _bmad-output/planning-artifacts/prd.md#Data Model — Event]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-I1 — At-least-once delivery]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-I2 — Idempotent processing]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-S3 — Secrets in configuration]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-M1 — Layer separation]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-M2 — Externalized config]
- [Source: _bmad-output/implementation-artifacts/1-1-solution-scaffold-and-project-initialization.md — Previous Story Learnings]
- [Source: _bmad-output/implementation-artifacts/1-2-domain-model-and-application-layer.md — Dependency Story Context]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- EF Core Tools package install failed on first attempt due to network timeout; succeeded on retry
- `dotnet-ef` global tool installed (v10.0.3, backwards compatible with EF Core 8.x)
- Class1.cs placeholder already deleted by Story 1.2

### Completion Notes List

- Implemented EventHubDbContext with DbSet<Event> and assembly-based configuration loading
- Created EventConfiguration with IEntityTypeConfiguration<Event>: GUID PK, string columns with max lengths, string enum conversion, 3 named indexes
- Implemented EventRepository with IQueryable-based filtering (Type exact match, UserId exact match, Description case-insensitive contains, date range), expression-based sorting, and Skip/Take pagination returning PagedResult<Event>
- Implemented ServiceBusPublisher with JSON serialization, MessageId deduplication, IAsyncDisposable
- Created AddInfrastructure DI extension: DbContext (scoped), ServiceBusClient (singleton), EventRepository (scoped), ServiceBusPublisher (scoped)
- Created DesignTimeDbContextFactory for migration tooling without modifying Program.cs
- Generated InitialCreate migration with correct Events table schema, all columns, constraints, and 3 indexes
- Verified SQL script output matches AC #3 exactly
- Full solution build: 0 errors, 0 warnings

### File List

- `src/EventHub.Infrastructure/EventHub.Infrastructure.csproj` (modified — added NuGet packages)
- `src/EventHub.Infrastructure/Data/EventHubDbContext.cs` (new)
- `src/EventHub.Infrastructure/Data/DesignTimeDbContextFactory.cs` (new)
- `src/EventHub.Infrastructure/Data/Configurations/EventConfiguration.cs` (new)
- `src/EventHub.Infrastructure/Repositories/EventRepository.cs` (new)
- `src/EventHub.Infrastructure/Services/ServiceBusPublisher.cs` (new)
- `src/EventHub.Infrastructure/Extensions/ServiceCollectionExtensions.cs` (new)
- `src/EventHub.Infrastructure/Migrations/20260223150639_InitialCreate.cs` (new — auto-generated)
- `src/EventHub.Infrastructure/Migrations/20260223150639_InitialCreate.Designer.cs` (new — auto-generated)
- `src/EventHub.Infrastructure/Migrations/EventHubDbContextModelSnapshot.cs` (new — auto-generated)
- `src/EventHub.Api/EventHub.Api.csproj` (modified — added Microsoft.EntityFrameworkCore.Design)

### Change Log

- 2026-02-23: Story 1.3 implementation complete — Infrastructure layer with EF Core DbContext, EventRepository, ServiceBusPublisher, DI registration, and InitialCreate migration
