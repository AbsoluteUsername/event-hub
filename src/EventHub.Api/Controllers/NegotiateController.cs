using Microsoft.AspNetCore.Mvc;

namespace EventHub.Api.Controllers;

[ApiController]
[Route("api/negotiate")]
public class NegotiateController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Negotiate()
    {
        await Task.CompletedTask;
        return StatusCode(StatusCodes.Status501NotImplemented);
    }
}
