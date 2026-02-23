using EventHub.Api.Controllers;
using EventHub.Application.DTOs;
using EventHub.Application.Interfaces;
using EventHub.Application.Messages;
using EventHub.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace EventHub.Api.Tests.Controllers;

public class EventsControllerTests
{
    private readonly Mock<IServiceBusPublisher> _mockPublisher;
    private readonly Mock<ILogger<EventsController>> _mockLogger;
    private readonly EventsController _controller;

    public EventsControllerTests()
    {
        _mockPublisher = new Mock<IServiceBusPublisher>();
        _mockLogger = new Mock<ILogger<EventsController>>();
        _controller = new EventsController(_mockPublisher.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task Create_ValidRequest_Returns201WithCorrectResponse()
    {
        var request = new CreateEventRequest
        {
            UserId = "user-123",
            Type = EventType.Click,
            Description = "Clicked the button"
        };

        var result = await _controller.Create(request);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(StatusCodes.Status201Created, createdResult.StatusCode);

        var response = Assert.IsType<EventResponse>(createdResult.Value);
        Assert.NotEqual(Guid.Empty, response.Id);
        Assert.NotEqual(default, response.CreatedAt);
        Assert.Equal(request.UserId, response.UserId);
        Assert.Equal(request.Type, response.Type);
        Assert.Equal(request.Description, response.Description);
    }

    [Fact]
    public async Task Create_ValidRequest_PublishesEventMessageExactlyOnce()
    {
        var request = new CreateEventRequest
        {
            UserId = "user-456",
            Type = EventType.Purchase,
            Description = "Purchased item"
        };

        await _controller.Create(request);

        _mockPublisher.Verify(
            p => p.PublishAsync(It.Is<EventMessage>(m =>
                m.UserId == request.UserId &&
                m.Type == request.Type &&
                m.Description == request.Description &&
                m.Id != Guid.Empty &&
                m.CreatedAt != default)),
            Times.Once);
    }

    [Fact]
    public async Task Create_ValidRequest_EventMessageIdMatchesResponseId()
    {
        EventMessage? capturedMessage = null;
        _mockPublisher
            .Setup(p => p.PublishAsync(It.IsAny<EventMessage>()))
            .Callback<EventMessage>(m => capturedMessage = m)
            .Returns(Task.CompletedTask);

        var request = new CreateEventRequest
        {
            UserId = "user-789",
            Type = EventType.PageView,
            Description = "Viewed homepage"
        };

        var result = await _controller.Create(request);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var response = Assert.IsType<EventResponse>(createdResult.Value);

        Assert.NotNull(capturedMessage);
        Assert.Equal(capturedMessage!.Id, response.Id);
    }

    [Fact]
    public async Task Create_ServiceBusThrows_ExceptionPropagates()
    {
        _mockPublisher
            .Setup(p => p.PublishAsync(It.IsAny<EventMessage>()))
            .ThrowsAsync(new InvalidOperationException("Service Bus unavailable"));

        var request = new CreateEventRequest
        {
            UserId = "user-error",
            Type = EventType.Click,
            Description = "This will fail"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => _controller.Create(request));
    }

    [Fact]
    public async Task GetAll_Returns501NotImplemented()
    {
        var result = await _controller.GetAll();

        var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
        Assert.Equal(StatusCodes.Status501NotImplemented, statusCodeResult.StatusCode);
    }
}
