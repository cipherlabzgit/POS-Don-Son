using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.LabelPrintingComments;
using DMS_Backend.Models.Entities;
using DMS_Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Services.Implementations;

public sealed class LabelPrintingCommentService : ILabelPrintingCommentService
{
    private readonly ApplicationDbContext _context;

    public LabelPrintingCommentService(ApplicationDbContext context)
    {
        _context = context;
    }

    private static LabelPrintingCommentListDto Map(LabelPrintingComment e) =>
        new()
        {
            Id = e.Id,
            CommentText = e.CommentText,
            SortOrder = e.SortOrder,
            IsActive = e.IsActive,
        };

    public async Task<IReadOnlyList<LabelPrintingCommentListDto>> GetAllAsync(bool activeOnly = false, CancellationToken cancellationToken = default)
    {
        var q = _context.LabelPrintingComments.AsNoTracking().AsQueryable();
        if (activeOnly)
        {
            q = q.Where(c => c.IsActive);
        }

        var list = await q.OrderBy(c => c.SortOrder).ThenBy(c => c.CommentText).ToListAsync(cancellationToken);
        return list.Select(Map).ToList();
    }

    public async Task<LabelPrintingCommentListDto> CreateAsync(LabelPrintingCommentCreateDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var entity = new LabelPrintingComment
        {
            Id = Guid.NewGuid(),
            CommentText = dto.CommentText.Trim(),
            SortOrder = dto.SortOrder,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedById = userId,
            UpdatedById = userId,
        };
        _context.LabelPrintingComments.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<LabelPrintingCommentListDto> UpdateAsync(Guid id, LabelPrintingCommentUpdateDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var entity = await _context.LabelPrintingComments.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (entity == null)
        {
            throw new InvalidOperationException("Label printing comment not found");
        }

        entity.CommentText = dto.CommentText.Trim();
        entity.SortOrder = dto.SortOrder;
        entity.IsActive = dto.IsActive;
        entity.UpdatedById = userId;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }
}
