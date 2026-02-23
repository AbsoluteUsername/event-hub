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
