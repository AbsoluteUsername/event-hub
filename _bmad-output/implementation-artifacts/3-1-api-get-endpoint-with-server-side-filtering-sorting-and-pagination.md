# Story 3.1: API GET Endpoint with Server-Side Filtering, Sorting & Pagination

Status: review
Story-Key: 3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination
Epic: 3 — Event Discovery & Table Display (Full Stack)
Date: 2026-02-23

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **API Consumer**,
I want to retrieve stored events via `GET /api/events` with query parameters for filtering, sorting, and pagination,
So that I can access exactly the data I need without over-fetching.

## Acceptance Criteria

1. **Given** events exist in the database
   **When** the API Consumer sends `GET /api/events` with no parameters
   **Then** the API returns a `PagedResult<EventResponse>` with `{ items, totalCount, page: 1, pageSize: 20 }` sorted by `createdAt` descending

2. **Given** the API Consumer provides filter parameters `?type=Click&userId=olena&description=checkout&from=2026-01-01&to=2026-12-31`
   **When** the request is processed
   **Then** only events matching ALL specified filters are returned (AND logic)
   **And** Type filter uses exact match, UserId uses exact match, Description uses case-insensitive substring (contains) matching
   **And** date range filters on `createdAt >= from AND createdAt <= to`

3. **Given** the API Consumer provides pagination parameters `?page=2&pageSize=10`
   **When** the request is processed
   **Then** the response contains items for page 2 (items 11-20) with correct `totalCount` reflecting filtered dataset size

4. **Given** the API Consumer provides sort parameters `?sortBy=userId&sortDir=asc`
   **When** the request is processed
   **Then** the response items are sorted by `userId` ascending
   **And** sortable fields are: `id`, `userId`, `type`, `description`, `createdAt`

5. **Given** no events match the filter criteria
   **When** the request is processed
   **Then** the API returns `{ items: [], totalCount: 0, page: 1, pageSize: 20 }`

## Tasks / Subtasks

