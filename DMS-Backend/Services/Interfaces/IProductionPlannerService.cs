using DMS_Backend.Models.DTOs.ProductionPlans;

namespace DMS_Backend.Services.Interfaces;

public interface IProductionPlannerService
{
    Task<ComputeProductionPlanResponseDto> ComputeProductionPlanAsync(Guid deliveryPlanId, bool useFreezerStock, CancellationToken cancellationToken = default);
    Task<ProductionPlanDetailDto> CreateProductionPlanAsync(CreateProductionPlanDto dto, CancellationToken cancellationToken = default);
    Task<ProductionPlanDetailDto?> GetProductionPlanByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductionPlanDetailDto?> GetProductionPlanByDeliveryPlanIdAsync(Guid deliveryPlanId, CancellationToken cancellationToken = default);
    Task<List<ProductionPlanListDto>> GetAllProductionPlansAsync(CancellationToken cancellationToken = default);
    Task<ProductionPlanDetailDto?> UpdateProductionPlanAsync(Guid id, UpdateProductionPlanDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteProductionPlanAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductionAdjustmentDto> ApplyAdjustmentAsync(CreateProductionAdjustmentDto dto, CancellationToken cancellationToken = default);
}
