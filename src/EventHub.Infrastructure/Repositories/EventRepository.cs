using EventHub.Application.DTOs;
using EventHub.Application.Interfaces;
using EventHub.Domain.Entities;
using EventHub.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EventHub.Infrastructure.Repositories;

public class EventRepository : IEventRepository
{
    private readonly EventHubDbContext _dbContext;

    public EventRepository(EventHubDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<Event>> GetAllAsync(EventFilter filter)
    {
        var query = _dbContext.Events.AsNoTracking().AsQueryable();

        // Apply filters (AND logic — all conditions must match)
        if (filter.Type.HasValue)
            query = query.Where(e => e.Type == filter.Type.Value);

        if (!string.IsNullOrWhiteSpace(filter.UserId))
            query = query.Where(e => e.UserId == filter.UserId);

        if (!string.IsNullOrWhiteSpace(filter.Description))
            query = query.Where(e => e.Description.Contains(filter.Description));

        if (filter.From.HasValue)
            query = query.Where(e => e.CreatedAt >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(e => e.CreatedAt <= filter.To.Value);

        // Get total count BEFORE pagination
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = ApplySorting(query, filter.SortBy, filter.SortDir);

        // Apply pagination
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResult<Event>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<Event> CreateAsync(Event entity)
    {
        _dbContext.Events.Add(entity);
        await _dbContext.SaveChangesAsync();
        return entity;
    }

    private static IQueryable<Event> ApplySorting(IQueryable<Event> query, string sortBy, string sortDir)
    {
        var isDescending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);

        var ordered = sortBy?.ToLowerInvariant() switch
        {
            "id" => isDescending ? query.OrderByDescending(e => e.Id) : query.OrderBy(e => e.Id),
            "userid" => isDescending ? query.OrderByDescending(e => e.UserId) : query.OrderBy(e => e.UserId),
            "type" => isDescending ? query.OrderByDescending(e => e.Type) : query.OrderBy(e => e.Type),
            "description" => isDescending ? query.OrderByDescending(e => e.Description) : query.OrderBy(e => e.Description),
            "createdat" or _ => isDescending ? query.OrderByDescending(e => e.CreatedAt) : query.OrderBy(e => e.CreatedAt),
        };

        return ordered.ThenBy(e => e.Id);
    }
}
