namespace DMS_Backend.Services.Interfaces;

/// <summary>
/// Cache service for storing frequently accessed data in memory.
/// Ideal for master data like products, categories, outlets, etc.
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Gets a cached value by key.
    /// </summary>
    T? Get<T>(string key);

    /// <summary>
    /// Gets a cached value by key asynchronously.
    /// </summary>
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sets a value in the cache with optional expiration.
    /// </summary>
    void Set<T>(string key, T value, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null);

    /// <summary>
    /// Sets a value in the cache asynchronously.
    /// </summary>
    Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets or creates a cached value using the provided factory function.
    /// </summary>
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a value from the cache.
    /// </summary>
    void Remove(string key);

    /// <summary>
    /// Removes a value from the cache asynchronously.
    /// </summary>
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a key exists in the cache.
    /// </summary>
    bool Exists(string key);

    /// <summary>
    /// Removes all cache entries matching the specified prefix.
    /// Example: RemoveByPrefix("products_") removes all product-related cache.
    /// </summary>
    void RemoveByPrefix(string prefix);

    /// <summary>
    /// Clears all cache entries.
    /// </summary>
    void Clear();
}
