using EventHub.Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EventHub.Api.Tests.Controllers;

public class EventsControllerTests
{
    private readonly EventsController _controller;

    public EventsControllerTests()
    {
        _controller = new EventsController();
    }

    [Fact]
    public async Task Create_Returns501NotImplemented()
    {
        var result = await _controller.Create();

        var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
        Assert.Equal(StatusCodes.Status501NotImplemented, statusCodeResult.StatusCode);
    }

    [Fact]
    public async Task GetAll_Returns501NotImplemented()
    {
        var result = await _controller.GetAll();

        var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
        Assert.Equal(StatusCodes.Status501NotImplemented, statusCodeResult.StatusCode);
    }
}
