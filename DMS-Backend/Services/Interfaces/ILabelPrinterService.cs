using DMS_Backend.Models.DTOs.LabelPrinters;

namespace DMS_Backend.Services.Interfaces;

public interface ILabelPrinterService
{
    Task<IReadOnlyList<LabelPrinterListDto>> GetAllAsync(bool activeOnly = false, CancellationToken cancellationToken = default);

    Task<LabelPrinterListDto> CreateAsync(LabelPrinterCreateDto dto, Guid userId, CancellationToken cancellationToken = default);

    Task<LabelPrinterListDto> UpdateAsync(Guid id, LabelPrinterUpdateDto dto, Guid userId, CancellationToken cancellationToken = default);
}
