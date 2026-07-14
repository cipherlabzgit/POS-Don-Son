using DMS_Backend.Models.DTOs.Users;
using DMS_Backend.Models.Entities;

namespace DMS_Backend.Services.Interfaces;

public interface IUserService
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithRolesAndPermissionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<string>> GetUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpdateLastLoginAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpdatePasswordAsync(Guid userId, string passwordHash, CancellationToken cancellationToken = default);
    
    // CRUD operations
    Task<(List<UserListItemDto> Users, int TotalCount)> GetAllAsync(int page, int pageSize, string? search, bool? isActive, CancellationToken cancellationToken = default);
    Task<UserDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDetailDto> CreateAsync(CreateUserDto dto, Guid createdById, CancellationToken cancellationToken = default);
    Task<UserDetailDto> UpdateAsync(Guid id, UpdateUserDto dto, Guid updatedById, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid deletedById, CancellationToken cancellationToken = default);
    Task AssignRolesAsync(Guid userId, List<Guid> roleIds, Guid updatedById, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsAsync(string email, Guid? excludeUserId = null, CancellationToken cancellationToken = default);
}
