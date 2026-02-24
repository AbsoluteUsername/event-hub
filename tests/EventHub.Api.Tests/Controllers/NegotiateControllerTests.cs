using EventHub.Api.Controllers;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.SignalR.Management;
using Moq;

namespace EventHub.Api.Tests.Controllers;

public class NegotiateControllerTests
{
    private readonly Mock<ServiceManager> _serviceManagerMock;
    private readonly NegotiateController _controller;

    public NegotiateControllerTests()
    {
        _serviceManagerMock = new Mock<ServiceManager>();
        _controller = new NegotiateController(_serviceManagerMock.Object);
    }

    [Fact]
    public async Task Negotiate_ReturnsOkWithConnectionInfo()
    {
        // Arrange
        var mockHubContext = new Mock<ServiceHubContext>();
        var negotiationResponse = new NegotiationResponse
        {
            Url = "https://test.service.signalr.net/client/?hub=eventhub",
            AccessToken = "test-access-token"
        };

        mockHubContext
            .Setup(h => h.NegotiateAsync(It.IsAny<NegotiationOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(negotiationResponse);

        _serviceManagerMock
            .Setup(m => m.CreateHubContextAsync("eventHub", It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockHubContext.Object);

        // Act
        var result = await _controller.Negotiate(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, okResult.StatusCode);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Negotiate_ResponseContainsUrlAndAccessToken()
    {
        // Arrange
        var mockHubContext = new Mock<ServiceHubContext>();
        var negotiationResponse = new NegotiationResponse
        {
            Url = "https://test.service.signalr.net/client/?hub=eventhub",
            AccessToken = "jwt-token-here"
        };

        mockHubContext
            .Setup(h => h.NegotiateAsync(It.IsAny<NegotiationOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(negotiationResponse);

        _serviceManagerMock
            .Setup(m => m.CreateHubContextAsync("eventHub", It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockHubContext.Object);

        // Act
        var result = await _controller.Negotiate(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<NegotiationResponse>(okResult.Value);
        Assert.Equal("https://test.service.signalr.net/client/?hub=eventhub", response.Url);
        Assert.Equal("jwt-token-here", response.AccessToken);
    }

    [Fact]
    public async Task Negotiate_WorksWithoutUserId()
    {
        // Arrange — anonymous connections for MVP
        var mockHubContext = new Mock<ServiceHubContext>();
        var negotiationResponse = new NegotiationResponse
        {
            Url = "https://test.service.signalr.net/client/?hub=eventhub",
            AccessToken = "anonymous-token"
        };

        mockHubContext
            .Setup(h => h.NegotiateAsync(It.IsAny<NegotiationOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(negotiationResponse);

        _serviceManagerMock
            .Setup(m => m.CreateHubContextAsync("eventHub", It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockHubContext.Object);

        // Act
        var result = await _controller.Negotiate(CancellationToken.None);

        // Assert — negotiate succeeds without userId
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        // Verify NegotiateAsync was called with default NegotiationOptions (no UserId set)
        mockHubContext.Verify(h => h.NegotiateAsync(
            It.Is<NegotiationOptions>(o => o.UserId == null),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