- [x] Task 1: Implement GET endpoint in EventsController (AC: #1, #2, #3, #4, #5)
  - [x] 1.1 Inject `IEventRepository` into `EventsController` constructor alongside existing `IServiceBusPublisher` and `ILogger`
  - [x] 1.2 Replace the `GetAll()` stub (currently returns 501) with a full implementation accepting `[FromQuery] EventFilter filter`
  - [x] 1.3 Call `_eventRepository.GetAllAsync(filter)` to get `PagedResult<Event>`
  - [x] 1.4 Map `PagedResult<Event>` to `PagedResult<EventResponse>` using LINQ `.Select()` on the Items collection
  - [x] 1.5 Return `Ok(result)` with HTTP 200
  - [x] 1.6 Add `[ProducesResponseType(typeof(PagedResult<EventResponse>), StatusCodes.Status200OK)]` attribute
  - [x] 1.7 Add XML summary comment on the method for Swagger documentation describing all query parameters

- [x] Task 2: Add `AsNoTracking()` to repository read query (AC: #1)
  - [x] 2.1 In `EventRepository.GetAllAsync()`, add `.AsNoTracking()` after `_dbContext.Events.AsQueryable()` for read-only performance optimization
  - [x] 2.2 Add `.ThenBy(e => e.Id)` after the primary sort in `ApplySorting()` for stable pagination ordering

- [x] Task 3: Add `getAll()` method to Angular EventService (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `EventFilter` interface in `src/frontend/src/app/shared/models/event-filter.model.ts`
  - [x] 3.2 Implement `getAll(filter: EventFilter): Observable<PagedResult<EventResponse>>` in `event.service.ts`
  - [x] 3.3 Build `HttpParams` from filter object, omitting null/undefined/empty values
  - [x] 3.4 Call `this.http.get<PagedResult<EventResponse>>(\`\${this.apiUrl}/api/events\`, { params })`

- [x] Task 4: Unit Tests — EventsController GET endpoint (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Update `tests/EventHub.Api.Tests/Controllers/EventsControllerTests.cs`
  - [x] 4.2 Test `GetAll_WithNoFilters_ReturnsPagedResult` — default page 1, pageSize 20
  - [x] 4.3 Test `GetAll_WithTypeFilter_ReturnsFilteredResults` — only matching type
  - [x] 4.4 Test `GetAll_WithAllFilters_ReturnsFilteredResults` — combined AND filters
  - [x] 4.5 Test `GetAll_WithPagination_ReturnsCorrectPage` — page 2 returns correct items
  - [x] 4.6 Test `GetAll_WithSorting_ReturnsSortedResults` — sortBy + sortDir applied
  - [x] 4.7 Test `GetAll_NoMatchingEvents_ReturnsEmptyResult` — items: [], totalCount: 0
  - [x] 4.8 Mock `IEventRepository` using Moq for all tests

- [x] Task 5: Unit Tests — Angular EventService getAll() (AC: #1, #2, #3, #4)
  - [x] 5.1 Update or create `src/frontend/src/app/core/services/event.service.spec.ts`
  - [x] 5.2 Test `getAll()` sends GET request to correct URL with query params
  - [x] 5.3 Test `getAll()` omits null/undefined filter values from query params
  - [x] 5.4 Test `getAll()` returns `Observable<PagedResult<EventResponse>>` with correct shape
  - [x] 5.5 Use `HttpClientTestingModule` / `provideHttpClientTesting()` for HTTP mocking

- [x] Task 6: Verify End-to-End Flow
  - [x] 6.1 Run `dotnet build` — zero errors, zero warnings
  - [x] 6.2 Run `dotnet test` — all existing + new tests pass
  - [x] 6.3 Run `ng test` — all existing + new tests pass
  - [x] 6.4 Run `ng lint` — 0 errors
  - [x] 6.5 Run `ng build` — successful production build

## Dev Notes

### Architecture Patterns & Constraints

- **Clean Architecture dependency rule**: Controller (Presentation) → IEventRepository (Application interface) → EventRepository (Infrastructure implementation). Controller NEVER accesses DbContext directly
- **[ApiController] automatic validation**: `EventFilter` properties with enum types get validated automatically — invalid enum value = 400 Bad Request without any custom code
- **JSON serialization**: `JsonStringEnumConverter` is already registered in `Program.cs` — `EventType` enum serializes as `"PageView"`, `"Click"`, `"Purchase"` in both request and response
- **Error response format**: All errors follow FR23 format `{"errors": {"field": "message"}}` — handled by `ConfigureApiBehaviorOptions` (400s) and `ExceptionHandlingMiddleware` (500s)
- **Server-side pagination (ADR-6)**: `GET /api/events?page=1&pageSize=20&sortBy=createdAt&sortDir=desc` returning `{ items, totalCount, page, pageSize }` — this is the contract, not client-side
- **NFR-P2**: API response time for GET with filters must not exceed 500ms at 95th percentile with up to 1,000 stored events — existing database indexes on `CreatedAt`, `UserId`, `Type` ensure this

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Why |
|------|-------|-----|
| `EventRepository.GetAllAsync()` | `src/EventHub.Infrastructure/Repositories/EventRepository.cs` | **FULLY IMPLEMENTED** — filtering, sorting, pagination all done. Just call it |
| `EventRepository.ApplySorting()` | Same file, private method | Switch-based sorting for all 5 columns with case-insensitive matching. Defaults to `createdAt desc` |
| `EventFilter` DTO | `src/EventHub.Application/DTOs/EventFilter.cs` | All query params defined with defaults: `Page=1, PageSize=20, SortBy="createdAt", SortDir="desc"` |
| `PagedResult<T>` | `src/EventHub.Application/DTOs/PagedResult.cs` | Generic paged result — `Items`, `TotalCount`, `Page`, `PageSize` |
| `EventResponse` | `src/EventHub.Application/DTOs/EventResponse.cs` | Response DTO with `Id`, `UserId`, `Type`, `Description`, `CreatedAt` |
| `IEventRepository` interface | `src/EventHub.Application/Interfaces/IEventRepository.cs` | Already has `GetAllAsync(EventFilter)` returning `PagedResult<Event>` |
| DI registration | `src/EventHub.Infrastructure/Extensions/ServiceCollectionExtensions.cs` | `IEventRepository` registered as scoped — inject in constructor |
| `PagedResult<T>` (Angular) | `src/frontend/src/app/shared/models/paged-result.model.ts` | Already exists — `items: T[], totalCount, page, pageSize` |
| `EventResponse` (Angular) | `src/frontend/src/app/shared/models/event.model.ts` | Already exists — `id, userId, type, description, createdAt` |
| Validation error format | `src/EventHub.Api/Program.cs` lines 24-33 | Custom `InvalidModelStateResponseFactory` returns `{ "errors": { ... } }` |
| Exception middleware | `src/EventHub.Api/Middleware/ExceptionHandlingMiddleware.cs` | Returns `{"errors":{"server":"An unexpected error occurred."}}` for unhandled exceptions |

### Critical Anti-Patterns to Avoid

- **DO NOT** implement filtering/sorting/pagination logic in the controller — `EventRepository.GetAllAsync()` already handles everything. Controller is pure orchestration: receive filter → call repo → map result → return
- **DO NOT** add `AsTracking()` or forget `AsNoTracking()` — this is a read-only query, change tracking adds unnecessary overhead
- **DO NOT** use `System.Linq.Dynamic.Core` or expression tree APIs for sorting — the switch-based `ApplySorting()` is already implemented and type-safe
- **DO NOT** add validation attributes to `EventFilter` — `[ApiController]` handles enum validation automatically; pagination bounds should use reasonable defaults not hard constraints
- **DO NOT** create a separate mapper class for `Event → EventResponse` — simple LINQ `.Select()` inline is cleaner for 5 fields
- **DO NOT** modify the existing `Create()` POST endpoint — this story only touches the `GetAll()` method
- **DO NOT** use `*ngIf` — use `@if` control flow (Angular 19)
- **DO NOT** add `MatSnackBarModule` or any NgModule imports — everything is standalone
- **DO NOT** use `HTTP_INTERCEPTORS` multi-provider — use `withInterceptors([...])` functional pattern (already configured)
- **DO NOT** skip `.ThenBy(e => e.Id)` — without a tiebreaker, SQL Server returns non-deterministic order for rows with equal sort values, causing items to appear on wrong pages

### Implementation Patterns

#### Controller GET Method Pattern

```csharp
[HttpGet]
[ProducesResponseType(typeof(PagedResult<EventResponse>), StatusCodes.Status200OK)]
public async Task<ActionResult<PagedResult<EventResponse>>> GetAll([FromQuery] EventFilter filter)
{
    var result = await _eventRepository.GetAllAsync(filter);

    var response = new PagedResult<EventResponse>
    {
        Items = result.Items.Select(e => new EventResponse
        {
            Id = e.Id,
            UserId = e.UserId,
            Type = e.Type,
            Description = e.Description,
            CreatedAt = e.CreatedAt
        }).ToList(),
        TotalCount = result.TotalCount,
        Page = result.Page,
        PageSize = result.PageSize
    };

    return Ok(response);
}
```

#### Angular EventFilter Interface Pattern

```typescript
// src/frontend/src/app/shared/models/event-filter.model.ts
import { EventType } from './event.model';

export interface EventFilter {
  type?: EventType | null;
  userId?: string;
  description?: string;
  from?: string;   // ISO 8601 date string
  to?: string;     // ISO 8601 date string
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}
```

#### Angular EventService.getAll() Pattern

```typescript
getAll(filter: EventFilter): Observable<PagedResult<EventResponse>> {
  let params = new HttpParams()
    .set('page', filter.page.toString())
    .set('pageSize', filter.pageSize.toString())
    .set('sortBy', filter.sortBy)
    .set('sortDir', filter.sortDir);

  if (filter.type) params = params.set('type', filter.type);
  if (filter.userId) params = params.set('userId', filter.userId);
  if (filter.description) params = params.set('description', filter.description);
  if (filter.from) params = params.set('from', filter.from);
  if (filter.to) params = params.set('to', filter.to);

  return this.http.get<PagedResult<EventResponse>>(`${this.apiUrl}/api/events`, { params });
}
```

#### Controller Tests Pattern (Moq)

```csharp
private readonly Mock<IEventRepository> _repositoryMock = new();
private readonly Mock<IServiceBusPublisher> _publisherMock = new();
private readonly Mock<ILogger<EventsController>> _loggerMock = new();
private readonly EventsController _controller;

public EventsControllerTests()
{
    _controller = new EventsController(_publisherMock.Object, _loggerMock.Object, _repositoryMock.Object);
}

[Fact]
public async Task GetAll_WithNoFilters_ReturnsOkWithPagedResult()
{
    var filter = new EventFilter();
    var pagedResult = new PagedResult<Event>
    {
        Items = new List<Event> { /* test events */ },
        TotalCount = 1,
        Page = 1,
        PageSize = 20
    };
    _repositoryMock.Setup(r => r.GetAllAsync(It.IsAny<EventFilter>())).ReturnsAsync(pagedResult);

    var result = await _controller.GetAll(filter);

    var okResult = Assert.IsType<OkObjectResult>(result.Result);
    var response = Assert.IsType<PagedResult<EventResponse>>(okResult.Value);
    Assert.Equal(1, response.TotalCount);
}
```

### Project Structure Notes

```
src/EventHub.Api/Controllers/
├── EventsController.cs          # MODIFY — replace GetAll() stub, add IEventRepository injection

src/EventHub.Infrastructure/Repositories/
├── EventRepository.cs           # MODIFY — add AsNoTracking() + ThenBy(e => e.Id) tiebreaker

src/frontend/src/app/
├── core/services/
│   └── event.service.ts         # MODIFY — add getAll() method
├── shared/models/
│   ├── event.model.ts           # EXISTING — no changes needed
│   ├── event-filter.model.ts    # NEW — EventFilter interface
│   └── paged-result.model.ts    # EXISTING — no changes needed

tests/EventHub.Api.Tests/Controllers/
├── EventsControllerTests.cs     # MODIFY — add GET endpoint tests
```

**Alignment with Architecture Doc:**
- Controller route: `api/events` matches architecture `api/[controller]` convention
- `[FromQuery]` binding matches ADR-6 API contract: `GET /api/events?type=Click&userId=test&page=1&pageSize=20&sortBy=createdAt&sortDir=desc`
- Response format: `{ items: EventResponse[], totalCount: number, page: number, pageSize: number }` matches PagedResult<T> contract
- JSON field casing: camelCase (System.Text.Json default) — `userId`, `createdAt`, `totalCount`

### Previous Story Intelligence (Epic 2)

**From Story 2.5 (most recent):**
- Established `NotificationService` wrapper pattern — reusable for Epic 3's GET error toasts
- NgRx effects pattern with `inject()` function — continue using same pattern in Epic 3 events store
- All 44 tests passing across Angular workspace before this story

**From Story 2.1 (POST endpoint):**
- `EventsController` currently injects `IServiceBusPublisher` and `ILogger<EventsController>` — add `IEventRepository` as third dependency
- `CreatedAtAction(null, ...)` pattern used for POST 201 — GET uses `Ok(...)` for 200
- `ProducesResponseType` attributes used — follow same pattern for GET

**From Story 2.3 (NgRx Submission Store):**
- `EventService.create()` method already exists — add `getAll()` alongside it
- `HttpClient` injection via `inject(HttpClient)` pattern — follow same pattern
- `environment.apiUrl` used for base URL — follow same pattern

### Git Intelligence

Recent commits follow single-story-per-commit pattern:
```
c08a0f8 feat: 2-5-form-submission-feedback-toast-notifications - Form Submission Feedback Toast Notifications
cfade28 feat: 2-4-event-creation-form-component - Event Creation Form Component
8b7f85e feat: 2-3-ngrx-submission-store-and-event-service - NgRx Submission Store & Event Service
06b9ff0 feat: 2-2-azure-function-event-processing-and-db-persistence - Azure Function Event Processing & DB Persistence
4702042 feat: 2-1-api-post-endpoint-and-server-side-validation - API POST Endpoint & Server-Side Validation
```

Commit this story as: `feat: 3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination - API GET Endpoint with Server-Side Filtering, Sorting & Pagination`

### Latest Tech Notes

**EF Core 8 / .NET 8:**
- `AsNoTracking()` skips change tracking — critical for read-only list queries (measurable perf improvement)
- `string.Contains()` translates to SQL `LIKE '%term%'` — Azure SQL default collation `SQL_Latin1_General_CP1_CI_AS` is case-insensitive, so no extra handling needed
- Always add `.ThenBy(e => e.Id)` tiebreaker after primary sort — without unique ordering, SQL Server returns non-deterministic results for rows with equal sort keys, breaking pagination consistency
- EF Core 8 OPENJSON change: `Contains()` over parameterized collections uses `OPENJSON` requiring Azure SQL compatibility level >= 130. Not directly relevant for single-value filters used here, but be aware
- `[FromQuery]` with `class` DTOs (not `record`) works correctly — nullable properties are optional, default values apply for omitted params

**Angular 19 / NgRx 19.2:**
- `HttpParams` builder pattern for query parameters — omit null/undefined values
- `Observable<PagedResult<EventResponse>>` return type for getAll() method
- Class-based `@Injectable()` effects with `inject()` remain the standard pattern
- `provideHttpClientTesting()` for unit test HTTP mocking (not `HttpClientTestingModule`)
- `switchMap` for list loading effects (cancels stale requests on new filter change)
- `debounceTime(300)` before `switchMap` in effects for filter changes (Story 3.2 will implement this)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6 Pagination Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- [Source: _bmad-output/planning-artifacts/prd.md#FR6, FR7, FR8, FR9, FR10, FR11, FR16, FR17, FR31, FR32]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P2]
- [Source: src/EventHub.Api/Controllers/EventsController.cs]
- [Source: src/EventHub.Infrastructure/Repositories/EventRepository.cs]
- [Source: src/EventHub.Application/DTOs/EventFilter.cs]
- [Source: src/EventHub.Application/DTOs/PagedResult.cs]
- [Source: src/EventHub.Application/DTOs/EventResponse.cs]
- [Source: src/EventHub.Application/Interfaces/IEventRepository.cs]
- [Source: src/EventHub.Infrastructure/Data/Configurations/EventConfiguration.cs]
- [Source: src/EventHub.Api/Program.cs]
- [Source: src/frontend/src/app/core/services/event.service.ts]
- [Source: src/frontend/src/app/shared/models/event.model.ts]
- [Source: src/frontend/src/app/shared/models/paged-result.model.ts]

## Change Log

- 2026-02-24: Implemented full GET /api/events endpoint with server-side filtering, sorting, and pagination. Added AsNoTracking() and ThenBy(Id) tiebreaker to repository. Created Angular EventFilter model and EventService.getAll() method. Added comprehensive unit tests for both .NET controller and Angular service.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Task 1: Replaced 501 stub in EventsController.GetAll() with full implementation. Injected IEventRepository, added [FromQuery] EventFilter binding, LINQ mapping Event→EventResponse, ProducesResponseType attribute, and XML summary documentation.
- Task 2: Added .AsNoTracking() to EventRepository.GetAllAsync() for read-only performance. Added .ThenBy(e => e.Id) tiebreaker to ApplySorting() for deterministic pagination ordering.
- Task 3: Created EventFilter TypeScript interface in event-filter.model.ts. Implemented getAll() method in EventService using HttpParams builder pattern with conditional parameter inclusion (omit null/undefined).
- Task 4: Updated EventsControllerTests.cs — added Mock<IEventRepository>, updated constructor to accept 3 dependencies. Added 7 GET endpoint tests: no filters, type filter, all filters, pagination, sorting, empty results. Removed obsolete 501 test.
- Task 5: Updated event.service.spec.ts — added 3 getAll() tests: correct URL with query params, omitting null/undefined params, correct response shape.
- Task 6: All verification passed — dotnet build (0 errors, 0 warnings), dotnet test (34/34 passed), ng test (47/47 passed), ng lint (0 errors), ng build (successful).

### File List

- src/EventHub.Api/Controllers/EventsController.cs (MODIFIED)
- src/EventHub.Infrastructure/Repositories/EventRepository.cs (MODIFIED)
- src/frontend/src/app/core/services/event.service.ts (MODIFIED)
- src/frontend/src/app/shared/models/event-filter.model.ts (NEW)
- src/frontend/src/app/core/services/event.service.spec.ts (MODIFIED)
- tests/EventHub.Api.Tests/Controllers/EventsControllerTests.cs (MODIFIED)
- _bmad-output/implementation-artifacts/sprint-status.yaml (MODIFIED)
- _bmad-output/implementation-artifacts/3-1-api-get-endpoint-with-server-side-filtering-sorting-and-pagination.md (MODIFIED)
