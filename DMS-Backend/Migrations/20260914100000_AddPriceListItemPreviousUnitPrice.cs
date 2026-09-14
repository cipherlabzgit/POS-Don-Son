using DMS_Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260914100000_AddPriceListItemPreviousUnitPrice")]
public partial class AddPriceListItemPreviousUnitPrice : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE price_list_items
                ADD COLUMN IF NOT EXISTS previous_unit_price numeric(18,2) NOT NULL DEFAULT 0;
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE price_list_items DROP COLUMN IF EXISTS previous_unit_price;
        ");
    }
}
