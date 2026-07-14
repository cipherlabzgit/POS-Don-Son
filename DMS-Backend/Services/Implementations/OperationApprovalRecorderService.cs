using DMS_Backend.Data;
using DMS_Backend.Models.DTOs.OperationApprovals;
using DMS_Backend.Services.Interfaces;

namespace DMS_Backend.Services.Implementations;

public class OperationApprovalRecorderService : IOperationApprovalRecorder
{
    private readonly ApplicationDbContext _context;

    public OperationApprovalRecorderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperationApprovalDto> RecordTransitionAsync(CreateOperationApprovalDto dto, Guid performedBy, CancellationToken cancellationToken = default)
    {
        var record = new Models.Entities.OperationApproval
        {
            DocumentType = dto.DocumentType,
            DocumentId = dto.DocumentId,
            DocumentNo = dto.DocumentNo,
            FromStatus = dto.FromStatus,
            ToStatus = dto.ToStatus,
            Action = dto.Action,
            Remarks = dto.Remarks,
            PerformedBy = performedBy,
            PerformedAt = DateTime.UtcNow,
        };

        _context.OperationApprovals.Add(record);
        await _context.SaveChangesAsync(cancellationToken);
        await _context.Entry(record).Reference(r => r.PerformedByUser).LoadAsync(cancellationToken);

        return new OperationApprovalDto
        {
            Id = record.Id,
            DocumentType = record.DocumentType,
            DocumentId = record.DocumentId,
            DocumentNo = record.DocumentNo,
            FromStatus = record.FromStatus,
            ToStatus = record.ToStatus,
            Action = record.Action,
            PerformedBy = record.PerformedBy,
            PerformedByName = record.PerformedByUser?.FullName ?? record.PerformedByUser?.Email,
            PerformedAt = record.PerformedAt,
            Remarks = record.Remarks,
        };
    }
}
