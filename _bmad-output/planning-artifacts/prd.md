---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-e-01-discovery, step-e-02-review, step-e-03-edit]
lastEdited: '2026-02-23'
editHistory:
  - date: '2026-02-23'
    changes: 'Post-validation improvements: added Data Model section, FR31 (pagination), FR32 (sorting), fixed FR6 (Id), rewrote FR3/FR4/FR5 for measurability, added NFR measurement methods, removed implementation leakage from NFRs and FRs, improved FR specificity (FR23/FR26/FR29/FR30), added missing constraints, updated MVP scope and User Journeys for traceability'
inputDocuments:
  - "_bmad-output/planning-artifacts/project-brief.md"
  - "docs/tech-task"
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 1
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - event-hub

**Author:** Ssmol
**Date:** 2026-02-20

## Executive Summary

Event Hub is a greenfield full-stack web application developed as a technical demonstration of .NET Azure development expertise with an Angular frontend. The system implements a cloud-native user event collection and display pipeline: Angular SPA → .NET Web API → Azure Service Bus → Azure Function → Azure SQL/Cosmos DB. The target audience is a technical reviewer evaluating the candidate's skill level through code quality, architectural decisions, and transparency of the development process (BMAD artifacts).

### What Makes This Special

Event Hub demonstrates not just working functionality, but the **developer's way of thinking**: every architectural decision is documented, trade-offs are explained, and the BMAD process is reflected in artifacts (brief, PRD, architecture doc). SignalR is included as a core feature — live table updates are an integral part of the UX for an event-tracking system, not a bonus. The product's value lies in the reviewer being able to trace the path from idea to implementation through BMAD methodology.

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Project Type** | Full-Stack Web Application (Angular SPA + .NET API) |
| **Domain** | General / Developer Assessment |
| **Complexity** | Low |
| **Project Context** | Greenfield |
| **Key Differentiator** | BMAD methodology transparency + SignalR as core feature |

## Success Criteria

### User Success

- Reviewer can trace the full event pipeline without explanation: UI form → API → Service Bus → Function → DB → live table update
- Events table updates in real time (SignalR) without manual page reload
- Code reads like a document: structure is self-explanatory, trade-offs explained in README
- BMAD artifacts (brief, PRD, architecture doc) demonstrate a mature approach to development

### Business Success

- All specified endpoints are functional: `POST /api/events`, `GET /api/events`
- Event filtering by Type, UserId, Description, and date range works correctly
- SignalR live table updates function properly
- README enables local setup without additional explanation

### Technical Success

- Clear separation of concerns: Angular / .NET API / Azure Function as separate layers
- Error handling at API and Azure Function levels with structured logging
- Async pipeline via Service Bus decoupled from API response (fire-and-forget with reliability)
- All BMAD artifacts present and mutually consistent

### Measurable Outcomes

| Outcome | Target |
|---------|--------|
| Event pipeline latency (UI → DB) | < 3 seconds |
| API response time | < 500ms |
| Live update delay (SignalR) | < 1 second after DB write |
| BMAD compliance | Every key architectural decision has a corresponding BMAD document explaining context and trade-offs |
| README completeness | Local setup achievable without additional questions |

## Product Scope

### MVP — Minimum Viable Product

- Angular Reactive Form: UserId, Type (PageView/Click/Purchase), Description
- Events Table with filtering by Type, UserId, Description, and date range, pagination, column sorting, and SignalR live updates
- `POST /api/events` — validation + Service Bus publish
- `GET /api/events` — return stored events with filter parameters
- Azure Function (Service Bus Trigger) → write to Azure SQL or Cosmos DB
- **SignalR** — live table update after Function processing (core, not bonus)
- Error handling + structured logging
- README: architecture, local setup, decision explanations

### Growth Features (Post-MVP)

- CI/CD (GitHub Actions): automated build and test pipeline
- Infrastructure as Code (Bicep or Terraform): reproducible Azure environment
- Application Insights: monitoring and diagnostics

