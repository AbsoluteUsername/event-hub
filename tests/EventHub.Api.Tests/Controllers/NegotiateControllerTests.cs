using EventHub.Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EventHub.Api.Tests.Controllers;

public class NegotiateControllerTests
{
    private readonly NegotiateController _controller;

    public NegotiateControllerTests()
    {
        _controller = new NegotiateController();
    }

    [Fact]
    public async Task Negotiate_Returns501NotImplemented()
    {
        var result = await _controller.Negotiate();

        var statusCodeResult = Assert.IsType<StatusCodeResult>(result);
        Assert.Equal(StatusCodes.Status501NotImplemented, statusCodeResult.StatusCode);
    }
}
