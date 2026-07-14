using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

/// <summary>
/// In-memory cache service using IMemoryCache.
/// Perfect for small to medium scale applications like Don & Sons DMS.
/// </summary>
public sealed class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;
    private readonly ConcurrentDictionary<string, byte> _cacheKeys = new();
    
    // Default cache expiration times
    private static readonly TimeSpan DefaultAbsoluteExpiration = TimeSpan.FromHours(1);
    private static readonly TimeSpan DefaultSlidingExpiration = TimeSpan.FromMinutes(15);

    public MemoryCacheService(
        IMemoryCache cache,
        ILogger<MemoryCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public T? Get<T>(string key)
    {
        try
        {
            return _cache.Get<T>(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache key: {Key}", key);
            return default;
        }
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Get<T>(key));
    }

    public void Set<T>(string key, T value, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null)
    {
        try
        {
            var options = new MemoryCacheEntryOptions();

            if (absoluteExpiration.HasValue)
            {
                options.SetAbsoluteExpiration(absoluteExpiration.Value);
            }
            else if (slidingExpiration.HasValue)
            {
                options.SetSlidingExpiration(slidingExpiration.Value);
            }
            else
            {
                // Default: 1 hour absolute expiration
                options.SetAbsoluteExpiration(DefaultAbsoluteExpiration);
            }

            // Track the key for prefix-based removal
            _cacheKeys.TryAdd(key, 0);
            
            // Remove key from tracking when evicted
            options.RegisterPostEvictionCallback((evictedKey, evictedValue, reason, state) =>
            {
                _cacheKeys.TryRemove(evictedKey.ToString()!, out _);
            });

            _cache.Set(key, value, options);
            
            _logger.LogDebug("Cache set: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache key: {Key}", key);
        }
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null, CancellationToken cancellationToken = default)
    {
        Set(key, value, absoluteExpiration, slidingExpiration);
        return Task.CompletedTask;
    }

    public async Task<T> GetOrCreateAsync<T>(
        string key, 
        Func<Task<T>> factory, 
        TimeSpan? absoluteExpiration = null, 
        TimeSpan? slidingExpiration = null, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Try to get from cache first
            if (_cache.TryGetValue(key, out T? cachedValue) && cachedValue != null)
            {
                _logger.LogDebug("Cache hit: {Key}", key);
                return cachedValue;
            }

            _logger.LogDebug("Cache miss: {Key}. Fetching from source.", key);

            // Not in cache, create it
            var value = await factory();

            if (value != null)
            {
                Set(key, value, absoluteExpiration, slidingExpiration);
            }

            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetOrCreateAsync for key: {Key}", key);
            throw;
        }
    }

    public void Remove(string key)
    {
        try
        {
            _cache.Remove(key);
            _cacheKeys.TryRemove(key, out _);
            _logger.LogDebug("Cache removed: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache key: {Key}", key);
        }
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        Remove(key);
        return Task.CompletedTask;
    }

    public bool Exists(string key)
    {
        return _cache.TryGetValue(key, out _);
    }

    public void RemoveByPrefix(string prefix)
    {
        try
        {
            var keysToRemove = _cacheKeys.Keys
                .Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var key in keysToRemove)
            {
                Remove(key);
            }

            _logger.LogInformation("Removed {Count} cache entries with prefix: {Prefix}", keysToRemove.Count, prefix);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache entries by prefix: {Prefix}", prefix);
        }
    }

    public void Clear()
    {
        try
        {
            var allKeys = _cacheKeys.Keys.ToList();
            
            foreach (var key in allKeys)
            {
                Remove(key);
            }

            _logger.LogInformation("Cleared all cache entries. Total: {Count}", allKeys.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cache");
        }
    }
}