### Vision (Future)

- Event analytics dashboards with aggregated statistics
- Multi-tenant support for a real SaaS scenario
- Fully BMAD-documented lifecycle from idea to production

## Data Model

### Event

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| Id | GUID | Primary key, system-generated | Unique event identifier |
| UserId | string | Required, non-empty, max 100 chars | Identifier of the user who triggered the event |
| Type | enum | Required, one of: PageView, Click, Purchase | Category of the user interaction |
| Description | string | Required, non-empty, max 500 chars | Human-readable description of the event |
| CreatedAt | DateTime (UTC) | System-generated, immutable | Timestamp of event creation |

### Validation Rules

- UserId: non-empty string, trimmed, max 100 characters
- Type: must match one of the three defined enum values exactly
- Description: non-empty string, trimmed, max 500 characters
- Id and CreatedAt: assigned by the system, not accepted from client input

## User Journeys

### Journey 1: End-User — Happy Path (Creating & Viewing Events)

**Persona:** Olena, QA specialist tracking UI interactions during testing.

**Opening Scene:** Olena opens Event Hub in her browser. A clean form with three fields awaits her: UserId, Type, Description.

**Rising Action:** She fills out the form — enters her UserId, selects type "Click", adds description "Tested checkout button". She clicks Submit.

**Climax:** A toast notification appears: "Event submitted successfully". Olena knows the request was accepted. Within a second, the table below updates automatically (SignalR) — a new row with her event appears. She filters by her UserId and sees only her records.

**Resolution:** Olena has a complete feedback loop: form → confirmation → live table. No doubts, no page reloads. A loading indicator briefly appears while data is fetched. She pages through older events, sorts by CreatedAt, and navigates the entire interface using keyboard shortcuts — Tab through fields, Enter to submit.

*Requirements: Reactive Form, `POST /api/events`, toast notification (success/error), SignalR live update, filtering by Type, UserId, Description, and date range, pagination, column sorting, loading indicator, responsive layout (desktop/tablet/mobile), keyboard navigation.*

---

### Journey 2: End-User — Edge Cases (Validation Failures)

**Persona:** Olena in a hurry + Maksym the integrator bypassing the UI.

**Scenario A — Client-side:** Olena clicks Submit with an empty Description field. The form highlights the error instantly — the API is not called. Olena corrects the error and submits successfully.

**Scenario B — Server-side bypass:** Maksym sends directly via curl: `{"userId": "", "type": "InvalidType"}`. The API returns `400 Bad Request` with a structured error response: `{"errors": {"userId": "required", "type": "invalid value"}}`. The pipeline is not polluted — nothing reaches the Service Bus.

**Resolution:** The system is protected at both levels. UI validation — for UX. Server-side — for data integrity.

*Requirements: Angular Reactive Forms validation, server-side validation in POST endpoint (independent of client), structured error responses (`400`), error toast notification.*

---

### Journey 3: Developer/Evaluator (Technical Reviewer)

**Persona:** Ivan, senior .NET developer, evaluating a candidate's technical assessment.

**Opening Scene:** Ivan clones the repository. Opens the README.

**Rising Action:** The README describes the architecture in 5 minutes: Azure pipeline diagram, local setup instructions (real Azure services), trade-off explanations (why Cosmos DB vs Azure SQL). Ivan runs the system — everything starts on the first try.

**Climax:** Ivan sees the `_bmad-output` folder with artifacts: Project Brief, PRD, Architecture Doc, ADR files. Each file tells a coherent story of how decisions were made. He opens the code — clear structure, separation of concerns, error handling at every layer.

**Resolution:** Ivan asks no questions — the answers are already in the documents and code. Impression: the candidate thinks systematically.

*Requirements: README with architecture and setup, BMAD artifacts, clean code, logging.*

---

### Journey 4: API Consumer (Developer Integration)

