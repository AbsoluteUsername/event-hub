using System.ComponentModel.DataAnnotations;
using EventHub.Domain.Enums;

namespace EventHub.Application.DTOs;

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
