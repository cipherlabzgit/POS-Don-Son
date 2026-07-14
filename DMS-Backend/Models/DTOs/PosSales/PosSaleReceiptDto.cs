namespace DMS_Backend.Models.DTOs.PosSales;

public class PosSaleReceiptDto
{
    public string CompanyName { get; set; } = "DON & SONS (PVT) LTD";
    public string CompanyAddress { get; set; } = string.Empty;
    public string CompanyPhone { get; set; } = string.Empty;
    public string ShowroomName { get; set; } = string.Empty;
    public DateTime BillDate { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public string BillNo { get; set; } = string.Empty;
    public List<PosSaleReceiptLineDto> Items { get; set; } = new();
    public decimal Total { get; set; }
    public decimal Cash { get; set; }
    public decimal Change { get; set; }
    public int TotalQty { get; set; }
    public string FooterMessage { get; set; } = "FOOD ARE NOT RETURNABLE\nCOMPLAINT MUST BE LODGED BEFORE\n12 NOON NEXT DAY";
    public string PoweredBy { get; set; } = "Powered by www.yuvima.lk";
}

public class PosSaleReceiptLineDto
{
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal Total { get; set; }
}
