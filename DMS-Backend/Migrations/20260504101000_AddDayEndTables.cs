using DMS_Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <inheritdoc />
[DbContext(typeof(ApplicationDbContext))]
[Migration("20260504101000_AddDayEndTables")]
public partial class AddDayEndTables : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "cashier_balance_days",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                process_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                is_approved = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_cashier_balance_days", x => x.id);
                table.ForeignKey(
                    name: "FK_cashier_balance_days_users_approved_by_id",
                    column: x => x.approved_by_id,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_cashier_balance_days_approved_by_id",
            table: "cashier_balance_days",
            column: "approved_by_id");

        migrationBuilder.CreateIndex(
            name: "IX_cashier_balance_days_process_date",
            table: "cashier_balance_days",
            column: "process_date",
            unique: true);

        migrationBuilder.CreateTable(
            name: "day_end_outlet_lines",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                process_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                outlet_employee_id = table.Column<Guid>(type: "uuid", nullable: false),
                cashier_balance = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                system_balance = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                created_by_id = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_day_end_outlet_lines", x => x.id);
                table.ForeignKey(
                    name: "FK_day_end_outlet_lines_outlet_employees_outlet_employee_id",
                    column: x => x.outlet_employee_id,
                    principalTable: "outlet_employees",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_day_end_outlet_lines_outlets_outlet_id",
                    column: x => x.outlet_id,
                    principalTable: "outlets",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_day_end_outlet_lines_users_created_by_id",
                    column: x => x.created_by_id,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_day_end_outlet_lines_outlet_employee_id",
            table: "day_end_outlet_lines",
            column: "outlet_employee_id");

        migrationBuilder.CreateIndex(
            name: "IX_day_end_outlet_lines_outlet_id",
            table: "day_end_outlet_lines",
            column: "outlet_id");

        migrationBuilder.CreateIndex(
            name: "IX_day_end_outlet_lines_process_date_outlet_id",
            table: "day_end_outlet_lines",
            columns: new[] { "process_date", "outlet_id" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "day_end_outlet_lines");
        migrationBuilder.DropTable(name: "cashier_balance_days");
    }
}
