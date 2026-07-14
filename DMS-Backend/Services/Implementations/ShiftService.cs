using AutoMapper;
using Microsoft.EntityFrameworkCore;
using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.Shifts;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class ShiftService : IShiftService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ShiftService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ShiftDto>> GetAllShiftsAsync(bool includeInactive = false)
    {
        var query = _context.Shifts.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(s => s.IsActive);
        }

        var shifts = await query
            .OrderBy(s => s.DisplayOrder)
            .ThenBy(s => s.Name)
            .ToListAsync();

        return _mapper.Map<List<ShiftDto>>(shifts);
    }

    public async Task<List<ShiftDto>> GetActiveShiftsAsync()
    {
        var shifts = await _context.Shifts
            .Where(s => s.IsActive)
            .OrderBy(s => s.DisplayOrder)
            .ThenBy(s => s.Name)
            .ToListAsync();

        return _mapper.Map<List<ShiftDto>>(shifts);
    }

    public async Task<ShiftDto?> GetShiftByIdAsync(Guid id)
    {
        var shift = await _context.Shifts.FindAsync(id);
        return shift == null ? null : _mapper.Map<ShiftDto>(shift);
    }

    public async Task<ShiftDto> CreateShiftAsync(CreateShiftDto dto, Guid userId)
    {
        if (await ShiftCodeExistsAsync(dto.Code))
        {
            throw new InvalidOperationException($"Shift with code '{dto.Code}' already exists");
        }

        var shift = _mapper.Map<Shift>(dto);
        shift.Id = Guid.NewGuid();
        shift.CreatedById = userId;
        shift.CreatedAt = DateTime.UtcNow;
        shift.UpdatedAt = DateTime.UtcNow;

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        return _mapper.Map<ShiftDto>(shift);
    }

    public async Task<ShiftDto> UpdateShiftAsync(Guid id, UpdateShiftDto dto, Guid userId)
    {
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null)
        {
            throw new KeyNotFoundException($"Shift with ID '{id}' not found");
        }

        if (await ShiftCodeExistsAsync(dto.Code, id))
        {
            throw new InvalidOperationException($"Shift with code '{dto.Code}' already exists");
        }

        _mapper.Map(dto, shift);
        shift.UpdatedById = userId;
        shift.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<ShiftDto>(shift);
    }

    public async Task<bool> DeleteShiftAsync(Guid id, Guid userId)
    {
        var shift = await _context.Shifts.FindAsync(id);
        if (shift == null)
        {
            return false;
        }

        // Check if shift is being used in any daily productions
        var isUsed = await _context.DailyProductions
            .AnyAsync(dp => dp.ShiftId == id);

        if (isUsed)
        {
            throw new InvalidOperationException("Cannot delete shift that is being used in daily productions");
        }

        shift.IsActive = false;
        shift.UpdatedById = userId;
        shift.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ShiftCodeExistsAsync(string code, Guid? excludeId = null)
    {
        var query = _context.Shifts.Where(s => s.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(s => s.Id != excludeId.Value);
        }

        return await query.AnyAsync();
    }
}
