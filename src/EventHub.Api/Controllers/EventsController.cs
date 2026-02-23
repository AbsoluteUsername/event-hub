using Microsoft.AspNetCore.Mvc;

namespace EventHub.Api.Controllers;

[ApiController]
[Route("api/events")]
public class EventsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create()
    {
        await Task.CompletedTask;
        return StatusCode(StatusCodes.Status501NotImplemented);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await Task.CompletedTask;
        return StatusCode(StatusCodes.Status501NotImplemented);
    }
}
