using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Roles;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class RoleService : IRoleService
{
    private readonly ApplicationDbContext _context;
    private readonly ISystemLogService _systemLogService;

    public RoleService(ApplicationDbContext context, ISystemLogService systemLogService)
    {
        _context = context;
        _systemLogService = systemLogService;
    }

    public async Task<(List<RoleListItemDto> Roles, int TotalCount)> GetAllAsync(
        int page,
        int pageSize,
        string? search,
        bool? isActive,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Roles
            .Include(r => r.RolePermissions)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(r =>
                r.Name.ToLower().Contains(searchLower) ||
                (r.Description ?? string.Empty).ToLower().Contains(searchLower));
        }

        if (isActive.HasValue)
        {
            query = query.Where(r => r.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var roles = await query
            .OrderBy(r => r.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoleListItemDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description ?? string.Empty,
                IsActive = r.IsActive,
                PermissionCount = r.RolePermissions.Count,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return (roles, totalCount);
    }

    public async Task<RoleDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (role == null)
            return null;

        return new RoleDetailDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description ?? string.Empty,
            IsActive = role.IsActive,
            Permissions = role.RolePermissions
                .Where(rp => rp.Permission != null)
                .Select(rp => new PermissionInfoDto
                {
                    Id = rp.Permission!.Id,
                    Code = rp.Permission.Code,
                    Module = rp.Permission.Module,
                    Description = rp.Permission.Description ?? string.Empty
                })
                .ToList(),
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        };
    }

    public async Task<RoleDetailDto> CreateAsync(
        CreateRoleDto dto,
        Guid createdById,
        CancellationToken cancellationToken = default)
    {
        if (await NameExistsAsync(dto.Name, null, cancellationToken))
        {
            throw new InvalidOperationException($"Role with name '{dto.Name}' already exists");
        }

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            IsActive = dto.IsActive,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync(cancellationToken);

        if (dto.PermissionIds.Any())
        {
            await AssignPermissionsAsync(role.Id, dto.PermissionIds, createdById, cancellationToken);
        }

        await _systemLogService.LogInfoAsync("Roles", $"Role created: {role.Name}", new { RoleId = role.Id, CreatedBy = createdById });

        return (await GetByIdAsync(role.Id, cancellationToken))!;
    }

    public async Task<RoleDetailDto> UpdateAsync(
        Guid id,
        UpdateRoleDto dto,
        Guid updatedById,
        CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles.FindAsync(new object[] { id }, cancellationToken);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID {id} not found");
        }

        if (role.Name != dto.Name && await NameExistsAsync(dto.Name, id, cancellationToken))
        {
            throw new InvalidOperationException($"Role with name '{dto.Name}' already exists");
        }

        role.Name = dto.Name;
        role.Description = dto.Description;
        role.IsActive = dto.IsActive;
        role.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("Roles", $"Role updated: {role.Name}", new { RoleId = role.Id, UpdatedBy = updatedById });

        return (await GetByIdAsync(role.Id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, Guid deletedById, CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.UserRoles)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID {id} not found");
        }

        if (role.UserRoles.Any())
        {
            throw new InvalidOperationException($"Cannot delete role '{role.Name}' because it is assigned to {role.UserRoles.Count} user(s)");
        }

        role.IsActive = false;
        role.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("Roles", $"Role deleted: {role.Name}", new { RoleId = role.Id, DeletedBy = deletedById });
    }

    public async Task AssignPermissionsAsync(
        Guid roleId,
        List<Guid> permissionIds,
        Guid updatedById,
        CancellationToken cancellationToken = default)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == roleId, cancellationToken);

        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID {roleId} not found");
        }

        var permissions = await _context.Permissions
            .Where(p => permissionIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        if (permissions.Count != permissionIds.Count)
        {
            throw new InvalidOperationException("One or more permissions not found or inactive");
        }

        _context.RolePermissions.RemoveRange(role.RolePermissions);

        foreach (var permissionId in permissionIds)
        {
            role.RolePermissions.Add(new RolePermission
            {
                RoleId = roleId,
                PermissionId = permissionId
            });
        }

        role.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("Roles", $"Permissions assigned to role: {role.Name}",
            new { RoleId = roleId, PermissionIds = permissionIds, UpdatedBy = updatedById });
    }

    public async Task<bool> NameExistsAsync(
        string name,
        Guid? excludeRoleId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedName = name.Trim();
        var query = _context.Roles.Where(r => r.Name == normalizedName);

        if (excludeRoleId.HasValue)
        {
            query = query.Where(r => r.Id != excludeRoleId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
