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
