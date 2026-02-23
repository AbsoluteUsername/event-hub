using Azure.Messaging.ServiceBus;
using EventHub.Application.Interfaces;
using EventHub.Infrastructure.Data;
using EventHub.Infrastructure.Repositories;
using EventHub.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EventHub.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // EF Core DbContext with SQL Server
        services.AddDbContext<EventHubDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection")));

        // Azure Service Bus client (singleton — thread-safe, connection-pooled)
        services.AddSingleton(_ =>
            new ServiceBusClient(
                configuration.GetConnectionString("ServiceBus")));

        // Repository (scoped — tied to DbContext lifetime)
        services.AddScoped<IEventRepository, EventRepository>();

        // Service Bus publisher (scoped — creates sender per scope)
        services.AddScoped<IServiceBusPublisher, ServiceBusPublisher>();

        return services;
    }
}
