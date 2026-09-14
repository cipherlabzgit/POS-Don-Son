namespace DMS_Backend.Services.Interfaces;

public interface IProductPriceResolver
{
    /// <summary>
    /// Approved Price Manager history as of a Sri Lanka calendar date.
    /// Products with no applicable approved change are omitted (caller keeps master UnitPrice).
    /// </summary>
    Task<Dictionary<Guid, decimal>> ResolveAsync(
        IEnumerable<Guid> productIds,
        DateOnly asOf,
        CancellationToken cancellationToken = default);
}
