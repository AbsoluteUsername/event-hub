using System.Text.Json;
using System.Text.Json.Serialization;
using EventHub.Application.Messages;
using EventHub.Function.Services;
using Microsoft.Azure.Functions.Worker;
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
    public async Task Run(
        [ServiceBusTrigger("events", Connection = "ServiceBus")] string messageBody)
    {
        _logger.LogInformation("Processing event message: {MessageBody}", messageBody);

        var eventMessage = JsonSerializer.Deserialize<EventMessage>(messageBody, JsonOptions);

        await _processingService.ProcessAsync(eventMessage!);

        _logger.LogInformation("Event message processed successfully");
    }
}
