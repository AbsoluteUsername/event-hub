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

    /// <summary>
    /// Submits a new event to the processing pipeline.
    /// </summary>
    /// <param name="request">Event creation payload with UserId, Type, and Description.</param>
    /// <returns>The created event with generated Id and CreatedAt timestamp.</returns>
    /// <response code="201">Event accepted and queued for async processing.</response>
    /// <response code="400">Validation failed — returns field-level error details: {"errors": {"field": "message"}}.</response>
    /// <response code="500">Unexpected server error — returns {"errors": {"server": "An unexpected error occurred."}}.</response>
    [HttpPost]
    [ProducesResponseType(typeof(EventResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
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
    /// Retrieves a paginated, filtered, and sorted list of events.
    /// </summary>
    /// <param name="filter">Query parameters: type, userId, description, from, to, page, pageSize, sortBy, sortDir.</param>
    /// <returns>Paged result containing items, totalCount, page, and pageSize.</returns>
    /// <response code="200">Successfully retrieved events.</response>
    /// <response code="500">Unexpected server error — returns {"errors": {"server": "An unexpected error occurred."}}.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<EventResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status500InternalServerError)]
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
