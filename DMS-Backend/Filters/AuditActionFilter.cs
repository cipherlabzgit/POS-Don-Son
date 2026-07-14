using System.Security.Claims;
using DMS_Backend.Common;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc.Filters;

namespace DMS_Backend.Filters;

/// <summary>
/// Action filter that executes audit logging for actions marked with [Audit] attribute
/// </summary>
public sealed class AuditActionFilter : IAsyncActionFilter
{
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuditActionFilter> _logger;

    public AuditActionFilter(IAuditLogService auditLogService, ILogger<AuditActionFilter> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var auditAttribute = context.ActionDescriptor.EndpointMetadata
            .OfType<AuditAttribute>()
            .FirstOrDefault();

        var executedContext = await next();

        if (auditAttribute != null && executedContext.Exception == null)
        {
            try
            {
                var userId = GetUserId(context.HttpContext.User);
                var email = context.HttpContext.User.FindFirst(ClaimTypes.Email)?.Value;
                var ipAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = context.HttpContext.Request.Headers["User-Agent"].FirstOrDefault();
                var requestPath = context.HttpContext.Request.Path;
                var requestMethod = context.HttpContext.Request.Method;

                await _auditLogService.LogChangeAsync(
                    userId,
                    email,
                    "Action",
                    auditAttribute.EntityType,
                    null,
                    auditAttribute.Action ?? requestMethod,
                    context.ActionArguments,
                    executedContext.Result,
                    ipAddress,
                    userAgent,
                    requestPath,
                    requestMethod,
                    context.HttpContext.Response.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute audit logging");
            }
        }
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
