using EventHub.Application.DTOs;
using EventHub.Application.Interfaces;
using EventHub.Application.Messages;
using Microsoft.AspNetCore.Mvc;

namespace EventHub.Api.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController : ControllerBase
{
    private readonly IServiceBusPublisher _serviceBusPublisher;
    private readonly ILogger<EventsController> _logger;
    private readonly IEventRepository _eventRepository;

    public EventsController(IServiceBusPublisher serviceBusPublisher, ILogger<EventsController> logger, IEventRepository eventRepository)
    {
        _serviceBusPublisher = serviceBusPublisher;
        _logger = logger;
        _eventRepository = eventRepository;
    }

    [HttpPost]
    [ProducesResponseType(typeof(EventResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EventResponse>> Create(CreateEventRequest request)
    {
        var id = Guid.NewGuid();
        var createdAt = DateTime.UtcNow;

        var eventMessage = new EventMessage
        {
            Id = id,
            UserId = request.UserId,
            Type = request.Type,
            Description = request.Description,
            CreatedAt = createdAt
        };

        await _serviceBusPublisher.PublishAsync(eventMessage);

        _logger.LogInformation("Event {EventId} accepted and published to Service Bus", id);

        var response = new EventResponse
        {
            Id = id,
            UserId = request.UserId,
            Type = request.Type,
            Description = request.Description,
            CreatedAt = createdAt
        };

        return CreatedAtAction(null, new { id = response.Id }, response);
    }

    /// <summary>
    /// Retrieves events with optional filtering, sorting, and pagination.
    /// Query parameters: type, userId, description, from, to, page, pageSize, sortBy, sortDir.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<EventResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<EventResponse>>> GetAll([FromQuery] EventFilter filter)
    {
        var result = await _eventRepository.GetAllAsync(filter);

        var response = new PagedResult<EventResponse>
        {
            Items = result.Items.Select(e => new EventResponse
            {
                Id = e.Id,
                UserId = e.UserId,
                Type = e.Type,
                Description = e.Description,
                CreatedAt = e.CreatedAt
            }).ToList(),
            TotalCount = result.TotalCount,
            Page = result.Page,
            PageSize = result.PageSize
        };

        return Ok(response);
    }
}
