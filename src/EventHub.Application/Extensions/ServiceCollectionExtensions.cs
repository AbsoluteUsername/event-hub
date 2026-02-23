using Microsoft.Extensions.DependencyInjection;

namespace EventHub.Application.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Application-layer service registrations will be added here
        // as application services (e.g., MediatR handlers, validators) are implemented.
        return services;
    }
}
