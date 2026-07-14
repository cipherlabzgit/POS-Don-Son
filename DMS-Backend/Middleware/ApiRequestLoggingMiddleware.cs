using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Middleware;

/// <summary>
/// Middleware that logs all API requests to the api_request_logs table
/// </summary>
public sealed class ApiRequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiRequestLoggingMiddleware> _logger;

    public ApiRequestLoggingMiddleware(RequestDelegate next, ILogger<ApiRequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        // Skip DB-backed request logging for health probes (high frequency, no value)
        if (context.Request.Path.StartsWithSegments("/health"))
        {
            await _next(context);
            return;
        }

        var requestId = context.TraceIdentifier;
        var stopwatch = Stopwatch.StartNew();
        
        // Capture request body if present
        string? requestBody = null;
        if (context.Request.ContentLength > 0 && context.Request.ContentType?.Contains("application/json") == true)
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(
                context.Request.Body,
                Encoding.UTF8,
                leaveOpen: true);
            requestBody = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
        }

        // Capture original response body stream so we can both peek at the response
        // (for logging) AND let later/outer middleware (e.g. ExceptionMiddleware) keep
        // writing to a live stream after we exit. If we don't restore Response.Body,
        // ExceptionMiddleware writes to the disposed MemoryStream and the request
        // dies with "Cannot access a closed Stream" — which the browser then sees
        // as a missing-CORS-header error.
        var originalBodyStream = context.Response.Body;
        var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        Exception? exception = null;
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            exception = ex;
            // Hand control back to ExceptionMiddleware with a usable Response.Body.
            context.Response.Body = originalBodyStream;
            await responseBody.DisposeAsync();
            throw;
        }
        finally
        {
            stopwatch.Stop();

            // Extract user info from claims
            Guid? userId = null;
            string? email = null;
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdClaim, out var parsedUserId))
                    userId = parsedUserId;
                
                email = context.User.FindFirst(ClaimTypes.Email)?.Value;
            }

            // Create log entry
            var apiRequestLog = new ApiRequestLog
            {
                UserId = userId,
                Email = email,
                RequestId = requestId,
                Endpoint = $"{context.Request.Path}{context.Request.QueryString}",
                HttpMethod = context.Request.Method,
                QueryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null,
                RequestBody = !string.IsNullOrEmpty(requestBody) ? JsonDocument.Parse(requestBody) : null,
                ResponseStatusCode = context.Response.StatusCode,
                ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.Request.Headers["User-Agent"].FirstOrDefault(),
                IsSuccessful = context.Response.StatusCode < 400 && exception == null,
                ErrorMessage = exception?.Message,
                Timestamp = DateTime.UtcNow
            };

            try
            {
                // Only log if not already disposed (e.g., during shutdown)
                if (dbContext.Database.CanConnect())
                {
                    dbContext.ApiRequestLogs.Add(apiRequestLog);
                    await dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log API request to database");
            }

            // If an exception bubbled, we already restored Response.Body and disposed
            // the buffer above so ExceptionMiddleware can write to the live stream.
            if (exception is null)
            {
                responseBody.Seek(0, SeekOrigin.Begin);
                await responseBody.CopyToAsync(originalBodyStream);
                context.Response.Body = originalBodyStream;
                await responseBody.DisposeAsync();
            }
        }
    }
}
