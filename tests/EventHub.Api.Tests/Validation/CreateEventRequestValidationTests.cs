using System.ComponentModel.DataAnnotations;
using EventHub.Application.DTOs;
using EventHub.Domain.Enums;

namespace EventHub.Api.Tests.Validation;

public class CreateEventRequestValidationTests
{
    private static (bool isValid, List<ValidationResult> results) Validate(CreateEventRequest request)
    {
        var context = new ValidationContext(request);
        var results = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(request, context, results, validateAllProperties: true);
        return (isValid, results);
    }

    [Fact]
    public void EmptyUserId_ReturnsValidationError()
    {
        var request = new CreateEventRequest
        {
            UserId = "",
            Type = EventType.Click,
            Description = "Valid description"
        };

        var (isValid, results) = Validate(request);

        Assert.False(isValid);
        Assert.Contains(results, r => r.MemberNames.Contains("UserId"));
    }

    [Fact]
    public void UserId_Exceeding100Chars_ReturnsValidationError()
    {
        var request = new CreateEventRequest
        {
            UserId = new string('a', 101),
            Type = EventType.Click,
            Description = "Valid description"
        };

        var (isValid, results) = Validate(request);

        Assert.False(isValid);
        Assert.Contains(results, r => r.MemberNames.Contains("UserId"));
    }

    [Fact]
    public void MissingDescription_ReturnsValidationError()
    {
        var request = new CreateEventRequest
        {
            UserId = "user-123",
            Type = EventType.PageView,
            Description = ""
        };

        var (isValid, results) = Validate(request);

        Assert.False(isValid);
        Assert.Contains(results, r => r.MemberNames.Contains("Description"));
    }

    [Fact]
    public void Description_Exceeding500Chars_ReturnsValidationError()
    {
        var request = new CreateEventRequest
        {
            UserId = "user-123",
            Type = EventType.PageView,
            Description = new string('d', 501)
        };

        var (isValid, results) = Validate(request);

        Assert.False(isValid);
        Assert.Contains(results, r => r.MemberNames.Contains("Description"));
    }

    [Fact]
    public void InvalidEventTypeValue_ReturnsValidationError()
    {
        var request = new CreateEventRequest
        {
            UserId = "user-123",
            Type = (EventType)999,
            Description = "Valid description"
        };

        var (isValid, results) = Validate(request);

        Assert.False(isValid);
        Assert.Contains(results, r => r.MemberNames.Contains("Type"));
    }

    [Fact]
    public void AllFieldsValid_NoValidationErrors()
    {
        var request = new CreateEventRequest
        {
            UserId = "user-123",
            Type = EventType.Purchase,
            Description = "Valid description"
        };

        var (isValid, results) = Validate(request);

        Assert.True(isValid);
        Assert.Empty(results);
    }
}
