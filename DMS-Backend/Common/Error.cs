namespace DMS_Backend.Common;

/// <summary>
/// Represents an error with code, message, and optional details
/// </summary>
public sealed record Error
{
    public string Code { get; init; }
    public string Message { get; init; }
    public Dictionary<string, string[]>? Details { get; init; }

    public Error(string code, string message, Dictionary<string, string[]>? details = null)
    {
        Code = code;
        Message = message;
        Details = details;
    }

    public static Error None => new(string.Empty, string.Empty);
    public static Error NullValue => new("Error.NullValue", "Specified value is null");
    
    // Common error types
    public static Error NotFound(string entity, string identifier) =>
        new("Error.NotFound", $"{entity} with identifier '{identifier}' was not found");

    public static Error Validation(string message, Dictionary<string, string[]>? details = null) =>
        new("Error.Validation", message, details);

    public static Error Unauthorized(string message = "Unauthorized access") =>
        new("Error.Unauthorized", message);

    public static Error Forbidden(string message = "Access forbidden") =>
        new("Error.Forbidden", message);

    public static Error Conflict(string message) =>
        new("Error.Conflict", message);

    public static Error Internal(string message = "An internal error occurred") =>
        new("Error.Internal", message);
}
