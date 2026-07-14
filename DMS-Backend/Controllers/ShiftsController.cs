using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DMS_Backend.Common;
using DMS_Backend.Models.DTOs.Shifts;
using DMS_Backend.Services.Interfaces;
using System.Security.Claims;

namespace DMS_Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/shifts")]
public class ShiftsController : ControllerBase
{
    private readonly IShiftService _shiftService;

    public ShiftsController(IShiftService shiftService)
    {
        _shiftService = shiftService;
    }

    /// <summary>
    /// Gets all shifts.
    /// </summary>
    [HttpGet]
    [HasPermission("production:shift:view")]
    public async Task<ActionResult<List<ShiftDto>>> GetAll([FromQuery] bool includeInactive = false)
    {
        var shifts = await _shiftService.GetAllShiftsAsync(includeInactive);
        return Ok(shifts);
    }

    /// <summary>
    /// Gets active shifts only (for dropdown lists).
    /// No permission check - accessible to all authenticated users.
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<List<ShiftDto>>> GetActive()
    {
        var shifts = await _shiftService.GetActiveShiftsAsync();
        return Ok(shifts);
    }

    /// <summary>
    /// Gets a specific shift by ID.
    /// </summary>
    [HttpGet("{id}")]
    [HasPermission("production:shift:view")]
    public async Task<ActionResult<ShiftDto>> GetById(Guid id)
    {
        var shift = await _shiftService.GetShiftByIdAsync(id);
        if (shift == null)
        {
            return NotFound(new { message = $"Shift with ID '{id}' not found" });
        }

        return Ok(shift);
    }

    /// <summary>
    /// Creates a new shift.
    /// </summary>
    [HttpPost]
    [HasPermission("production:shift:create")]
    public async Task<ActionResult<ShiftDto>> Create([FromBody] CreateShiftDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid user token" });
        }

        try
        {
            var shift = await _shiftService.CreateShiftAsync(dto, userId);
            return CreatedAtAction(nameof(GetById), new { id = shift.Id }, shift);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing shift.
    /// </summary>
    [HttpPut("{id}")]
    [HasPermission("production:shift:update")]
    public async Task<ActionResult<ShiftDto>> Update(Guid id, [FromBody] UpdateShiftDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid user token" });
        }

        try
        {
            var shift = await _shiftService.UpdateShiftAsync(id, dto, userId);
            return Ok(shift);
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

    /// <summary>
    /// Deletes a shift (soft delete).
    /// </summary>
    [HttpDelete("{id}")]
    [HasPermission("production:shift:delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid user token" });
        }

        try
        {
            var deleted = await _shiftService.DeleteShiftAsync(id, userId);
            if (!deleted)
            {
                return NotFound(new { message = $"Shift with ID '{id}' not found" });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
