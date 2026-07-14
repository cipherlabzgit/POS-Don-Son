namespace DMS_Backend.Models.DTOs.StockBF;

/// <summary>
/// Represents a grouped Stock BF entry (multiple products for the same outlet/date/creation time).
/// </summary>
public sealed class StockBFGroupDto
{
    /// <summary>Group identifier (first record ID in the group)</summary>
    public Guid GroupId { get; set; }
    
    /// <summary>BF Date for this group</summary>
    public DateTime BFDate { get; set; }
    
    /// <summary>Outlet ID</summary>
    public Guid OutletId { get; set; }
    
    /// <summary>Outlet Code</summary>
    public string OutletCode { get; set; } = string.Empty;
    
    /// <summary>Outlet Name</summary>
    public string OutletName { get; set; } = string.Empty;
    
    /// <summary>Number of products in this group</summary>
    public int ItemCount { get; set; }
    
    /// <summary>Total quantity across all products</summary>
    public decimal TotalQuantity { get; set; }
    
    /// <summary>Common status (if all items have the same status)</summary>
    public string Status { get; set; } = string.Empty;
    
    /// <summary>True if all items in the group have the same status</summary>
    public bool HasMixedStatus { get; set; }
    
    /// <summary>Created by user name</summary>
    public string? CreatedByName { get; set; }
    
    /// <summary>Created at timestamp</summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>Updated by user name</summary>
    public string? UpdatedByName { get; set; }
    
    /// <summary>Updated at timestamp</summary>
    public DateTime UpdatedAt { get; set; }
    
    /// <summary>Approved by user name</summary>
    public string? ApprovedByName { get; set; }
    
    /// <summary>Approved date</summary>
    public DateTime? ApprovedDate { get; set; }
    
    /// <summary>Rejected by user name</summary>
    public string? RejectedByName { get; set; }
    
    /// <summary>Rejected date</summary>
    public DateTime? RejectedDate { get; set; }
    
    /// <summary>Individual items in this group</summary>
    public List<StockBFListDto> Items { get; set; } = new();
}
