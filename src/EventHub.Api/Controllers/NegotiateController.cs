using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.SignalR.Management;

namespace EventHub.Api.Controllers;

[ApiController]
[Route("api/negotiate")]
public class NegotiateController : ControllerBase
{
    private readonly ServiceManager _serviceManager;

    public NegotiateController(ServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }

    /// <summary>
    /// Returns Azure SignalR Service connection info for establishing a client WebSocket connection.
    /// </summary>
    /// <returns>SignalR negotiation response containing endpoint URL and access token.</returns>
    /// <response code="200">Negotiation successful — client can proceed to connect via WebSocket.</response>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Negotiate(CancellationToken cancellationToken)
    {
        var hubContext = await _serviceManager.CreateHubContextAsync("eventHub", cancellationToken);
        var negotiationResponse = await hubContext.NegotiateAsync(new NegotiationOptions(), cancellationToken);
        await hubContext.DisposeAsync();
        return Ok(negotiationResponse);
    }
}
