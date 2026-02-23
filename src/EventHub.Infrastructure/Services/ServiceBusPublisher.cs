using System.Text.Json;
using Azure.Messaging.ServiceBus;
using EventHub.Application.Interfaces;
using EventHub.Application.Messages;

namespace EventHub.Infrastructure.Services;

public class ServiceBusPublisher : IServiceBusPublisher, IAsyncDisposable
{
    private readonly ServiceBusSender _sender;

    public ServiceBusPublisher(ServiceBusClient client)
    {
        _sender = client.CreateSender("events");
    }

    public async Task PublishAsync(EventMessage message)
    {
        var json = JsonSerializer.Serialize(message);
        var sbMessage = new ServiceBusMessage(json)
        {
            MessageId = message.Id.ToString(),
            ContentType = "application/json"
        };
        await _sender.SendMessageAsync(sbMessage);
    }

    public async ValueTask DisposeAsync()
    {
        await _sender.DisposeAsync();
    }
}
