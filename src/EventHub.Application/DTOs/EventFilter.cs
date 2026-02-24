using EventHub.Domain.Enums;

namespace EventHub.Application.DTOs;

/// <summary>
/// Query parameters for filtering, sorting, and paginating the events list.
/// </summary>
public class EventFilter
{
    /// <summary>Filter by event type (PageView, Click, or Purchase). Optional.</summary>
    public EventType? Type { get; set; }

    /// <summary>Filter by exact UserId match. Optional.</summary>
    public string? UserId { get; set; }

    /// <summary>Filter by Description substring (case-insensitive contains). Optional.</summary>
    public string? Description { get; set; }

    /// <summary>Filter events created on or after this UTC date. Optional.</summary>
    public DateTime? From { get; set; }

    /// <summary>Filter events created on or before this UTC date. Optional.</summary>
    public DateTime? To { get; set; }

    /// <summary>Page number (1-based). Default: 1.</summary>
    public int Page { get; set; } = 1;

    /// <summary>Number of items per page. Default: 20.</summary>
    public int PageSize { get; set; } = 20;

    /// <summary>Field to sort by: id, userId, type, description, createdAt. Default: createdAt.</summary>
    public string SortBy { get; set; } = "createdAt";

    /// <summary>Sort direction: asc or desc. Default: desc.</summary>
    public string SortDir { get; set; } = "desc";
}
