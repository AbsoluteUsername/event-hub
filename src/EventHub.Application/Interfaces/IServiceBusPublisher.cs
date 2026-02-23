using EventHub.Application.Messages;

namespace EventHub.Application.Interfaces;

public interface IServiceBusPublisher
{
    Task PublishAsync(EventMessage message);
}