**Persona:** Maksym, backend developer integrating Event Hub API into his service.

**Opening Scene:** Maksym opens Swagger UI (`/swagger`). He sees two endpoints with full schemas.

**Rising Action:** POST via curl succeeds → `201 Created` with event Id. GET with `?type=Purchase` returns only his events. Error format is consistent and structured.

**Resolution:** Maksym integrates the API in 30 minutes without questions to the author.

*Requirements: Swagger/OpenAPI documentation, consistent error responses, query filter parameters on GET.*

---

### Journey Requirements Summary

| Journey | Key Requirements |
|---------|-----------------|
| End-User Happy Path | Reactive Form, POST /api/events, toast notification, SignalR, filtering (Type, UserId, Description, date range), pagination, sorting, loading indicator, responsive layout, keyboard navigation |
| End-User Edge Cases | Client + server-side validation (bypass scenario), error toast, `400` responses |
| Technical Reviewer | README, BMAD artifacts, clean code, logging |
| API Consumer | Swagger UI, consistent responses, query filters |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Intentional Enterprise at Scale**
Event Hub deliberately applies enterprise patterns (Azure Service Bus, decoupled async pipeline) in a minimal demo context. This is not over-engineering — it is proof that the developer *understands* when and why a more complex architecture is applied, and can explain that decision. Value: the reviewer sees architectural thinking, not just "working code".

**2. BMAD-in-Code**
BMAD artifacts do not sit in a separate folder — they are embedded in the project structure: Architecture Decision Records (ADR files) alongside corresponding components, README with direct links to specific decisions in the PRD. BMAD becomes part of the codebase, not external documentation.

**3. Full Async Event Loop as Demo**
SignalR is included not for "live updates" themselves, but to close the full async event-driven cycle: Angular Form → .NET API → Service Bus → Azure Function → DB → SignalR Hub → Angular Table. This demonstrates end-to-end event-driven architecture in a single project.

### Validation Approach

- Reviewer must be able to trace each of the three patterns in the code without explanation
- ADR files are checked for presence of trade-off explanations
- SignalR flow is verified through live demo (form → table without refresh)

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Reviewer unfamiliar with BMAD | README explains the methodology and points to artifacts |
| Service Bus appears as over-engineering | ADR explains: "why not direct DB call" |
| SignalR complexity unjustified | README demonstrates full event loop with diagram |

## Web App Specific Requirements

### Project-Type Overview

Event Hub is a Single Page Application (Angular), designed for modern browsers. Real-time updates via SignalR are a core feature.

### Technical Architecture Considerations

| Aspect | Decision |
|--------|----------|
| App Type | SPA (Angular, client-side routing) |
| Real-time | SignalR WebSocket connection to .NET Hub |
| State Management | Component-level state (no NgRx — scale does not require it) |
| HTTP Client | Angular HttpClient with interceptors for error handling |
| UI Library | Angular Material or Bootstrap (decided during implementation) |

### Browser Support Matrix

| Browser | Minimum Version |
|---------|----------------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Edge | Last 2 versions |
| Safari | Last 2 versions (preferred) |
| IE / Legacy | ❌ Not supported |

### Responsive Design

- Adaptive layout for desktop (≥1024px), tablet (768–1023px), mobile (< 768px)
- Event creation form — fully usable on mobile
- Events table — horizontal scroll or collapsible columns on small screens
- UI components using Angular Material responsive grid or Bootstrap breakpoints

### Accessibility Level

Basic: semantic HTML5, ARIA labels for the form, keyboard navigation for Submit and filters.

### Implementation Considerations

- Lazy loading of Angular modules for faster initial load
- Environment configs for local and production API URL
- CORS configuration on the .NET API side

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Showcase MVP — a complete demonstration of the cloud-native pipeline in minimal but finished form. Every architectural layer is present and functional.

