# Cache Quick Reference Card

## Inject the Service

```csharp
public class YourService
{
    private readonly ICacheService _cache;
    
    public YourService(ICacheService cache)
    {
        _cache = cache;
    }
}
```

## 1. GetOrCreate (Recommended Pattern)

```csharp
// Auto-fetch from DB if not cached
var products = await _cache.GetOrCreateAsync(
    key: "products_all",
    factory: async () => await _context.Products.ToListAsync(),
    absoluteExpiration: TimeSpan.FromHours(1)
);
```

## 2. Manual Set & Get

```csharp
// Set
_cache.Set("key", value, TimeSpan.FromMinutes(30));

// Get
var value = _cache.Get<Product>("key");
```

## 3. Remove Cache

```csharp
// Single key
_cache.Remove("product:123");

// By prefix (all related)
_cache.RemoveByPrefix("products_");

// Everything
_cache.Clear();
```

## 4. Common Patterns

### List All (Master Data)
```csharp
return await _cache.GetOrCreateAsync(
    "categories_all",
    async () => await _context.Categories.ToListAsync(),
    TimeSpan.FromHours(2)
);
```

### Single Entity
```csharp
return await _cache.GetOrCreateAsync(
    $"product:{id}",
    async () => await _context.Products.FindAsync(id),
    TimeSpan.FromHours(1)
);
```

### Expensive Calculation
```csharp
return await _cache.GetOrCreateAsync(
    $"recipe_calc:{productId}:{qty}",
    async () => await PerformExpensiveCalculation(),
    TimeSpan.FromMinutes(30)
);
```

### Dashboard/Report
```csharp
return await _cache.GetOrCreateAsync(
    $"dashboard:{date:yyyy-MM-dd}",
    async () => await GenerateDashboardData(),
    TimeSpan.FromMinutes(5) // Short cache
);
```

## 5. Invalidation on Update

```csharp
public async Task UpdateProductAsync(Product product)
{
    // 1. Update database
    _context.Update(product);
    await _context.SaveChangesAsync();
    
    // 2. Invalidate cache
    _cache.Remove($"product:{product.Id}");
    _cache.RemoveByPrefix("products_"); // All product lists
}
```

## 6. Recommended Cache Times

```csharp
// Rarely changes
Categories:     TimeSpan.FromHours(4)
UOM:            TimeSpan.FromHours(6)
Outlets:        TimeSpan.FromHours(2)
Recipes:        TimeSpan.FromHours(4)

// Changes daily
Products:       TimeSpan.FromHours(1)
Daily Data:     TimeSpan.FromMinutes(15)

// Real-time
Dashboard:      TimeSpan.FromMinutes(5)
Current Stock:  TimeSpan.FromMinutes(2)
```

## 7. Cache Key Naming

```csharp
// Pattern: entity:identifier
"product:123"
"category:45"
"outlet:7"

// Pattern: entity_scope
"products_all"
"products_active"
"categories_all"

// Pattern: calculation:params
"recipe_calc:10:500"
"stock_summary:2026-04-23"
```

## 8. Check if Exists

```csharp
if (_cache.Exists("products_all"))
{
    // Cache hit
}
```

## 9. Sliding vs Absolute Expiration

```csharp
// Absolute: expires after X time (regardless of access)
_cache.Set(key, value, 
    absoluteExpiration: TimeSpan.FromHours(1));

// Sliding: resets timer on each access
_cache.Set(key, value, 
    slidingExpiration: TimeSpan.FromMinutes(15));
```

## 10. Controller Example

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ICacheService _cache;
    private readonly ApplicationDbContext _context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await _cache.GetOrCreateAsync(
            "products_all",
            async () => await _context.Products.ToListAsync(),
            TimeSpan.FromHours(1)
        );
        
        return Ok(products);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Product product)
    {
        _context.Update(product);
        await _context.SaveChangesAsync();
        
        _cache.Remove($"product:{id}");
        _cache.RemoveByPrefix("products_");
        
        return Ok(product);
    }
}
```

## Tips

✅ **DO**: Cache master data (categories, products, outlets)
✅ **DO**: Cache expensive calculations
✅ **DO**: Use descriptive cache keys
✅ **DO**: Invalidate cache on updates

❌ **DON'T**: Cache user-specific transactional data
❌ **DON'T**: Cache data that changes every request
❌ **DON'T**: Forget to invalidate on updates
❌ **DON'T**: Cache authentication tokens (separate service)

---

**Full Documentation**: See `CACHING_GUIDE.md`
