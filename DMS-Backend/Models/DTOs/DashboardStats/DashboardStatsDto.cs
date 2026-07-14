namespace DMS_Backend.Models.DTOs.DashboardStats;

public class SalesTrendPointDto
{
    public string Date { get; set; } = string.Empty;
    public decimal TotalValue { get; set; }
    public int DeliveryCount { get; set; }
}

public class SalesTrendDto
{
    public List<SalesTrendPointDto> Points { get; set; } = new();
    public decimal GrandTotal { get; set; }
}

public class DisposalBySectionItemDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class DisposalBySectionDto
{
    public string Date { get; set; } = string.Empty;
    public List<DisposalBySectionItemDto> Items { get; set; } = new();
    public decimal TotalDisposal { get; set; }
}

public class TopDeliveryOutletDto
{
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public int DeliveryCount { get; set; }
    public decimal TotalQuantity { get; set; }
}

public class TopDeliveriesDto
{
    public string Date { get; set; } = string.Empty;
    public List<TopDeliveryOutletDto> Outlets { get; set; } = new();
}

public class DeliveryVsDisposalItemDto
{
    public string Category { get; set; } = string.Empty;
    public decimal DeliveryQty { get; set; }
    public decimal DisposalQty { get; set; }
}

public class DeliveryVsDisposalDto
{
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public List<DeliveryVsDisposalItemDto> Items { get; set; } = new();
}

// GAP 11: Section-wise production totals
public class SectionProductionTotalDto
{
    public Guid SectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string SectionCode { get; set; } = string.Empty;
    public List<SectionProductItemDto> Items { get; set; } = new();
    public decimal TotalFullQty { get; set; }
    public decimal TotalMiniQty { get; set; }
}

public class SectionProductItemDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal FullQuantity { get; set; }
    public decimal MiniQuantity { get; set; }
}

public class SectionProductionSummaryDto
{
    public string Date { get; set; } = string.Empty;
    public Guid? DeliveryTurnId { get; set; }
    public string? DeliveryTurnName { get; set; }
    public List<SectionProductionTotalDto> Sections { get; set; } = new();
}

// GAP 11: Ingredient stock summary (low-stock alerts)
public class IngredientStockSummaryItemDto
{
    public Guid IngredientId { get; set; }
    public string IngredientCode { get; set; } = string.Empty;
    public string IngredientName { get; set; } = string.Empty;
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal? ReorderThreshold { get; set; }
    public decimal? LowStockThreshold { get; set; }
    public bool IsLowStock { get; set; }
    public bool NeedsReorder { get; set; }
}

public class IngredientStockAlertSummaryDto
{
    public int TotalLowStock { get; set; }
    public int TotalNeedsReorder { get; set; }
    public List<IngredientStockSummaryItemDto> Alerts { get; set; } = new();
}
