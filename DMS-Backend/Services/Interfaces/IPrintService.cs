using DMS_Backend.Models.DTOs.Print;

namespace DMS_Backend.Services.Interfaces;

public interface IPrintService
{
    Task<PrintReceiptCardDto?> GetReceiptCardAsync(Guid deliveryPlanId, Guid outletId, CancellationToken cancellationToken = default);
    Task<SectionPrintBundleDto?> GetSectionBundleAsync(Guid productionPlanId, Guid sectionId, CancellationToken cancellationToken = default);
}
