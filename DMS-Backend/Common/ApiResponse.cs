namespace DMS_Backend.Common;

/// <summary>
/// Standard API response envelope
/// </summary>
public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public Error? Error { get; init; }
    public DateTime Timestamp { get; init; }

    private ApiResponse(bool success, T? data, Error? error)
    {
        Success = success;
        Data = data;
        Error = error;
        Timestamp = DateTime.UtcNow;
    }

    public static ApiResponse<T> SuccessResponse(T data) =>
        new(true, data, null);

    public static ApiResponse<T> FailureResponse(Error error) =>
        new(false, default, error);
}

/// <summary>
/// API response without data payload
/// </summary>
public sealed class ApiResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public Error? Error { get; init; }
    public DateTime Timestamp { get; init; }

    private ApiResponse(bool success, string? message, Error? error)
    {
        Success = success;
        Message = message;
        Error = error;
        Timestamp = DateTime.UtcNow;
    }

    public static ApiResponse SuccessResponse(string message = "Operation completed successfully") =>
        new(true, message, null);

    public static ApiResponse FailureResponse(Error error) =>
        new(false, null, error);
}
