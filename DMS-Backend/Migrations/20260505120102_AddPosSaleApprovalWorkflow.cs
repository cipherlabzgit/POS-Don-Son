using Microsoft.EntityFrameworkCore.Migrations;

namespace DMS_Backend.Migrations;

/// <inheritdoc />
public partial class AddPosSaleApprovalWorkflow : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "status",
            table: "pos_sales",
            type: "character varying(32)",
            maxLength: 32,
            nullable: true);

        migrationBuilder.Sql("UPDATE pos_sales SET status = 'Approved' WHERE status IS NULL");

        migrationBuilder.AlterColumn<string>(
            name: "status",
            table: "pos_sales",
            type: "character varying(32)",
            maxLength: 32,
            nullable: false,
            defaultValue: "Pending");

        migrationBuilder.AddColumn<Guid>(
            name: "approved_by_id",
            table: "pos_sales",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "approved_at",
            table: "pos_sales",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "rejected_by_id",
            table: "pos_sales",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "rejected_at",
            table: "pos_sales",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "rejection_reason",
            table: "pos_sales",
            type: "character varying(500)",
            maxLength: 500,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_pos_sales_approved_by_id",
            table: "pos_sales",
            column: "approved_by_id");

        migrationBuilder.CreateIndex(
            name: "IX_pos_sales_rejected_by_id",
            table: "pos_sales",
            column: "rejected_by_id");

        migrationBuilder.CreateIndex(
            name: "IX_pos_sales_status",
            table: "pos_sales",
            column: "status");

        migrationBuilder.AddForeignKey(
            name: "FK_pos_sales_users_approved_by_id",
            table: "pos_sales",
            column: "approved_by_id",
            principalTable: "users",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_pos_sales_users_rejected_by_id",
            table: "pos_sales",
            column: "rejected_by_id",
            principalTable: "users",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_pos_sales_users_rejected_by_id",
            table: "pos_sales");

        migrationBuilder.DropForeignKey(
            name: "FK_pos_sales_users_approved_by_id",
            table: "pos_sales");

        migrationBuilder.DropIndex(
            name: "IX_pos_sales_status",
            table: "pos_sales");

        migrationBuilder.DropIndex(
            name: "IX_pos_sales_rejected_by_id",
            table: "pos_sales");

        migrationBuilder.DropIndex(
            name: "IX_pos_sales_approved_by_id",
            table: "pos_sales");

        migrationBuilder.DropColumn(
            name: "rejection_reason",
            table: "pos_sales");

        migrationBuilder.DropColumn(
            name: "rejected_at",
            table: "pos_sales");

        migrationBuilder.DropColumn(
            name: "rejected_by_id",
            table: "pos_sales");

        migrationBuilder.DropColumn(
            name: "approved_at",
            table: "pos_sales");

        migrationBuilder.DropColumn(
            name: "approved_by_id",
            table: "pos_sales");

        migrationBuilder.DropColumn(
            name: "status",
            table: "pos_sales");
    }
}
