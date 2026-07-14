using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using DMS_Backend.Configuration;
using DMS_Backend.Models.DTOs.Auth;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly JwtOptions _jwtOptions;

    public AuthController(IAuthService authService, IOptions<JwtOptions> jwtOptions)
    {
        _authService = authService;
        _jwtOptions = jwtOptions.Value;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            var response = await _authService.LoginAsync(request, ipAddress, userAgent, cancellationToken);

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            // Log the actual exception for debugging
            Console.WriteLine($"Login Error: {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = "An error occurred during login", error = ex.Message });
        }
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<RefreshTokenResponseDto>> RefreshToken(
        [FromBody] RefreshTokenRequestDto request, 
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress, cancellationToken);

        if (result == null)
            return Unauthorized(new { message = "Invalid refresh token" });

        return Ok(new RefreshTokenResponseDto
        {
            AccessToken = result.Value.AccessToken,
            RefreshToken = result.Value.RefreshToken,
            User = result.Value.User,
            ExpiresIn = _jwtOptions.AccessTokenExpirationSeconds
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout(
        [FromBody] RefreshTokenRequestDto request, 
        CancellationToken cancellationToken)
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        if (!string.IsNullOrEmpty(request.RefreshToken))
        {
            await _authService.LogoutAsync(request.RefreshToken, email, ipAddress, userAgent, cancellationToken);
        }

        return Ok(new { message = "Logged out successfully" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser(CancellationToken cancellationToken)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var user = await _authService.GetCurrentUserAsync(userId, cancellationToken);
            if (user == null)
                return NotFound();

            return Ok(user);
        }
        catch (OperationCanceledException)
        {
            // Request was cancelled by client (e.g., page navigation)
            return StatusCode(499); // Client Closed Request
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword(
        [FromBody] ChangePasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        try
        {
            await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword, cancellationToken);
            return Ok(new { message = "Password changed successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        await _authService.ForgotPasswordAsync(request.Email, cancellationToken);
        
        // Always return success to prevent email enumeration
        return Ok(new { message = "If an account exists with that email, a password reset link has been sent" });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword(
        [FromBody] ResetPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _authService.ResetPasswordAsync(request.Token, request.NewPassword, cancellationToken);
            return Ok(new { message = "Password reset successfully. You can now log in with your new password" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }
}
