using EventHub.Application.DTOs;
using EventHub.Domain.Entities;

namespace EventHub.Application.Interfaces;

public interface IEventRepository
{
    Task<PagedResult<Event>> GetAllAsync(EventFilter filter);
    Task<Event> CreateAsync(Event entity);
}
