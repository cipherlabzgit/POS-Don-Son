using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.LabelPrinters;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class LabelPrinterService : ILabelPrinterService
{
    private readonly ApplicationDbContext _context;

    public LabelPrinterService(ApplicationDbContext context)
    {
        _context = context;
    }

    private static LabelPrinterListDto Map(LabelPrinter e) =>
        new()
        {
            Id = e.Id,
            Name = e.Name,
            SortOrder = e.SortOrder,
            IsActive = e.IsActive,
        };

    public async Task<IReadOnlyList<LabelPrinterListDto>> GetAllAsync(bool activeOnly = false, CancellationToken cancellationToken = default)
    {
        var q = _context.LabelPrinters.AsNoTracking().AsQueryable();
        if (activeOnly)
        {
            q = q.Where(p => p.IsActive);
        }

        var list = await q.OrderBy(p => p.SortOrder).ThenBy(p => p.Name).ToListAsync(cancellationToken);
        return list.Select(Map).ToList();
    }

    public async Task<LabelPrinterListDto> CreateAsync(LabelPrinterCreateDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var entity = new LabelPrinter
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            SortOrder = dto.SortOrder,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedById = userId,
            UpdatedById = userId,
        };
        _context.LabelPrinters.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<LabelPrinterListDto> UpdateAsync(Guid id, LabelPrinterUpdateDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var entity = await _context.LabelPrinters.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (entity == null)
        {
            throw new InvalidOperationException("Label printer not found");
        }

        entity.Name = dto.Name.Trim();
        entity.SortOrder = dto.SortOrder;
        entity.IsActive = dto.IsActive;
        entity.UpdatedById = userId;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }
}
