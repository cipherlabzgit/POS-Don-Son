using DMS_Backend.Common;
using DMS_Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace DMS_Backend.Filters;

/// <summary>
/// Action filter that enforces day-lock rules on operations
/// </summary>
public sealed class DayLockGuardFilter : IAsyncActionFilter
{
    private readonly IDayLockService _dayLockService;
    private readonly ILogger<DayLockGuardFilter> _logger;

    public DayLockGuardFilter(IDayLockService dayLockService, ILogger<DayLockGuardFilter> logger)
    {
        _dayLockService = dayLockService;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var dayLockAttribute = context.ActionDescriptor.EndpointMetadata
            .OfType<DayLockGuardAttribute>()
            .FirstOrDefault();

        if (dayLockAttribute == null)
        {
            await next();
            return;
        }

        DateTime? dateToCheck = null;

        // Try to extract date from action arguments
        if (!string.IsNullOrEmpty(dayLockAttribute.DateParameterName))
        {
            if (context.ActionArguments.TryGetValue(dayLockAttribute.DateParameterName, out var dateParam))
            {
                dateToCheck = dateParam as DateTime?;
            }
        }
        else
        {
            // Look for common date parameter names
            var commonDateParams = new[] { "date", "operationDate", "transactionDate", "Date", "OperationDate" };
            foreach (var paramName in commonDateParams)
            {
                if (context.ActionArguments.TryGetValue(paramName, out var dateParam))
                {
                    dateToCheck = dateParam as DateTime?;
                    break;
                }
            }

            // Also check in DTOs for date properties
            if (dateToCheck == null)
            {
                foreach (var arg in context.ActionArguments.Values)
                {
                    if (arg == null) continue;
                    
                    var dateProperty = arg.GetType().GetProperties()
                        .FirstOrDefault(p => p.PropertyType == typeof(DateTime) || p.PropertyType == typeof(DateTime?));
                    
                    if (dateProperty != null)
                    {
                        dateToCheck = dateProperty.GetValue(arg) as DateTime?;
                        break;
                    }
                }
            }
        }

        if (dateToCheck.HasValue)
        {
            var isLocked = await _dayLockService.IsDateLockedAsync(dateToCheck.Value);
            if (isLocked)
            {
                _logger.LogWarning("Day-lock guard prevented operation on locked date: {Date}", dateToCheck.Value);
                
                context.Result = new ObjectResult(new
                {
                    success = false,
                    error = new
                    {
                        code = "DayLocked",
                        message = $"Operations for date {dateToCheck.Value:yyyy-MM-dd} are locked. Contact an administrator.",
                        details = new Dictionary<string, string[]>
                        {
                            ["date"] = new[] { $"This date is locked and cannot be modified." }
                        }
                    }
                })
                {
                    StatusCode = 423 // Locked
                };
                
                return;
            }
        }

        await next();
    }
}
