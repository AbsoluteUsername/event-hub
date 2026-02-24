using EventHub.Domain.Enums;

namespace EventHub.Application.DTOs;

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
