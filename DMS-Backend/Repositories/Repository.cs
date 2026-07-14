using System.Linq.Expressions;
using DMS_Backend.Data;
using DMS_Backend.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Repositories;

/// <summary>
/// Generic repository implementation with soft delete support
/// </summary>
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly ApplicationDbContext Context;
    protected readonly DbSet<T> DbSet;

    public Repository(ApplicationDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public virtual async Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet.ToListAsync(cancellationToken);
    }

    public virtual async Task<List<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        return await DbSet.Where(predicate).ToListAsync(cancellationToken);
    }

    public virtual async Task<T?> FindOneAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        return await DbSet.FirstOrDefaultAsync(predicate, cancellationToken);
    }

    public virtual async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet.AnyAsync(e => e.Id == id, cancellationToken);
    }

    public virtual async Task<bool> ExistsAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        return await DbSet.AnyAsync(predicate, cancellationToken);
    }

    public virtual async Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet.CountAsync(cancellationToken);
    }

    public virtual async Task<int> CountAsync(
        Expression<Func<T, bool>> predicate,
        CancellationToken cancellationToken = default)
    {
        return await DbSet.CountAsync(predicate, cancellationToken);
    }

    public virtual async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.IsActive = true;

        await DbSet.AddAsync(entity, cancellationToken);
        await Context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public virtual async Task<List<T>> AddRangeAsync(
        IEnumerable<T> entities,
        CancellationToken cancellationToken = default)
    {
        var entityList = entities.ToList();
        var now = DateTime.UtcNow;

        foreach (var entity in entityList)
        {
            entity.Id = Guid.NewGuid();
            entity.CreatedAt = now;
            entity.UpdatedAt = now;
            entity.IsActive = true;
        }

        await DbSet.AddRangeAsync(entityList, cancellationToken);
        await Context.SaveChangesAsync(cancellationToken);
        return entityList;
    }

    public virtual async Task<T> UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        DbSet.Update(entity);
        await Context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public virtual async Task<List<T>> UpdateRangeAsync(
        IEnumerable<T> entities,
        CancellationToken cancellationToken = default)
    {
        var entityList = entities.ToList();
        var now = DateTime.UtcNow;

        foreach (var entity in entityList)
        {
            entity.UpdatedAt = now;
        }

        DbSet.UpdateRange(entityList);
        await Context.SaveChangesAsync(cancellationToken);
        return entityList;
    }

    public virtual async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            await DeleteAsync(entity, cancellationToken);
        }
    }

    public virtual async Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        // Soft delete
        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await Context.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task DeleteRangeAsync(
        IEnumerable<T> entities,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entity in entities)
        {
            entity.IsActive = false;
            entity.UpdatedAt = now;
        }
        await Context.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task HardDeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await DbSet.IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        
        if (entity != null)
        {
            await HardDeleteAsync(entity, cancellationToken);
        }
    }

    public virtual async Task HardDeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        DbSet.Remove(entity);
        await Context.SaveChangesAsync(cancellationToken);
    }

    public virtual IQueryable<T> QueryIncludingInactive()
    {
        return DbSet.IgnoreQueryFilters();
    }
}
