namespace DMS_Backend.Models.DTOs.LabelPrintRequests;

/// <summary>
/// All resolved variable values for a label print request, ready to substitute into a ZPL template.
/// </summary>
public sealed class LabelPrintDataDto
{
    public Guid RequestId { get; set; }
    public string DisplayNo { get; set; } = string.Empty;
    public int LabelCount { get; set; }

    // Product fields
    public string ProductName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Uom { get; set; } = string.Empty;

    // Pricing
    public string Price { get; set; } = string.Empty;
    public string Mrp { get; set; } = string.Empty;

    // Dates
    public string PrintDate { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string ExpiryDate { get; set; } = string.Empty;
    public int ExpiryDays { get; set; }

    // Context
    public string Outlet { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string PriceList { get; set; } = string.Empty;
}
