# Story 1.2: Domain Model & Application Layer

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer**,
I want the core domain entities, DTOs, and interface contracts defined,
so that all layers have a shared vocabulary and dependency contracts to build against.

## Acceptance Criteria

1. **Given** the solution from Story 1.1 **When** the Domain and Application layers are implemented **Then** `EventHub.Domain` contains:
   - `Entities/Event.cs` with properties: `Id` (Guid), `UserId` (string), `Type` (EventType), `Description` (string), `CreatedAt` (DateTime UTC)
   - `Enums/EventType.cs` with values: `PageView`, `Click`, `Purchase`

2. **Given** the Domain layer is complete **When** the Application layer is implemented **Then** `EventHub.Application` contains:
   - `DTOs/CreateEventRequest.cs` with DataAnnotations: `[Required]`, `[MaxLength(100)]` on UserId, `[Required][EnumDataType]` on Type, `[Required][MaxLength(500)]` on Description
   - `DTOs/EventResponse.cs` matching API response contract (id, userId, type, description, createdAt)
   - `DTOs/EventFilter.cs` with query params: Type, UserId, Description, From, To, Page, PageSize, SortBy, SortDir
   - `DTOs/PagedResult.cs` generic: `{ Items, TotalCount, Page, PageSize }`
   - `Messages/EventMessage.cs` for Service Bus contract (Id, UserId, Type, Description, CreatedAt)
   - `Interfaces/IEventRepository.cs` with `GetAllAsync(EventFilter)` returning `PagedResult<Event>` and `CreateAsync(Event)` returning `Event`
   - `Interfaces/IServiceBusPublisher.cs` with `PublishAsync(EventMessage)` returning `Task`

3. **Given** the Domain project **When** its dependencies are inspected **Then** it has zero external NuGet package dependencies (only .NET 8 base class libraries)

4. **Given** the Application project **When** its dependencies are inspected **Then** it references only EventHub.Domain (no Infrastructure, Api, or Function references)

5. **Given** all changes are complete **When** `dotnet build` is run from the solution root **Then** the build succeeds with zero errors and zero warnings

## Tasks / Subtasks

