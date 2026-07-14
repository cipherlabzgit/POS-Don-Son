using DMS_Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <inheritdoc />
[DbContext(typeof(ApplicationDbContext))]
[Migration("20260505140000_AddCashierBalanceOutletLines")]
public partial class AddCashierBalanceOutletLines : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "is_submitted",
            table: "cashier_balance_days",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "submitted_at",
            table: "cashier_balance_days",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "submitted_by_id",
            table: "cashier_balance_days",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_cashier_balance_days_submitted_by_id",
            table: "cashier_balance_days",
            column: "submitted_by_id");

        migrationBuilder.AddForeignKey(
            name: "FK_cashier_balance_days_users_submitted_by_id",
            table: "cashier_balance_days",
            column: "submitted_by_id",
            principalTable: "users",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        migrationBuilder.CreateTable(
            name: "cashier_balance_outlet_lines",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                process_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                is_showroom_closed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                outlet_employee_id = table.Column<Guid>(type: "uuid", nullable: true),
                cashier_balance = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_cashier_balance_outlet_lines", x => x.id);
                table.ForeignKey(
                    name: "FK_cashier_balance_outlet_lines_outlet_employees_outlet_employee_id",
                    column: x => x.outlet_employee_id,
                    principalTable: "outlet_employees",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_cashier_balance_outlet_lines_outlets_outlet_id",
                    column: x => x.outlet_id,
                    principalTable: "outlets",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_cashier_balance_outlet_lines_outlet_employee_id",
            table: "cashier_balance_outlet_lines",
            column: "outlet_employee_id");

        migrationBuilder.CreateIndex(
            name: "IX_cashier_balance_outlet_lines_outlet_id",
            table: "cashier_balance_outlet_lines",
            column: "outlet_id");

        migrationBuilder.CreateIndex(
            name: "IX_cashier_balance_outlet_lines_process_date_outlet_id",
            table: "cashier_balance_outlet_lines",
            columns: new[] { "process_date", "outlet_id" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "cashier_balance_outlet_lines");

        migrationBuilder.DropForeignKey(
            name: "FK_cashier_balance_days_users_submitted_by_id",
            table: "cashier_balance_days");

        migrationBuilder.DropIndex(
            name: "IX_cashier_balance_days_submitted_by_id",
            table: "cashier_balance_days");

        migrationBuilder.DropColumn(name: "is_submitted", table: "cashier_balance_days");
        migrationBuilder.DropColumn(name: "submitted_at", table: "cashier_balance_days");
        migrationBuilder.DropColumn(name: "submitted_by_id", table: "cashier_balance_days");
    }
}
