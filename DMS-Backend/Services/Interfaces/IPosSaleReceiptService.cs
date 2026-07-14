using DMS_Backend.Models.DTOs.PosSales;

namespace DMS_Backend.Services.Interfaces;

public interface IPosSaleReceiptService
{
    Task<PosSaleReceiptDto?> GetReceiptDataAsync(Guid posSaleId, CancellationToken cancellationToken = default);
    byte[] GenerateReceiptPdf(PosSaleReceiptDto receipt);
}