- [x] Task 1: Clean up template placeholder files from Story 1.1 (AC: #5)
  - [x] 1.1: Delete `src/EventHub.Domain/Class1.cs` (template placeholder)
  - [x] 1.2: Delete `src/EventHub.Application/Class1.cs` (template placeholder)
  - [x] 1.3: Delete `src/EventHub.Infrastructure/Class1.cs` (template placeholder — preemptive cleanup for Story 1.3)

- [x] Task 2: Implement EventHub.Domain layer (AC: #1, #3)
  - [x] 2.1: Create `Enums/EventType.cs` — enum with values `PageView`, `Click`, `Purchase`
  - [x] 2.2: Create `Entities/Event.cs` — domain entity with: `Id` (Guid), `UserId` (string), `Type` (EventType), `Description` (string), `CreatedAt` (DateTime)
  - [x] 2.3: Verify Domain project has zero external NuGet dependencies in `.csproj`

- [x] Task 3: Implement EventHub.Application DTOs (AC: #2, #4)
  - [x] 3.1: Create `DTOs/CreateEventRequest.cs` with DataAnnotations validation attributes
  - [x] 3.2: Create `DTOs/EventResponse.cs` matching the API response contract
  - [x] 3.3: Create `DTOs/EventFilter.cs` with all query parameters (Type, UserId, Description, From, To, Page, PageSize, SortBy, SortDir) and sensible defaults (Page=1, PageSize=20, SortBy="createdAt", SortDir="desc")
  - [x] 3.4: Create `DTOs/PagedResult.cs` as generic class: `PagedResult<T>` with `Items`, `TotalCount`, `Page`, `PageSize`

- [x] Task 4: Implement EventHub.Application Messages (AC: #2)
  - [x] 4.1: Create `Messages/EventMessage.cs` with all event fields for Service Bus contract

- [ ] Task 5: Implement EventHub.Application Interfaces (AC: #2)
  - [ ] 5.1: Create `Interfaces/IEventRepository.cs` with `Task<PagedResult<Event>> GetAllAsync(EventFilter filter)` and `Task<Event> CreateAsync(Event entity)`
  - [ ] 5.2: Create `Interfaces/IServiceBusPublisher.cs` with `Task PublishAsync(EventMessage message)`

- [ ] Task 6: Verify build and dependencies (AC: #3, #4, #5)
  - [ ] 6.1: Verify `EventHub.Domain.csproj` has zero `<PackageReference>` entries
  - [ ] 6.2: Verify `EventHub.Application.csproj` references only `EventHub.Domain` (one `<ProjectReference>`)
  - [ ] 6.3: Run `dotnet build` from solution root — zero errors, zero warnings

## Dev Notes

### Architecture Patterns & Constraints

- **Clean Architecture Dependency Rule (CRITICAL):** Domain has ZERO dependencies. Application references ONLY Domain. Never add Infrastructure, Api, or Function references.
  ```
  Domain (zero deps) ← Application (→ Domain only)
  ```
- **DataAnnotations for validation (ADR decision):** Use `System.ComponentModel.DataAnnotations` on Application DTOs. Do NOT add FluentValidation or any external validation library. DataAnnotations is built into .NET — no NuGet package needed in Application layer.
- **Enforcement Rule #2:** Use domain entities from EventHub.Domain and DTOs from EventHub.Application — never duplicate type definitions.
- **Enforcement Rule #6:** Use ISO 8601 UTC for all DateTime values — `CreatedAt` must be UTC.
- **Enforcement Rule #13:** Inner layers NEVER reference outer layers.
- **Enforcement Rule #14:** Place interface definitions in `EventHub.Application/Interfaces/` — implementations go in `EventHub.Infrastructure/` (Story 1.3).

### Domain Entity Implementation Details

**Event.cs:**
```csharp
namespace EventHub.Domain.Entities;

public class Event
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public EventType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

**EventType.cs:**
```csharp
namespace EventHub.Domain.Enums;

public enum EventType
{
    PageView,
    Click,
    Purchase
}
```

**Critical notes:**
- `Event` is a simple POCO — no behavior, no validation, no persistence awareness (that's Infrastructure's job)
- `EventType` enum values stored as **string** in DB (configured via `IEntityTypeConfiguration<Event>` in Story 1.3) — NOT as integer
- `Id` is `Guid` (not `int`) — generated server-side, used as Service Bus Message ID for deduplication (NFR-I2)
- `CreatedAt` is `DateTime` (UTC) — assigned server-side, never from client input
- Properties use default values (`string.Empty`) to avoid nullable reference type warnings

### Application DTO Implementation Details

**CreateEventRequest.cs:**
```csharp
using System.ComponentModel.DataAnnotations;
using EventHub.Domain.Enums;

namespace EventHub.Application.DTOs;

public class CreateEventRequest
{
    [Required]
    [MaxLength(100)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [EnumDataType(typeof(EventType))]
    public EventType Type { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
}
```

**EventResponse.cs:**
```csharp
using EventHub.Domain.Enums;

namespace EventHub.Application.DTOs;

public class EventResponse
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public EventType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

**EventFilter.cs:**
```csharp
using EventHub.Domain.Enums;

namespace EventHub.Application.DTOs;

public class EventFilter
{
    public EventType? Type { get; set; }
    public string? UserId { get; set; }
    public string? Description { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "createdAt";
    public string SortDir { get; set; } = "desc";
}
```

**PagedResult.cs:**
```csharp
namespace EventHub.Application.DTOs;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
```

**EventMessage.cs:**
```csharp
using EventHub.Domain.Enums;

namespace EventHub.Application.Messages;

public class EventMessage
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public EventType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

### Interface Implementation Details

**IEventRepository.cs:**
```csharp
using EventHub.Application.DTOs;
using EventHub.Domain.Entities;

namespace EventHub.Application.Interfaces;

public interface IEventRepository
{
    Task<PagedResult<Event>> GetAllAsync(EventFilter filter);
    Task<Event> CreateAsync(Event entity);
}
```

**IServiceBusPublisher.cs:**
```csharp
using EventHub.Application.Messages;

namespace EventHub.Application.Interfaces;

public interface IServiceBusPublisher
{
    Task PublishAsync(EventMessage message);
}
```

### Critical Anti-Patterns to Avoid

- **Do NOT add any NuGet packages to Domain project** — it must have zero external dependencies. `System.ComponentModel.DataAnnotations` is part of .NET BCL, but it should only be used in Application layer DTOs, not in Domain entities.
- **Do NOT add validation attributes to Event entity** — validation belongs on `CreateEventRequest` DTO in Application layer. Domain entities are pure data.
- **Do NOT make EventType a class or record** — it must be a simple `enum` per the architecture doc.
- **Do NOT add Entity Framework attributes ([Key], [Table], etc.) to Domain entities** — EF Core configuration is done via `IEntityTypeConfiguration<T>` in Infrastructure layer (Story 1.3).
- **Do NOT add `INotifyPropertyChanged` or any behavioral patterns** — Domain entities are POCOs.
- **Do NOT create mapping utilities yet** — mapping between Domain entities and DTOs will be handled inline or in Application services (later stories). No AutoMapper.
- **Do NOT create `ServiceCollectionExtensions` yet** — `AddApplication()` DI registration will be added when there are services to register (currently only interfaces and DTOs, no implementations here).

### Learnings from Story 1.1

- Template placeholder files (`Class1.cs`) exist in Domain, Application, and Infrastructure projects — **must be deleted first** before creating real files
- Solution builds clean with zero warnings — maintain this standard
- `.NET 8.0.418 SDK` (runtime 8.0.14) confirmed working
- `--use-controllers` flag was used for Web API — controller-based approach confirmed
- Azure Function project was manually scaffolded (func CLI unavailable) — works correctly

### File Naming Conventions

- C# files: **PascalCase** — `Event.cs`, `EventType.cs`, `CreateEventRequest.cs`
- Namespaces match folder structure: `EventHub.Domain.Entities`, `EventHub.Application.DTOs`
- Folders: **PascalCase** — `Entities/`, `Enums/`, `DTOs/`, `Messages/`, `Interfaces/`

### Project Structure Notes

- All paths align with Architecture Doc Section "Complete Project Directory Structure"
- Domain layer establishes the vocabulary used by ALL other layers
- Application layer defines the contracts that Infrastructure implements
- No conflicts with existing project structure from Story 1.1

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Validation: DataAnnotations]
- [Source: _bmad-output/planning-artifacts/architecture.md#.NET Clean Architecture Projects]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns — C# Code]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines — Rules #2, #6, #13, #14]
- [Source: _bmad-output/planning-artifacts/architecture.md#Service Bus Message Format]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Style: Controllers — Error Response Standard]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6: Pagination Strategy — Server-Side]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: Domain Model & Application Layer]
- [Source: _bmad-output/planning-artifacts/prd.md#Data Model — Event]
- [Source: _bmad-output/planning-artifacts/prd.md#FR21-FR23 — Data Validation & Error Handling]
- [Source: _bmad-output/implementation-artifacts/1-1-solution-scaffold-and-project-initialization.md — Previous Story Learnings]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
