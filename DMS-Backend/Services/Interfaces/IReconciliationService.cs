using DMS_Backend.Models.DTOs.Reconciliations;

namespace DMS_Backend.Services.Interfaces;

public interface IReconciliationService
{
    Task<ReconciliationDetailDto> CreateReconciliationAsync(CreateReconciliationDto dto, Guid userId, List<string> permissionCodes, CancellationToken cancellationToken = default);
    Task<ReconciliationDetailDto?> GetReconciliationByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReconciliationDetailDto?> GetByOutletAsync(Guid deliveryPlanId, Guid outletId, CancellationToken cancellationToken = default);
    Task<List<ReconciliationListDto>> GetAllReconciliationsAsync(CancellationToken cancellationToken = default);
    Task<ReconciliationDetailDto?> UpdateReconciliationAsync(Guid id, UpdateReconciliationDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteReconciliationAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReconciliationDetailDto?> UpdateActualQuantitiesAsync(Guid id, UpdateActualQuantitiesDto dto, CancellationToken cancellationToken = default);
    Task<ReconciliationDetailDto?> SubmitReconciliationAsync(Guid id, Guid submittedBy, CancellationToken cancellationToken = default);
}
