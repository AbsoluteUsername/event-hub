using System.Text.Json;
using System.Text.Json.Serialization;
using EventHub.Application.Messages;
using EventHub.Function.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Extensions.SignalRService;
using Microsoft.Extensions.Logging;

namespace EventHub.Function.Functions;

public class ProcessEvent
{
    private readonly EventProcessingService _processingService;
    private readonly ILogger<ProcessEvent> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public ProcessEvent(EventProcessingService processingService, ILogger<ProcessEvent> logger)
    {
        _processingService = processingService;
        _logger = logger;
    }

    [Function("ProcessEvent")]
    [SignalROutput(HubName = "eventHub", ConnectionStringSetting = "AzureSignalRConnectionString")]
    public async Task<SignalRMessageAction?> Run(
        [ServiceBusTrigger("events", Connection = "ServiceBus")] string messageBody)
    {
        _logger.LogInformation("Processing event message: {MessageBody}", messageBody);

        var eventMessage = JsonSerializer.Deserialize<EventMessage>(messageBody, JsonOptions)
            ?? throw new InvalidOperationException("Failed to deserialize event message: deserialization returned null");

        var persistedEvent = await _processingService.ProcessAsync(eventMessage);

        if (persistedEvent is null)
        {
            _logger.LogInformation("Duplicate event ignored, no broadcast");
            return null;
        }

        _logger.LogInformation("Broadcasting newEvent for {EventId}", persistedEvent.Id);

        return new SignalRMessageAction("newEvent")
        {
            Arguments = new object[]
            {
                new
                {
                    id = persistedEvent.Id,
                    userId = persistedEvent.UserId,
                    type = persistedEvent.Type.ToString(),
                    description = persistedEvent.Description,
                    createdAt = persistedEvent.CreatedAt
                }
            }
        };
    }
}
