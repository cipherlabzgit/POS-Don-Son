using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Users;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly ISystemLogService _systemLogService;

    public UserService(ApplicationDbContext context, ISystemLogService systemLogService)
    {
        _context = context;
        _systemLogService = systemLogService;
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
    }

    public async Task<User?> GetByIdWithRolesAndPermissionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsSplitQuery()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
    }

    public async Task<List<string>> GetUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdWithRolesAndPermissionsAsync(userId, cancellationToken);
        
        if (user == null)
            return new List<string>();

        if (user.IsSuperAdmin)
            return new List<string> { "*" };

        return user.UserRoles?
            .Where(ur => ur.Role?.IsActive == true)
            .SelectMany(ur => ur.Role.RolePermissions ?? Enumerable.Empty<RolePermission>())
            .Select(rp => rp.Permission?.Code)
            .Where(code => !string.IsNullOrEmpty(code))
            .Cast<string>()
            .Distinct()
            .ToList() ?? new List<string>();
    }

    public async Task UpdateLastLoginAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
        if (user != null)
        {
            user.LastLoginAt = DateTimeOffset.UtcNow;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task UpdatePasswordAsync(Guid userId, string passwordHash, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
        if (user != null)
        {
            user.PasswordHash = passwordHash;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<(List<UserListItemDto> Users, int TotalCount)> GetAllAsync(
        int page, 
        int pageSize, 
        string? search, 
        bool? isActive, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u => 
                u.Email.ToLower().Contains(searchLower) ||
                u.FirstName.ToLower().Contains(searchLower) ||
                u.LastName.ToLower().Contains(searchLower) ||
                (u.Phone != null && u.Phone.Contains(searchLower)));
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserListItemDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Phone = u.Phone,
                IsActive = u.IsActive,
                IsSuperAdmin = u.IsSuperAdmin,
                LastLoginAt = u.LastLoginAt,
                Roles = u.UserRoles
                    .Where(ur => ur.Role != null && ur.Role.IsActive)
                    .Select(ur => new RoleInfoDto
                    {
                        Id = ur.Role!.Id,
                        Name = ur.Role.Name,
                        Description = ur.Role.Description ?? string.Empty
                    })
                    .ToList(),
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return (users, totalCount);
    }

    public async Task<UserDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
            return null;

        var permissions = user.IsSuperAdmin
            ? new List<string> { "*" }
            : user.UserRoles
                .Where(ur => ur.Role?.IsActive == true)
                .SelectMany(ur => ur.Role!.RolePermissions ?? Enumerable.Empty<RolePermission>())
                .Select(rp => rp.Permission?.Code)
                .Where(code => !string.IsNullOrEmpty(code))
                .Distinct()
                .ToList()!;

        return new UserDetailDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            IsActive = user.IsActive,
            IsSuperAdmin = user.IsSuperAdmin,
            LastLoginAt = user.LastLoginAt,
            Roles = user.UserRoles
                .Where(ur => ur.Role?.IsActive == true)
                .Select(ur => new RoleInfoDto
                {
                    Id = ur.Role!.Id,
                    Name = ur.Role.Name,
                    Description = ur.Role.Description ?? string.Empty
                })
                .ToList(),
            Permissions = permissions,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task<UserDetailDto> CreateAsync(
        CreateUserDto dto, 
        Guid createdById, 
        CancellationToken cancellationToken = default)
    {
        // Check if email already exists
        if (await EmailExistsAsync(dto.Email, null, cancellationToken))
        {
            throw new InvalidOperationException($"User with email {dto.Email} already exists");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12),
            IsActive = dto.IsActive,
            IsSuperAdmin = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // Assign roles
        if (dto.RoleIds.Any())
        {
            await AssignRolesAsync(user.Id, dto.RoleIds, createdById, cancellationToken);
        }

        await _systemLogService.LogInfoAsync("Users", $"User created: {user.Email}", new { UserId = user.Id, CreatedBy = createdById });

        return (await GetByIdAsync(user.Id, cancellationToken))!;
    }

    public async Task<UserDetailDto> UpdateAsync(
        Guid id, 
        UpdateUserDto dto, 
        Guid updatedById, 
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {id} not found");
        }

        // Check if email is being changed and if it already exists
        if (user.Email != dto.Email.Trim().ToLowerInvariant())
        {
            if (await EmailExistsAsync(dto.Email, id, cancellationToken))
            {
                throw new InvalidOperationException($"User with email {dto.Email} already exists");
            }
        }

        user.Email = dto.Email.Trim().ToLowerInvariant();
        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Phone = dto.Phone;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("Users", $"User updated: {user.Email}", new { UserId = user.Id, UpdatedBy = updatedById });

        return (await GetByIdAsync(user.Id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, Guid deletedById, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {id} not found");
        }

        if (user.IsSuperAdmin)
        {
            throw new InvalidOperationException("Cannot delete super admin users");
        }

        // Soft delete
        user.IsActive = false;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("Users", $"User deleted: {user.Email}", new { UserId = user.Id, DeletedBy = deletedById });
    }

    public async Task AssignRolesAsync(
        Guid userId, 
        List<Guid> roleIds, 
        Guid updatedById, 
        CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {userId} not found");
        }

        // Verify all roles exist and are active
        var roles = await _context.Roles
            .Where(r => roleIds.Contains(r.Id) && r.IsActive)
            .ToListAsync(cancellationToken);

        if (roles.Count != roleIds.Count)
        {
            throw new InvalidOperationException("One or more roles not found or inactive");
        }

        // Remove existing role assignments
        _context.UserRoles.RemoveRange(user.UserRoles);

        // Add new role assignments
        foreach (var roleId in roleIds)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = userId,
                RoleId = roleId
            });
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await _systemLogService.LogInfoAsync("Users", $"Roles assigned to user: {user.Email}", 
            new { UserId = userId, RoleIds = roleIds, UpdatedBy = updatedById });
    }

    public async Task<bool> EmailExistsAsync(
        string email, 
        Guid? excludeUserId = null, 
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var query = _context.Users.Where(u => u.Email == normalizedEmail);

        if (excludeUserId.HasValue)
        {
            query = query.Where(u => u.Id != excludeUserId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }
}
