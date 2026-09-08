using DMS_Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260908060000_AddCashierBalanceLineCashierName")]
public partial class AddCashierBalanceLineCashierName : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE cashier_balance_outlet_lines
                ADD COLUMN IF NOT EXISTS cashier_name character varying(200) NULL;
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE cashier_balance_outlet_lines
                DROP COLUMN IF EXISTS cashier_name;
        ");
    }
}
