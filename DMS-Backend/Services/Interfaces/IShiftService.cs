using DMS_Backend.Models.DTOs.Shifts;

namespace DMS_Backend.Services.Interfaces;

/// <summary>
/// Service interface for managing shifts.
/// </summary>
public interface IShiftService
{
    /// <summary>
    /// Gets all shifts with optional filtering.
    /// </summary>
    Task<List<ShiftDto>> GetAllShiftsAsync(bool includeInactive = false);

    /// <summary>
    /// Gets active shifts only (for dropdown lists).
    /// </summary>
    Task<List<ShiftDto>> GetActiveShiftsAsync();

    /// <summary>
    /// Gets a shift by ID.
    /// </summary>
    Task<ShiftDto?> GetShiftByIdAsync(Guid id);

    /// <summary>
    /// Creates a new shift.
    /// </summary>
    Task<ShiftDto> CreateShiftAsync(CreateShiftDto dto, Guid userId);

    /// <summary>
    /// Updates an existing shift.
    /// </summary>
    Task<ShiftDto> UpdateShiftAsync(Guid id, UpdateShiftDto dto, Guid userId);

    /// <summary>
    /// Deletes (soft delete) a shift.
    /// </summary>
    Task<bool> DeleteShiftAsync(Guid id, Guid userId);

    /// <summary>
    /// Checks if a shift code already exists.
    /// </summary>
    Task<bool> ShiftCodeExistsAsync(string code, Guid? excludeId = null);
}
