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

    public EventsController(IServiceBusPublisher serviceBusPublisher, ILogger<EventsController> logger)
    {
        _serviceBusPublisher = serviceBusPublisher;
        _logger = logger;
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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await Task.CompletedTask;
        return StatusCode(StatusCodes.Status501NotImplemented);
    }
}
