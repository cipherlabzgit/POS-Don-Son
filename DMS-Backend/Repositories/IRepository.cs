using System.Linq.Expressions;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Repositories;

/// <summary>
/// Generic repository interface for CRUD operations
/// </summary>
public interface IRepository<T> where T : BaseEntity
{
    // Query operations
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
    Task<int> CountAsync(CancellationToken cancellationToken = default);
    Task<int> CountAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

    // Write operations
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task<List<T>> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<T> UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task<List<T>> UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    
    // Hard delete (use with caution)
    Task HardDeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task HardDeleteAsync(T entity, CancellationToken cancellationToken = default);

    // Include inactive records
    IQueryable<T> QueryIncludingInactive();
}
