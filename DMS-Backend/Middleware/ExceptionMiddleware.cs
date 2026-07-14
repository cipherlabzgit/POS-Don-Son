using System.Net;
using System.Text.Json;
using DMS_Backend.Common;
using DMS_Backend.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace DMS_Backend.Middleware;

/// <summary>
/// Global exception handling middleware that converts exceptions to ProblemDetails responses
/// </summary>
public sealed class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ISystemLogService systemLogService)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex, systemLogService);
        }
    }

    private async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception,
        ISystemLogService systemLogService)
    {
        _logger.LogError(exception, "An unhandled exception occurred");

        var (statusCode, problemDetails) = exception switch
        {
            ValidationException validationEx => CreateValidationProblem(validationEx),
            UnauthorizedAccessException => CreateProblem(
                HttpStatusCode.Unauthorized,
                "Unauthorized",
                "You are not authorized to perform this action"),
            KeyNotFoundException notFoundEx => CreateProblem(
                HttpStatusCode.NotFound,
                "Not Found",
                notFoundEx.Message),
            InvalidOperationException invalidOpEx => CreateProblem(
                HttpStatusCode.BadRequest,
                "Bad Request",
                invalidOpEx.Message),
            _ => CreateProblem(
                HttpStatusCode.InternalServerError,
                "Internal Server Error",
                "An unexpected error occurred")
        };

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/problem+json";

        // Log to system_logs for non-validation errors
        if (exception is not ValidationException)
        {
            try
            {
                await systemLogService.LogErrorAsync(
                    "API",
                    exception.Message,
                    exception);
            }
            catch
            {
                // Swallow logging errors to prevent infinite loop
            }
        }

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }

    private static (HttpStatusCode, ProblemDetails) CreateValidationProblem(ValidationException ex)
    {
        var errors = ex.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());

        var problemDetails = new ValidationProblemDetails(errors)
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title = "One or more validation errors occurred",
            Status = (int)HttpStatusCode.BadRequest
        };

        return (HttpStatusCode.BadRequest, problemDetails);
    }

    private static (HttpStatusCode, ProblemDetails) CreateProblem(
        HttpStatusCode statusCode,
        string title,
        string detail)
    {
        var problemDetails = new ProblemDetails
        {
            Type = $"https://tools.ietf.org/html/rfc7231#section-{GetRfcSection(statusCode)}",
            Title = title,
            Detail = detail,
            Status = (int)statusCode
        };

        return (statusCode, problemDetails);
    }

    private static string GetRfcSection(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.BadRequest => "6.5.1",
        HttpStatusCode.Unauthorized => "6.5.1",
        HttpStatusCode.Forbidden => "6.5.3",
        HttpStatusCode.NotFound => "6.5.4",
        HttpStatusCode.Conflict => "6.5.8",
        _ => "6.6.1"
    };
}