**Resource Requirements:** 1 developer, up to 8 hours, real Azure environment (Azure subscription required).

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- End-User Happy Path (form → toast → live table)
- End-User Edge Cases (client + server validation)
- Technical Reviewer (README + BMAD artifacts + clean code)
- API Consumer (Swagger + consistent responses)

**Must-Have Capabilities:**
- Angular Reactive Form with validation (UserId, Type, Description)
- Toast notification after submit (success/error)
- Events Table with filtering (Type, UserId, Description, date range), pagination (default 20 items/page), column sorting, and SignalR live updates
- `POST /api/events` — validation + Service Bus publish
- `GET /api/events` — with query parameters for filtering
- Azure Function (Service Bus Trigger) → DB persist
- Azure SQL or Cosmos DB (decided during implementation)
- SignalR Hub → Angular real-time update
- Swagger/OpenAPI documentation
- Error handling + structured logging (API + Function)
- Responsive design (desktop/tablet/mobile)
- README: architecture, setup, trade-off explanations
- BMAD artifacts: Brief + PRD + Architecture Doc + ADR files

### Post-MVP Features

**Phase 2 (Growth):**
- CI/CD (GitHub Actions): automated build and test pipeline
- Infrastructure as Code (Bicep or Terraform): reproducible Azure environment
- Application Insights: monitoring and diagnostics

**Phase 3 (Expansion):**
- Event analytics dashboards with aggregated statistics
- Multi-tenant support for a real SaaS scenario
- Fully BMAD-documented evolution lifecycle

### Risk Mitigation Strategy

| Risk | Category | Mitigation |
|------|----------|------------|
| Azure service provisioning time | Technical | Pre-create Resource Group and all services before coding starts |
| Azure costs (Free tier limits) | Resource | Use Free/Basic tiers; delete resources after submission |
| SignalR + Azure Function integration | Technical | Isolate and test SignalR Hub independently from Function |
| Time constraint (8 hours) | Resource | Priority order: core pipeline → SignalR → documentation → bonuses |
| DB choice (SQL vs Cosmos DB) | Technical | Azure SQL if strong filtering needed; Cosmos DB for flexibility |
| BMAD artifacts overlooked | Market | README with explicit links to artifacts and ADR files in code |

## Functional Requirements

### Event Submission

- **FR1:** End User can submit a new event specifying UserId, event Type, and Description
- **FR2:** End User can select event Type from a predefined set of values (PageView, Click, Purchase)
- **FR3:** End User receives a toast notification displaying a success message after a successful event submission
- **FR4:** End User receives a toast notification with an error message when event submission fails, plus inline field-level error indicators for validation failures
- **FR5:** System prevents submission when required fields are missing or contain invalid values, displaying validation errors before the request is sent

### Event Discovery

- **FR6:** End User can view Id, UserId, Type, Description, and CreatedAt for each stored event in a structured list
- **FR7:** End User can filter the displayed event list by event Type
- **FR8:** End User can filter the displayed event list by UserId
- **FR9:** End User can search the event list by Description using substring (contains) matching
- **FR10:** End User can filter the event list by CreatedAt using a date range picker (from / to)
- **FR11:** End User can apply any combination of available filters simultaneously
- **FR12:** End User can see a loading indicator while event data is being fetched or filters are being applied
- **FR31:** End User can navigate through event list pages using pagination controls (previous, next, page number) with a default page size of 20 items
- **FR32:** End User can sort the event list by any displayed column, with CreatedAt descending as the default sort order

### Real-Time Updates

- **FR13:** End User sees newly persisted events appear in the event list without manual page refresh
- **FR14:** System broadcasts new event notifications to all connected clients upon successful event persistence

### API & Integration

- **FR15:** API Consumer can submit a new event via an HTTP endpoint and receives the generated event Id in the response
- **FR16:** API Consumer can retrieve stored events via an HTTP endpoint
- **FR17:** API Consumer can request filtered events using query parameters (Type, UserId, Description, date range) — filtering applied before returning results
- **FR18:** API Consumer can inspect available endpoints, request/response schemas, and error formats via a built-in API documentation interface
- **FR19:** System publishes accepted events for asynchronous downstream processing
- **FR20:** System persists event data to a database upon receiving an asynchronous event message

