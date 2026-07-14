using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using DMS_Backend.Configuration;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public sealed class JwtService : IJwtService
{
    private readonly JwtOptions _jwtOptions;
    private readonly IRefreshTokenService _refreshTokenService;

    public JwtService(
        IOptions<JwtOptions> jwtOptions,
        IRefreshTokenService refreshTokenService)
    {
        _jwtOptions = jwtOptions.Value;
        _refreshTokenService = refreshTokenService;
    }

    public string GenerateAccessToken(User user, List<string> permissions)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("isSuperAdmin", user.IsSuperAdmin.ToString().ToLower()),
            new("firstName", user.FirstName),
            new("lastName", user.LastName)
        };

        // Add permissions
        if (user.IsSuperAdmin)
        {
            claims.Add(new Claim("permission", "*"));
        }
        else
        {
            foreach (var permission in permissions)
            {
                claims.Add(new Claim("permission", permission));
            }
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtOptions.AccessTokenExpirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public async Task StoreRefreshTokenAsync(Guid userId, string refreshToken, CancellationToken cancellationToken = default)
    {
        await _refreshTokenService.StoreRefreshTokenAsync(userId, refreshToken, _jwtOptions.RefreshTokenExpirationDays);
    }

    public async Task<Guid?> ValidateRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return await _refreshTokenService.ValidateRefreshTokenAsync(refreshToken);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        await _refreshTokenService.RevokeRefreshTokenAsync(refreshToken);
    }
}
