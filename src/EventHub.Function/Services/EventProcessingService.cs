using EventHub.Application.Interfaces;
using EventHub.Application.Messages;
using EventHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EventHub.Function.Services;

public class EventProcessingService
{
    private readonly IEventRepository _repository;
    private readonly ILogger<EventProcessingService> _logger;

    public EventProcessingService(IEventRepository repository, ILogger<EventProcessingService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public virtual async Task<Event?> ProcessAsync(EventMessage message)
    {
        var entity = new Event
        {
            Id = message.Id,
            UserId = message.UserId,
            Type = message.Type,
            Description = message.Description,
            CreatedAt = message.CreatedAt
        };

        try
        {
            await _repository.CreateAsync(entity);
            _logger.LogInformation("Event {EventId} processed successfully", message.Id);
            return entity;
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            _logger.LogWarning("Duplicate event {EventId} ignored", message.Id);
            return null;
        }
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        // Check for SQL Server unique constraint violation (error 2627) or unique index violation (error 2601)
        // Also check message for cross-database compatibility
        var innerMessage = ex.InnerException?.Message ?? string.Empty;
        return innerMessage.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) ||
               innerMessage.Contains("unique index", StringComparison.OrdinalIgnoreCase);
    }
}
