# Тестове завдання для .NET Azure Full-Stack Angular Developer

Мета завдання --- оцінити практичні навички кандидата у Full-Stack розробці з використанням .NET, Angular та Azure, а також підхід до розробки відповідно до методології BMAD(https://github.com/bmad-code-org/BMAD-METHOD). Використання AI-інструментів (ChatGPT, Copilot, Claude тощо) дозволене.

## Очікуваний час виконання

До 8 годин так як має бути АІ і BMADCore. Не обовʼязково реалізовувати всі бонусні пункти.

## Опис завдання

Необхідно реалізувати систему збору та перегляду подій користувачів (Event Hub), яка складається з Angular SPA, .NET Web API та Azure-інфраструктури.

## Behavior

Користувач у веб-інтерфейсі створює подію.
Подія надсилається на backend API.
Backend публікує подію в Azure Service Bus.
Azure Function обробляє повідомлення та зберігає його в базі даних.
UI відображає список подій з можливістю фільтрації.

## Model

Event:
- Id (GUID)
- UserId (string)
- Type (PageView, Click, Purchase)
- Description (string)
- CreatedAt (DateTime)

## Action

Angular:
- Форма створення події (Reactive Forms)
- Таблиця перегляду подій з фільтрацією

.NET API:
- POST /api/events
- GET /api/events

Azure Function:
- Service Bus Trigger
- Запис подій у базу даних

## Data

База даних: Azure SQL або Cosmos DB.
Події повинні зберігатися з можливістю сортування та фільтрації.

## Azure компоненти

- Azure App Service (API)
- Azure Service Bus (Queue або Topic)
- Azure Function App
- Azure SQL або Cosmos DB

## Вимоги до якості

- Читабельна структура проєкту
- Error handling та логування
- README з описом запуску та архітектури
- Пояснення рішень і trade-offs

## Бонуси (необовʼязково)

- SignalR для live-оновлень
- CI/CD (GitHub Actions)
- Infrastructure as Code (Bicep / Terraform)
- Monitoring (Application Insights)

## AI Policy

https://github.com/bmad-code-org/BMAD-METHOD - це обовязково маж бути використане

Деплоіти нічого не потрібно тільки сорс код.