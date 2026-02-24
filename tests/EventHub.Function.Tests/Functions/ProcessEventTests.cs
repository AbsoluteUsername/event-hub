using System.Text.Json;
using EventHub.Application.Messages;
using EventHub.Domain.Entities;
using EventHub.Domain.Enums;
using EventHub.Function.Functions;
using EventHub.Function.Services;
using Microsoft.Azure.Functions.Worker.Extensions.SignalRService;
using Microsoft.Extensions.Logging;
using Moq;

namespace EventHub.Function.Tests.Functions;

public class ProcessEventTests
{
    private readonly Mock<EventProcessingService> _processingServiceMock;
    private readonly Mock<ILogger<ProcessEvent>> _loggerMock;
    private readonly ProcessEvent _sut;

    private static readonly JsonSerializerOptions SerializeOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public ProcessEventTests()
    {
        _processingServiceMock = new Mock<EventProcessingService>(
            MockBehavior.Loose,
            Mock.Of<Application.Interfaces.IEventRepository>(),
            Mock.Of<ILogger<EventProcessingService>>());

        _loggerMock = new Mock<ILogger<ProcessEvent>>();
        _sut = new ProcessEvent(_processingServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Run_ValidMessageBody_DeserializesAndCallsProcessingService()
    {
        // Arrange
        var eventMessage = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-123",
            Type = EventType.Click,
            Description = "Test click",
            CreatedAt = DateTime.UtcNow
        };

        var messageBody = JsonSerializer.Serialize(eventMessage, SerializeOptions);

        _processingServiceMock
            .Setup(s => s.ProcessAsync(It.IsAny<EventMessage>()))
            .ReturnsAsync((Event?)null);

        // Act
        await _sut.Run(messageBody);

        // Assert
        _processingServiceMock.Verify(s => s.ProcessAsync(It.Is<EventMessage>(m =>
            m.Id == eventMessage.Id &&
            m.UserId == eventMessage.UserId &&
            m.Type == eventMessage.Type)), Times.Once);
    }

    [Fact]
    public async Task Run_EventPersisted_ReturnsSignalRMessageActionWithNewEventTarget()
    {
        // Arrange
        var persistedEvent = new Event
        {
            Id = Guid.NewGuid(),
            UserId = "user-456",
            Type = EventType.Purchase,
            Description = "Test purchase",
            CreatedAt = new DateTime(2026, 2, 24, 14, 30, 0, DateTimeKind.Utc)
        };

        var eventMessage = new EventMessage
        {
            Id = persistedEvent.Id,
            UserId = persistedEvent.UserId,
            Type = persistedEvent.Type,
            Description = persistedEvent.Description,
            CreatedAt = persistedEvent.CreatedAt
        };

        var messageBody = JsonSerializer.Serialize(eventMessage, SerializeOptions);

        _processingServiceMock
            .Setup(s => s.ProcessAsync(It.IsAny<EventMessage>()))
            .ReturnsAsync(persistedEvent);

        // Act
        var result = await _sut.Run(messageBody);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("newEvent", result.Target);
        Assert.NotNull(result.Arguments);
        Assert.Single(result.Arguments);
    }

    [Fact]
    public async Task Run_DuplicateEvent_ReturnsNull()
    {
        // Arrange
        var eventMessage = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-789",
            Type = EventType.PageView,
            Description = "Duplicate event",
            CreatedAt = DateTime.UtcNow
        };

        var messageBody = JsonSerializer.Serialize(eventMessage, SerializeOptions);

        _processingServiceMock
            .Setup(s => s.ProcessAsync(It.IsAny<EventMessage>()))
            .ReturnsAsync((Event?)null);

        // Act
        var result = await _sut.Run(messageBody);

        // Assert — no SignalR message on duplicate
        Assert.Null(result);
    }

    [Fact]
    public async Task Run_EventPersisted_SignalRPayloadContainsAllExpectedFields()
    {
        // Arrange
        var persistedEvent = new Event
        {
            Id = Guid.NewGuid(),
            UserId = "olena",
            Type = EventType.PageView,
            Description = "Viewed homepage",
            CreatedAt = new DateTime(2026, 2, 24, 14, 30, 0, DateTimeKind.Utc)
        };

        var eventMessage = new EventMessage
        {
            Id = persistedEvent.Id,
            UserId = persistedEvent.UserId,
            Type = persistedEvent.Type,
            Description = persistedEvent.Description,
            CreatedAt = persistedEvent.CreatedAt
        };

        var messageBody = JsonSerializer.Serialize(eventMessage, SerializeOptions);

        _processingServiceMock
            .Setup(s => s.ProcessAsync(It.IsAny<EventMessage>()))
            .ReturnsAsync(persistedEvent);

        // Act
        var result = await _sut.Run(messageBody);

        // Assert — verify payload structure by serializing to JSON and checking fields
        Assert.NotNull(result);
        var payload = result.Arguments[0];
        var json = JsonSerializer.Serialize(payload);
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal(persistedEvent.Id.ToString(), root.GetProperty("id").GetString());
        Assert.Equal("olena", root.GetProperty("userId").GetString());
        Assert.Equal("PageView", root.GetProperty("type").GetString());
        Assert.Equal("Viewed homepage", root.GetProperty("description").GetString());
        Assert.Equal(persistedEvent.CreatedAt, root.GetProperty("createdAt").GetDateTime());
    }

    [Fact]
    public async Task Run_CamelCaseMessage_DeserializesCorrectly()
    {
        // Arrange — simulate what the API publishes (camelCase)
        var id = Guid.NewGuid();
        var messageBody = $@"{{
            ""id"": ""{id}"",
            ""userId"": ""user-789"",
            ""type"": ""PageView"",
            ""description"": ""Page view event"",
            ""createdAt"": ""2026-02-23T10:00:00Z""
        }}";

        _processingServiceMock
            .Setup(s => s.ProcessAsync(It.IsAny<EventMessage>()))
            .ReturnsAsync((Event?)null);

        // Act
        await _sut.Run(messageBody);

        // Assert
        _processingServiceMock.Verify(s => s.ProcessAsync(It.Is<EventMessage>(m =>
            m.Id == id &&
            m.UserId == "user-789" &&
            m.Type == EventType.PageView &&
            m.Description == "Page view event")), Times.Once);
    }

    [Fact]
    public async Task Run_MalformedJson_ThrowsJsonException()
    {
        // Arrange — malformed JSON should propagate exception (triggers dead-letter)
        var malformedJson = "{ this is not valid json }";

        // Act & Assert — exception propagates to Service Bus runtime for retry/dead-letter
        await Assert.ThrowsAsync<JsonException>(() => _sut.Run(malformedJson));
    }

    [Fact]
    public async Task Run_NullDeserialization_ThrowsInvalidOperationException()
    {
        // Arrange — "null" JSON literal deserializes to null
        var messageBody = "null";

        // Act & Assert — explicit null check throws InvalidOperationException
        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.Run(messageBody));
    }
}
