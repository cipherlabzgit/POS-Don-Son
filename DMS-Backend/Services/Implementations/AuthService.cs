using System.Security.Cryptography;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using DMS_Backend.Configuration;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Auth;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class AuthService : IAuthService
{
    private readonly IUserService _userService;
    private readonly IJwtService _jwtService;
    private readonly IAuthenticationLogService _authLogService;
    private readonly ISystemLogService _systemLogService;
    private readonly IEmailService _emailService;
    private readonly ApplicationDbContext _context;
    private readonly JwtOptions _jwtOptions;

    public AuthService(
        IUserService userService,
        IJwtService jwtService,
        IAuthenticationLogService authLogService,
        ISystemLogService systemLogService,
        IEmailService emailService,
        ApplicationDbContext context,
        IOptions<JwtOptions> jwtOptions)
    {
        _userService = userService;
        _jwtService = jwtService;
        _authLogService = authLogService;
        _systemLogService = systemLogService;
        _emailService = emailService;
        _context = context;
        _jwtOptions = jwtOptions.Value;
    }

    public async Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _userService.GetByEmailAsync(request.Email, cancellationToken);

            if (user == null)
            {
                await _authLogService.LogLoginFailureAsync(request.Email, "UserNotFound", ipAddress, userAgent);
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            if (!user.IsActive)
            {
                await _authLogService.LogLoginFailureAsync(request.Email, "AccountInactive", ipAddress, userAgent);
                throw new UnauthorizedAccessException("Account is inactive");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                await _authLogService.LogLoginFailureAsync(request.Email, "InvalidPassword", ipAddress, userAgent);
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Get user permissions
            var permissions = await _userService.GetUserPermissionsAsync(user.Id, cancellationToken);

            // Generate tokens
            var accessToken = _jwtService.GenerateAccessToken(user, permissions);
            var refreshToken = _jwtService.GenerateRefreshToken();
            await _jwtService.StoreRefreshTokenAsync(user.Id, refreshToken, cancellationToken);

            // Update last login
            await _userService.UpdateLastLoginAsync(user.Id, cancellationToken);

            // Log success
            await _authLogService.LogLoginSuccessAsync(user.Email, user.Id, ipAddress, userAgent);

            var userWithRoles = await _userService.GetByIdWithRolesAndPermissionsAsync(user.Id, cancellationToken);

            return new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = await MapToUserDtoAsync(userWithRoles!, permissions, cancellationToken),
                ExpiresIn = _jwtOptions.AccessTokenExpirationSeconds
            };
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            await _systemLogService.LogErrorAsync("Authentication", "Login failed", ex);
            throw;
        }
    }

    public async Task<(string AccessToken, string RefreshToken, UserDto User)?> RefreshTokenAsync(
        string refreshToken,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var userId = await _jwtService.ValidateRefreshTokenAsync(refreshToken, cancellationToken);
        if (userId == null)
            return null;

        var user = await _userService.GetByIdWithRolesAndPermissionsAsync(userId.Value, cancellationToken);
        if (user == null || !user.IsActive)
            return null;

        // Revoke the old refresh token (rotation)
        await _jwtService.RevokeRefreshTokenAsync(refreshToken, cancellationToken);

        var permissions = await _userService.GetUserPermissionsAsync(user.Id, cancellationToken);
        var newAccessToken = _jwtService.GenerateAccessToken(user, permissions);
        
        // Generate and store new refresh token
        var newRefreshToken = _jwtService.GenerateRefreshToken();
        await _jwtService.StoreRefreshTokenAsync(user.Id, newRefreshToken, cancellationToken);

        await _authLogService.LogTokenRefreshAsync(user.Email, user.Id, ipAddress);

        await _systemLogService.LogInfoAsync(
            "Authentication",
            $"Refresh token rotated for {user.Email}",
            new { UserId = user.Id, IpAddress = ipAddress });

        return (newAccessToken, newRefreshToken, await MapToUserDtoAsync(user, permissions, cancellationToken));
    }

    public async Task LogoutAsync(
        string refreshToken,
        string? email,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        var userId = await _jwtService.ValidateRefreshTokenAsync(refreshToken, cancellationToken);
        if (userId.HasValue && email != null)
        {
            await _authLogService.LogLogoutAsync(email, userId.Value, ipAddress, userAgent);
        }

        await _jwtService.RevokeRefreshTokenAsync(refreshToken, cancellationToken);
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userService.GetByIdWithRolesAndPermissionsAsync(userId, cancellationToken);
        if (user == null)
            return null;

        var permissions = await _userService.GetUserPermissionsAsync(user.Id, cancellationToken);
        return await MapToUserDtoAsync(user, permissions, cancellationToken);
    }

    public async Task ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        var user = await _userService.GetByIdWithRolesAndPermissionsAsync(userId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is inactive");

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect");

        // Validate new password is different from current
        if (BCrypt.Net.BCrypt.Verify(newPassword, user.PasswordHash))
            throw new InvalidOperationException("New password must be different from current password");

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);
        user.UpdatedAt = DateTime.UtcNow;

        await _userService.UpdatePasswordAsync(userId, user.PasswordHash, cancellationToken);

        await _emailService.SendPasswordChangedNotificationAsync(user.Email, cancellationToken);

        await _systemLogService.LogInfoAsync(
            "Authentication",
            $"User {user.Email} changed password",
            new { UserId = userId });
    }

    public async Task ForgotPasswordAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _userService.GetByEmailAsync(email, cancellationToken);

        // Always return success to prevent email enumeration
        if (user == null || !user.IsActive)
        {
            await _systemLogService.LogWarningAsync(
                "Authentication",
                $"Password reset requested for non-existent or inactive email: {email}");
            return;
        }

        // Invalidate any existing unused tokens for this user
        var existingTokens = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in existingTokens)
        {
            token.IsUsed = true;
            token.UsedAt = DateTime.UtcNow;
        }

        // Generate new reset token
        var resetToken = GenerateSecureToken();
        var passwordResetToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = resetToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.PasswordResetTokens.Add(passwordResetToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken, cancellationToken);

        await _systemLogService.LogInfoAsync(
            "Authentication",
            $"Password reset requested for {user.Email}",
            new { UserId = user.Id });
    }

    public async Task ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default)
    {
        var resetToken = await _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed, cancellationToken);

        if (resetToken == null)
            throw new UnauthorizedAccessException("Invalid or expired reset token");

        if (resetToken.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Reset token has expired");

        if (resetToken.User == null || !resetToken.User.IsActive)
            throw new UnauthorizedAccessException("User account is not active");

        // Update password
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);
        await _userService.UpdatePasswordAsync(resetToken.UserId, newPasswordHash, cancellationToken);

        // Mark token as used
        resetToken.IsUsed = true;
        resetToken.UsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendPasswordChangedNotificationAsync(resetToken.User.Email, cancellationToken);

        await _systemLogService.LogInfoAsync(
            "Authentication",
            $"Password reset completed for {resetToken.User.Email}",
            new { UserId = resetToken.UserId });
    }

    private static string GenerateSecureToken()
    {
        var randomBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    private async Task<UserDto> MapToUserDtoAsync(
        Models.Entities.User user,
        List<string> permissions,
        CancellationToken cancellationToken)
    {
        var dto = MapToUserDto(user, permissions);
        await EnrichAssignedOutletAsync(dto, user.Id, cancellationToken);
        return dto;
    }

    private async Task EnrichAssignedOutletAsync(UserDto dto, Guid userId, CancellationToken cancellationToken)
    {
        var assignment = await _context.OutletEmployees
            .AsNoTracking()
            .Where(oe => oe.UserId == userId && oe.IsActive)
            .OrderByDescending(oe => oe.IsManager)
            .ThenBy(oe => oe.CreatedAt)
            .Select(oe => new { oe.OutletId, OutletName = oe.Outlet != null ? oe.Outlet.Name : null })
            .FirstOrDefaultAsync(cancellationToken);

        if (assignment == null || string.IsNullOrWhiteSpace(assignment.OutletName))
            return;

        dto.AssignedOutletId = assignment.OutletId;
        dto.AssignedOutletName = assignment.OutletName;
    }

    private static UserDto MapToUserDto(Models.Entities.User user, List<string> permissions)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsSuperAdmin = user.IsSuperAdmin,
            IsActive = user.IsActive,
            Roles = user.UserRoles?
                .Where(ur => ur.Role?.IsActive == true)
                .Select(ur => new RoleDto
                {
                    Id = ur.Role.Id,
                    Name = ur.Role.Name,
                    Description = ur.Role.Description
                })
                .ToList() ?? new List<RoleDto>(),
            Permissions = permissions
        };
    }
}