### Data Validation & Error Handling

- **FR21:** System validates event data at the API boundary independently of any UI-level validation
- **FR22:** System rejects incomplete or malformed event submissions and returns field-level error details
- **FR23:** System returns error responses in a consistent JSON format (`{"errors": {"field": "message"}}`) across all failure scenarios
- **FR24:** System records all processing errors at both the API and event processing layers

### Developer Experience & Documentation

- **FR25:** Developer can set up and run the full application locally by following README instructions alone
- **FR26:** Developer can trace each architectural decision (database choice, message broker usage, real-time strategy, layer separation) to a corresponding documented rationale
- **FR27:** Developer can access Architecture Decision Records that explain trade-offs for significant technical choices
- **FR28:** Developer can review the complete set of BMAD methodology artifacts (Project Brief, PRD, Architecture Doc)

### Responsive UI

- **FR29:** End User can access and use the application on desktop (≥1024px), tablet (768–1023px), and mobile (<768px) screen sizes with adapted layout per breakpoint
- **FR30:** End User can operate all primary interactions (form submit, filtering, pagination) via keyboard: Tab through fields, Enter to submit, visible focus indicators on all interactive elements

## Non-Functional Requirements

### Performance

- **NFR-P1:** API response time for `POST /api/events` must not exceed 500ms at the 95th percentile, measured at the server, under load of up to 100 concurrent requests
- **NFR-P2:** API response time for `GET /api/events` (with filters applied) must not exceed 500ms at the 95th percentile, measured at the server, with up to 1,000 stored events
- **NFR-P3:** Real-time event notification must be delivered to connected clients within 1 second of successful database write, measured from write completion to client receipt
- **NFR-P4:** Full end-to-end pipeline latency (form submit → database persist → live table update) must not exceed 3 seconds, measured from form submission to visible table update in the browser
- **NFR-P5:** Loading indicator must appear within 200ms of initiating any data fetch or filter operation, measured from user action to visible indicator render

### Security

- **NFR-S1:** All client-server communication must occur over HTTPS
- **NFR-S2:** CORS policy must be environment-aware — permissive for localhost origins in development, restricted to the known frontend application origin in production
- **NFR-S3:** Message broker connection strings and database credentials must be stored in environment configuration, never in source code

### Integration Reliability

- **NFR-I1:** Message broker delivery must follow at-least-once semantics — no event may be permanently lost on transient failure
- **NFR-I2:** Event processing component must process events idempotently using the event Id as a unique database key — duplicate message delivery results in a logged, graceful no-op with no duplicate records written
- **NFR-I3:** Real-time client must attempt automatic reconnection with exponential backoff (0s, 2s, 10s, 30s intervals) upon unexpected disconnect

### Maintainability

- **NFR-M1:** Event processing layer must contain no HTTP-handling code; API layer must contain no direct database access code — layer boundaries enforced and verifiable at code review
- **NFR-M2:** All configuration values must be externalized via environment variables or platform configuration service
- **NFR-M3:** Frontend code must pass configured linter with zero errors; backend code must pass configured code analysis with zero warnings at build time

## Constraints & Known Limitations

- **At-least-once delivery:** Azure Service Bus guarantees at-least-once message delivery; idempotency is achieved via unique Id constraint (NFR-I2), making this transparent to end users
- **No authentication:** UserId is a free-text string with no identity verification — out of scope for this assessment
- **Source code only:** No live Azure deployment is required — deliverable is source code with instructions for local/cloud setup
- **No event mutation:** Event editing or deletion is out of scope — events are immutable after creation
- **Demo scale only:** System is designed for single-user demonstration; no load testing or high-availability requirements apply
