using System.Reflection;
using EventHub.Api.Middleware;
using EventHub.Application.Extensions;
using EventHub.Infrastructure.Extensions;
using Microsoft.Azure.SignalR.Management;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.development.local.json", optional: true, reloadOnChange: true);

// Serilog
builder.Host.UseSerilog((context, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .WriteTo.Console());

// DI registrations
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Azure SignalR Management (serverless negotiate only — ADR-3)
builder.Services.AddSingleton(new ServiceManagerBuilder()
    .WithOptions(o => o.ConnectionString = builder.Configuration["AzureSignalRConnectionString"])
    .BuildServiceManager());

// Controllers with custom validation error response format (FR23)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.First().ErrorMessage);

            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new { errors });
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Event Hub API",
        Version = "v1",
        Description = "REST API for submitting and querying events. Supports server-side filtering, sorting, and pagination."
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);

    var appXmlFile = "EventHub.Application.xml";
    var appXmlPath = Path.Combine(AppContext.BaseDirectory, appXmlFile);
    if (File.Exists(appXmlPath))
    {
        c.IncludeXmlComments(appXmlPath);
    }
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:4200" };

        policy.WithOrigins(origins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Middleware pipeline order:
// 1. ExceptionHandling (catches all exceptions)
app.UseExceptionHandling();

// 2. Serilog request logging
app.UseSerilogRequestLogging();

// 3. Swagger (Development only)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 4. HTTPS redirection
app.UseHttpsRedirection();

// 5. CORS
app.UseCors("AllowFrontend");

// 6. Authorization
app.UseAuthorization();

// 7. Controllers
app.MapControllers();

app.Run();
