using System.Text.Json;
using EventHub.Application.Messages;
using EventHub.Domain.Enums;
using EventHub.Function.Functions;
using EventHub.Function.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace EventHub.Function.Tests.Functions;

public class ProcessEventTests
{
    private readonly Mock<EventProcessingService> _processingServiceMock;
    private readonly Mock<ILogger<ProcessEvent>> _loggerMock;
    private readonly ProcessEvent _sut;

    public ProcessEventTests()
    {
        // EventProcessingService needs to be mockable - we'll use a mock with CallBase=false
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

        var messageBody = JsonSerializer.Serialize(eventMessage, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
        });

        _processingServiceMock
            .Setup(s => s.ProcessAsync(It.IsAny<EventMessage>()))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.Run(messageBody);

        // Assert
        _processingServiceMock.Verify(s => s.ProcessAsync(It.Is<EventMessage>(m =>
            m.Id == eventMessage.Id &&
            m.UserId == eventMessage.UserId &&
            m.Type == eventMessage.Type)), Times.Once);
    }

    [Fact]
    public async Task Run_ValidMessage_LogsReceivedAndSuccessful()
    {
        // Arrange
        var eventMessage = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-456",
            Type = EventType.Purchase,
            Description = "Test purchase",
            CreatedAt = DateTime.UtcNow
        };

        var messageBody = JsonSerializer.Serialize(eventMessage, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
        });

        _processingServiceMock
            .Setup(s => s.ProcessAsync(It.IsAny<EventMessage>()))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.Run(messageBody);

        // Assert — verify Information logs were made (at least 2: received + success)
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeast(2));
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
            .Returns(Task.CompletedTask);

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
