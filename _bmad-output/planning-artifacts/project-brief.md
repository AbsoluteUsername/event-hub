# Project Brief: Event Hub

**Version:** 1.0
**Date:** 2026-02-20
**Author:** Mary (BMAD Business Analyst)
**Project:** event-hub

---

## 1. Executive Summary

Event Hub is a full-stack web application that enables users to create, collect, and view user interaction events. The system provides a real-time data pipeline using cloud-native Azure services, demonstrating modern full-stack development practices across Angular, .NET, and Azure infrastructure.

This project is a technical assessment deliverable showcasing .NET Azure Full-Stack Angular development skills, BMAD methodology adoption, and effective use of AI-assisted development tooling.

---

## 2. Problem Statement

Organizations need a reliable, scalable mechanism for tracking and analyzing discrete user interaction events (page views, clicks, purchases). These events must be:

- Captured via a user-friendly interface
- Processed asynchronously to ensure decoupling between ingestion and storage
- Stored durably with support for filtering and sorting
- Visualized in a clean, responsive UI

---

## 3. Goals and Objectives

| Goal | Description |
|------|-------------|
| Event Ingestion | Users can create typed events via a form-based UI |
| Async Processing | Events flow through Azure Service Bus for decoupled, reliable processing |
| Persistent Storage | Events are stored in a cloud database with filtering and sorting support |
| Event Viewing | Users can view, filter, and sort events via a tabular UI |
| Code Quality | Clean project structure, error handling, logging, and documentation |

---

## 4. Target Users

**Primary user:** A developer/evaluator running the application locally or reviewing the source code.
**End-user persona:** A web application user who triggers and views events through a browser interface.

---

## 5. Core Features and Requirements

### 5.1 Frontend (Angular SPA)

- **Event Creation Form** — Reactive Forms with fields: UserId, Type (PageView / Click / Purchase), Description
- **Events Table** — Paginated/filterable table displaying all stored events (Id, UserId, Type, Description, CreatedAt)
- Filtering by event Type and/or UserId

### 5.2 Backend (.NET Web API)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | `POST` | Accept new event payload, publish to Azure Service Bus |
| `/api/events` | `GET` | Return stored events with optional filter parameters |

- Input validation and structured error responses
- Logging (console / Application Insights compatible)

### 5.3 Event Processing (Azure Function)

- **Trigger:** Azure Service Bus (Queue or Topic)
- **Action:** Deserialize event message → persist to database
- Retry/error handling for failed messages

### 5.4 Data Model

```
Event {
  Id          : GUID         (auto-generated)
  UserId      : string       (required)
  Type        : enum         (PageView | Click | Purchase)
  Description : string       (required)
  CreatedAt   : DateTime     (UTC, auto-set on creation)
}
```

---

## 6. Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular (latest stable), Reactive Forms, Angular Material or Bootstrap |
| Backend API | .NET 8+, ASP.NET Core Web API |
| Messaging | Azure Service Bus (Queue or Topic) |
| Event Processor | Azure Functions (.NET isolated worker) |
| Database | Azure SQL **or** Azure Cosmos DB (NoSQL) |
| Hosting | Azure App Service (API), Azure Function App |
| Dev tooling | AI assistants (GitHub Copilot, Claude, ChatGPT) |
| Methodology | BMAD Method |

---

## 7. Azure Architecture Overview

```
[Angular SPA]
     │ HTTP POST /api/events
     ▼
[.NET Web API on Azure App Service]
     │ Publishes message
     ▼
[Azure Service Bus Queue/Topic]
     │ Triggers
     ▼
[Azure Function App]
     │ Writes
     ▼
[Azure SQL / Cosmos DB]
     ▲
     │ HTTP GET /api/events
[.NET Web API] ◄── [Angular SPA]
```

---

## 8. Quality Requirements

- Readable, well-organized project structure (separation of concerns)
- Consistent error handling across API and Function layers
- Structured logging (ready for Application Insights integration)
- `README.md` with:
  - Architecture overview
  - Local setup and run instructions
  - Explanation of key decisions and trade-offs

---

## 9. Bonus Features (Optional, Time Permitting)

| Feature | Technology | Value |
|---------|-----------|-------|
| Live event updates | SignalR | Real-time UI refresh |
| Automated CI/CD | GitHub Actions | Repeatable build/test pipeline |
| Infrastructure as Code | Bicep or Terraform | Reproducible Azure environment |
| Monitoring | Azure Application Insights | Observability and diagnostics |

---

## 10. Constraints and Assumptions

| Type | Detail |
|------|--------|
| **Time constraint** | Target completion: up to 8 hours |
| **Deliverable** | Source code only — no live deployment required |
| **AI usage** | Permitted and encouraged (Copilot, Claude, ChatGPT, etc.) |
| **Methodology** | BMAD Method must be applied |
| **Database choice** | Azure SQL or Cosmos DB — either is acceptable |
| **Auth/security** | Not required for this assessment (no user authentication) |
| **Scale** | Single-user demo scale; no high-availability requirements |

---

## 11. Out of Scope

- User authentication / authorization
- Live Azure deployment / provisioning
- Mobile application
- Event editing or deletion
- Analytics dashboards or reporting

---

## 12. Success Criteria

| Criterion | Description |
|-----------|-------------|
| Functional pipeline | Event created in UI → stored in DB via Service Bus + Function |
| API correctness | POST and GET endpoints work as specified |
| UI completeness | Form creates events; table displays and filters events |
| Code quality | Readable structure, error handling, logging present |
| Documentation | README explains architecture, setup, and decisions |
| BMAD compliance | BMAD methodology artifacts present and applied |

---

## 13. Key Risks and Trade-offs

| Risk | Mitigation |
|------|-----------|
| Azure service setup complexity | Use local emulators (Azurite, Service Bus emulator) for development |
| Time pressure (8h limit) | Prioritize core pipeline; defer bonuses |
| DB choice impact on query flexibility | Azure SQL preferred if strong filtering/sorting is needed; Cosmos DB if flexibility matters |
| Service Bus latency in UI | Acceptable for demo; SignalR bonus addresses real-time UX |
