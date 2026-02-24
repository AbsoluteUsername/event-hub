using EventHub.Application.Interfaces;
using EventHub.Application.Messages;
using EventHub.Domain.Entities;
using EventHub.Domain.Enums;
using EventHub.Function.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace EventHub.Function.Tests.Services;

public class EventProcessingServiceTests
{
    private readonly Mock<IEventRepository> _repositoryMock;
    private readonly Mock<ILogger<EventProcessingService>> _loggerMock;
    private readonly EventProcessingService _sut;

    public EventProcessingServiceTests()
    {
        _repositoryMock = new Mock<IEventRepository>();
        _loggerMock = new Mock<ILogger<EventProcessingService>>();
        _sut = new EventProcessingService(_repositoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task ProcessAsync_ValidMessage_CallsRepositoryCreateAsync()
    {
        // Arrange
        var message = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-123",
            Type = EventType.Click,
            Description = "Test event",
            CreatedAt = DateTime.UtcNow
        };

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Event>()))
            .ReturnsAsync((Event e) => e);

        // Act
        var result = await _sut.ProcessAsync(message);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(message.Id, result.Id);
        _repositoryMock.Verify(r => r.CreateAsync(It.Is<Event>(e =>
            e.Id == message.Id &&
            e.UserId == message.UserId &&
            e.Type == message.Type &&
            e.Description == message.Description &&
            e.CreatedAt == message.CreatedAt)), Times.Once);
    }

    [Fact]
    public async Task ProcessAsync_ValidMessage_MapsAllPropertiesCorrectly()
    {
        // Arrange
        var message = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-456",
            Type = EventType.Purchase,
            Description = "Purchase event",
            CreatedAt = new DateTime(2026, 2, 23, 10, 0, 0, DateTimeKind.Utc)
        };

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Event>()))
            .ReturnsAsync((Event e) => e);

        // Act
        var result = await _sut.ProcessAsync(message);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(message.Id, result.Id);
        Assert.Equal(message.UserId, result.UserId);
        Assert.Equal(message.Type, result.Type);
        Assert.Equal(message.Description, result.Description);
        Assert.Equal(message.CreatedAt, result.CreatedAt);
    }

    [Fact]
    public async Task ProcessAsync_DuplicateEvent_LogsWarningAndDoesNotRethrow()
    {
        // Arrange
        var message = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-789",
            Type = EventType.PageView,
            Description = "Duplicate event",
            CreatedAt = DateTime.UtcNow
        };

        var innerException = CreateSqlException(2627); // UNIQUE KEY violation
        var dbUpdateException = new DbUpdateException("Duplicate key", innerException);

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Event>()))
            .ThrowsAsync(dbUpdateException);

        // Act
        var result = await _sut.ProcessAsync(message);

        // Assert — returns null on duplicate
        Assert.Null(result);

        // Verify warning was logged
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Duplicate event")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessAsync_UniqueIndexViolation_LogsWarningAndDoesNotRethrow()
    {
        // Arrange
        var message = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-101",
            Type = EventType.Click,
            Description = "Index violation event",
            CreatedAt = DateTime.UtcNow
        };

        var innerException = CreateSqlException(2601); // UNIQUE INDEX violation
        var dbUpdateException = new DbUpdateException("Duplicate index", innerException);

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Event>()))
            .ThrowsAsync(dbUpdateException);

        // Act
        var result = await _sut.ProcessAsync(message);

        // Assert — returns null on unique index violation
        Assert.Null(result);
    }

    [Fact]
    public async Task ProcessAsync_NonDuplicateDbUpdateException_Rethrows()
    {
        // Arrange
        var message = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-202",
            Type = EventType.Purchase,
            Description = "Failed event",
            CreatedAt = DateTime.UtcNow
        };

        var dbUpdateException = new DbUpdateException("Some other DB error", new Exception("generic error"));

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Event>()))
            .ThrowsAsync(dbUpdateException);

        // Act & Assert — should rethrow
        await Assert.ThrowsAsync<DbUpdateException>(() => _sut.ProcessAsync(message));
    }

    [Fact]
    public async Task ProcessAsync_SuccessfulProcessing_LogsInformation()
    {
        // Arrange
        var message = new EventMessage
        {
            Id = Guid.NewGuid(),
            UserId = "user-303",
            Type = EventType.PageView,
            Description = "Success event",
            CreatedAt = DateTime.UtcNow
        };

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Event>()))
            .ReturnsAsync((Event e) => e);

        // Act
        var result = await _sut.ProcessAsync(message);

        // Assert — returns persisted entity and logs
        Assert.NotNull(result);
        Assert.Equal(message.Id, result.Id);
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("processed successfully")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessAsync_NullMessage_ThrowsNullReferenceException()
    {
        // Arrange & Act & Assert — null message causes NullReferenceException on property access
        await Assert.ThrowsAsync<NullReferenceException>(() => _sut.ProcessAsync(null!));
    }

    /// <summary>
    /// Creates a mock SqlException with the specified error number.
    /// SqlException has no public constructor, so we use reflection.
    /// </summary>
    private static Exception CreateSqlException(int errorNumber)
    {
        // SqlException cannot be directly instantiated; use a wrapper that
        // simulates the behavior our code checks for.
        // Our service checks for "duplicate key" in the message as a cross-database approach.
        var message = errorNumber switch
        {
            2627 => "Violation of UNIQUE KEY constraint. Cannot insert duplicate key.",
            2601 => "Cannot insert duplicate key row in object with unique index.",
            _ => "Unknown SQL error"
        };

        return new Exception(message);
    }
}
