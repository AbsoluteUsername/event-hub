using System.Reflection;
using EventHub.Api.Controllers;
using EventHub.Application.DTOs;
using EventHub.Application.Interfaces;
using EventHub.Application.Messages;
using EventHub.Domain.Entities;
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
    private readonly Mock<IEventRepository> _mockRepository;
    private readonly EventsController _controller;

    public EventsControllerTests()
    {
        _mockPublisher = new Mock<IServiceBusPublisher>();
        _mockLogger = new Mock<ILogger<EventsController>>();
        _mockRepository = new Mock<IEventRepository>();
        _controller = new EventsController(_mockPublisher.Object, _mockLogger.Object, _mockRepository.Object);
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
    public async Task GetAll_WithNoFilters_ReturnsOkWithPagedResult()
    {
        var filter = new EventFilter();
        var events = new List<Event>
        {
            new() { Id = Guid.NewGuid(), UserId = "user-1", Type = EventType.Click, Description = "Click event", CreatedAt = DateTime.UtcNow }
        };
        var pagedResult = new PagedResult<Event>
        {
            Items = events,
            TotalCount = 1,
            Page = 1,
            PageSize = 20
        };
        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<EventFilter>())).ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(filter);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PagedResult<EventResponse>>(okResult.Value);
        Assert.Equal(1, response.TotalCount);
        Assert.Equal(1, response.Page);
        Assert.Equal(20, response.PageSize);
        Assert.Single(response.Items);
        Assert.Equal(events[0].Id, response.Items[0].Id);
        Assert.Equal(events[0].UserId, response.Items[0].UserId);
        Assert.Equal(events[0].Type, response.Items[0].Type);
        Assert.Equal(events[0].Description, response.Items[0].Description);
        Assert.Equal(events[0].CreatedAt, response.Items[0].CreatedAt);
    }

    [Fact]
    public async Task GetAll_WithTypeFilter_ReturnsFilteredResults()
    {
        var filter = new EventFilter { Type = EventType.Click };
        var events = new List<Event>
        {
            new() { Id = Guid.NewGuid(), UserId = "user-1", Type = EventType.Click, Description = "Click event", CreatedAt = DateTime.UtcNow }
        };
        var pagedResult = new PagedResult<Event>
        {
            Items = events,
            TotalCount = 1,
            Page = 1,
            PageSize = 20
        };
        _mockRepository.Setup(r => r.GetAllAsync(It.Is<EventFilter>(f => f.Type == EventType.Click))).ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(filter);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PagedResult<EventResponse>>(okResult.Value);
        Assert.Single(response.Items);
        Assert.Equal(EventType.Click, response.Items[0].Type);
    }

    [Fact]
    public async Task GetAll_WithAllFilters_ReturnsFilteredResults()
    {
        var filter = new EventFilter
        {
            Type = EventType.Purchase,
            UserId = "olena",
            Description = "checkout",
            From = new DateTime(2026, 1, 1),
            To = new DateTime(2026, 12, 31)
        };
        var events = new List<Event>
        {
            new() { Id = Guid.NewGuid(), UserId = "olena", Type = EventType.Purchase, Description = "checkout completed", CreatedAt = new DateTime(2026, 6, 15) }
        };
        var pagedResult = new PagedResult<Event>
        {
            Items = events,
            TotalCount = 1,
            Page = 1,
            PageSize = 20
        };
        _mockRepository.Setup(r => r.GetAllAsync(It.Is<EventFilter>(f =>
            f.Type == EventType.Purchase &&
            f.UserId == "olena" &&
            f.Description == "checkout" &&
            f.From == new DateTime(2026, 1, 1) &&
            f.To == new DateTime(2026, 12, 31)
        ))).ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(filter);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PagedResult<EventResponse>>(okResult.Value);
        Assert.Single(response.Items);
        Assert.Equal("olena", response.Items[0].UserId);
    }

    [Fact]
    public async Task GetAll_WithPagination_ReturnsCorrectPage()
    {
        var filter = new EventFilter { Page = 2, PageSize = 10 };
        var events = new List<Event>
        {
            new() { Id = Guid.NewGuid(), UserId = "user-11", Type = EventType.PageView, Description = "Page view", CreatedAt = DateTime.UtcNow }
        };
        var pagedResult = new PagedResult<Event>
        {
            Items = events,
            TotalCount = 15,
            Page = 2,
            PageSize = 10
        };
        _mockRepository.Setup(r => r.GetAllAsync(It.Is<EventFilter>(f => f.Page == 2 && f.PageSize == 10))).ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(filter);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PagedResult<EventResponse>>(okResult.Value);
        Assert.Equal(2, response.Page);
        Assert.Equal(10, response.PageSize);
        Assert.Equal(15, response.TotalCount);
        Assert.Single(response.Items);
    }

    [Fact]
    public async Task GetAll_WithSorting_ReturnsSortedResults()
    {
        var filter = new EventFilter { SortBy = "userId", SortDir = "asc" };
        var events = new List<Event>
        {
            new() { Id = Guid.NewGuid(), UserId = "alice", Type = EventType.Click, Description = "Click", CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), UserId = "bob", Type = EventType.Click, Description = "Click", CreatedAt = DateTime.UtcNow }
        };
        var pagedResult = new PagedResult<Event>
        {
            Items = events,
            TotalCount = 2,
            Page = 1,
            PageSize = 20
        };
        _mockRepository.Setup(r => r.GetAllAsync(It.Is<EventFilter>(f => f.SortBy == "userId" && f.SortDir == "asc"))).ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(filter);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PagedResult<EventResponse>>(okResult.Value);
        Assert.Equal(2, response.Items.Count);
        Assert.Equal("alice", response.Items[0].UserId);
        Assert.Equal("bob", response.Items[1].UserId);
    }

    [Fact]
    public async Task GetAll_NoMatchingEvents_ReturnsEmptyResult()
    {
        var filter = new EventFilter { Type = EventType.Purchase };
        var pagedResult = new PagedResult<Event>
        {
            Items = new List<Event>(),
            TotalCount = 0,
            Page = 1,
            PageSize = 20
        };
        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<EventFilter>())).ReturnsAsync(pagedResult);

        var result = await _controller.GetAll(filter);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<PagedResult<EventResponse>>(okResult.Value);
        Assert.Empty(response.Items);
        Assert.Equal(0, response.TotalCount);
        Assert.Equal(1, response.Page);
        Assert.Equal(20, response.PageSize);
    }

    [Fact]
    public void Create_Action_HasProducesResponseType_201()
    {
        var method = typeof(EventsController).GetMethod(nameof(EventsController.Create));
        var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
            .FirstOrDefault(a => a.StatusCode == StatusCodes.Status201Created);
        Assert.NotNull(attr);
    }

    [Fact]
    public void Create_Action_HasProducesResponseType_400()
    {
        var method = typeof(EventsController).GetMethod(nameof(EventsController.Create));
        var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
            .FirstOrDefault(a => a.StatusCode == StatusCodes.Status400BadRequest);
        Assert.NotNull(attr);
    }

    [Fact]
    public void Create_Action_HasProducesResponseType_500()
    {
        var method = typeof(EventsController).GetMethod(nameof(EventsController.Create));
        var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
            .FirstOrDefault(a => a.StatusCode == StatusCodes.Status500InternalServerError);
        Assert.NotNull(attr);
    }

    [Fact]
    public void GetAll_Action_HasProducesResponseType_200()
    {
        var method = typeof(EventsController).GetMethod(nameof(EventsController.GetAll));
        var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
            .FirstOrDefault(a => a.StatusCode == StatusCodes.Status200OK);
        Assert.NotNull(attr);
    }

    [Fact]
    public void GetAll_Action_HasProducesResponseType_500()
    {
        var method = typeof(EventsController).GetMethod(nameof(EventsController.GetAll));
        var attr = method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
            .FirstOrDefault(a => a.StatusCode == StatusCodes.Status500InternalServerError);
        Assert.NotNull(attr);
    }
}
