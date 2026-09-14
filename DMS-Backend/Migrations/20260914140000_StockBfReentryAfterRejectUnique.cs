using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <summary>
/// Re-apply filtered unique index so a new Stock BF can be submitted after reject.
/// Safe to run if the Sep 8 migration already applied.
/// </summary>
[Migration("20260914140000_StockBfReentryAfterRejectUnique")]
public partial class StockBfReentryAfterRejectUnique : Migration
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
                ON stock_bf (outlet_id, bf_date, product_id)
                WHERE is_active AND status <> 'Rejected';
        ");
    }
}
