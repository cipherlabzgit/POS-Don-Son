using DMS_Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <inheritdoc />
[DbContext(typeof(ApplicationDbContext))]
[Migration("20260506120000_AddCashierBalancePaymentChannels")]
public partial class AddCashierBalancePaymentChannels : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<decimal>(
            name: "balance_cash",
            table: "cashier_balance_outlet_lines",
            type: "numeric(18,4)",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "balance_card",
            table: "cashier_balance_outlet_lines",
            type: "numeric(18,4)",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "balance_uber",
            table: "cashier_balance_outlet_lines",
            type: "numeric(18,4)",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "balance_pickme",
            table: "cashier_balance_outlet_lines",
            type: "numeric(18,4)",
            nullable: true);

        migrationBuilder.Sql(@"
            UPDATE cashier_balance_outlet_lines
            SET balance_cash = cashier_balance
            WHERE balance_cash IS NULL AND cashier_balance IS NOT NULL;
        ");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "balance_pickme", table: "cashier_balance_outlet_lines");
        migrationBuilder.DropColumn(name: "balance_uber", table: "cashier_balance_outlet_lines");
        migrationBuilder.DropColumn(name: "balance_card", table: "cashier_balance_outlet_lines");
        migrationBuilder.DropColumn(name: "balance_cash", table: "cashier_balance_outlet_lines");
    }
}
