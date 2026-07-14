namespace DMS_Backend.Models.DTOs.DeliverySummary;

public class DeliverySummaryDto
{
    public DateTime DeliveryDate { get; set; }
    public Guid DeliveryTurnId { get; set; }
    public string TurnName { get; set; } = string.Empty;
    /// <summary>
    /// "production" = show TotalQty (full production need, freezer not deducted).
    /// "stores" = show NetRequiredQty (TotalQty - FreezerBalance, what stores must issue).
    /// </summary>
    public string Context { get; set; } = "production";
    public List<DeliveryOutletSummaryDto> Outlets { get; set; } = new();
    public List<DeliveryProductTotalDto> ProductTotals { get; set; } = new();
}

public class DeliveryOutletSummaryDto
{
    public Guid OutletId { get; set; }
    public string OutletCode { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public List<DeliveryProductSummaryDto> Products { get; set; } = new();
}

public class DeliveryProductSummaryDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal RegularFullQty { get; set; }
    public decimal RegularMiniQty { get; set; }
    public decimal CustomizedFullQty { get; set; }
    public decimal CustomizedMiniQty { get; set; }
    /// <summary>Total production quantity regardless of freezer stock.</summary>
    public decimal TotalQty { get; set; }
    /// <summary>
    /// Quantity already available in the freezer for this product.
    /// Only populated when context = "stores".
    /// </summary>
    public decimal FreezerBalance { get; set; }
    /// <summary>
    /// Net quantity stores must issue = TotalQty - FreezerBalance.
    /// Only meaningful when context = "stores"; equals TotalQty when context = "production".
    /// </summary>
    public decimal NetRequiredQty { get; set; }
}

public class DeliveryProductTotalDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal TotalRegularFull { get; set; }
    public decimal TotalRegularMini { get; set; }
    public decimal TotalCustomizedFull { get; set; }
    public decimal TotalCustomizedMini { get; set; }
    /// <summary>Total production quantity regardless of freezer stock.</summary>
    public decimal GrandTotal { get; set; }
    /// <summary>
    /// Total quantity available in freezer across all outlets for this product.
    /// Only populated when context = "stores".
    /// </summary>
    public decimal TotalFreezerBalance { get; set; }
    /// <summary>
    /// Net quantity stores must issue = GrandTotal - TotalFreezerBalance.
    /// Only meaningful when context = "stores".
    /// </summary>
    public decimal NetGrandTotal { get; set; }
}
