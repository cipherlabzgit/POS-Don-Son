using DMS_Backend.Models.DTOs.Transfers;

namespace DMS_Backend.Services.Interfaces;

public interface ITransferService
{
    Task<(List<TransferListDto> Transfers, int TotalCount)> GetAllAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate,
        Guid? fromOutletId, Guid? toOutletId, string? status, bool unreceivedOnly = false, CancellationToken cancellationToken = default);
    Task<TransferDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TransferDetailDto?> GetByTransferNoAsync(string transferNo, CancellationToken cancellationToken = default);
    Task<TransferDetailDto> CreateAsync(CreateTransferDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<TransferDetailDto?> UpdateAsync(Guid id, UpdateTransferDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TransferDetailDto?> SubmitAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<TransferDetailDto?> ApproveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<TransferDetailDto?> RejectAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    /// <summary>Destination cashier marks goods received. Does not approve the transfer.</summary>
    Task<TransferDetailDto?> CompleteReceiptAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
