using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <summary>
/// Allow a new Stock BF for the same outlet/date/product after the previous row is Rejected.
/// </summary>
[Migration("20260908040000_StockBfAllowReentryAfterReject")]
public partial class StockBfAllowReentryAfterReject : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            DROP INDEX IF EXISTS ""IX_stock_bf_outlet_id_bf_date_product_id"";
            CREATE UNIQUE INDEX ""IX_stock_bf_outlet_id_bf_date_product_id""
                ON stock_bf (outlet_id, bf_date, product_id)
                WHERE is_active AND status <> 'Rejected';
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            DROP INDEX IF EXISTS ""IX_stock_bf_outlet_id_bf_date_product_id"";
            CREATE UNIQUE INDEX ""IX_stock_bf_outlet_id_bf_date_product_id""
                ON stock_bf (outlet_id, bf_date, product_id);
        ");
    }
}
