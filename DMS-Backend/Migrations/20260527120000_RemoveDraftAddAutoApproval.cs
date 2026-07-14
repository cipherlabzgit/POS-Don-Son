using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDraftAddAutoApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create auto_approval_configs table
            migrationBuilder.CreateTable(
                name: "auto_approval_configs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    subsection_code = table.Column<string>(type: "text", nullable: false),
                    subsection_name = table.Column<string>(type: "text", nullable: false),
                    module = table.Column<string>(type: "text", nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_auto_approval_configs", x => x.id);
                });

            // Create unique index on subsection_code
            migrationBuilder.CreateIndex(
                name: "ix_auto_approval_configs_subsection_code",
                table: "auto_approval_configs",
                column: "subsection_code",
                unique: true);

            // Migrate Draft (0) to Pending status across all entities
            // Daily Production - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE daily_productions SET status = 1 WHERE status = 0;");
            
            // Daily Production Plan - Draft=0, PendingApproval=4
            migrationBuilder.Sql("UPDATE daily_production_plans SET status = 4 WHERE status = 0;");
            
            // Production Cancel - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE production_cancels SET status = 1 WHERE status = 0;");
            
            // Production Plan - Draft=0, Pending=1 (if exists, otherwise Finalized=2)
            migrationBuilder.Sql("UPDATE production_plans SET status = 2 WHERE status = 0;");
            
            // Stores Issue Note - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE stores_issue_notes SET status = 1 WHERE status = 0;");
            
            // Transfer - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE transfers SET status = 1 WHERE status = 0;");
            
            // Delivery - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE deliveries SET status = 1 WHERE status = 0;");
            
            // Delivery Return - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE delivery_returns SET status = 1 WHERE status = 0;");
            
            // Cancellation - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE cancellations SET status = 1 WHERE status = 0;");
            
            // Disposal - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE disposals SET status = 1 WHERE status = 0;");
            
            // Stock Adjustment - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE stock_adjustments SET status = 1 WHERE status = 0;");
            
            // Stock BF - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE stock_bfs SET status = 1 WHERE status = 0;");
            
            // Label Print Request - Draft=0, Pending=1
            migrationBuilder.Sql("UPDATE label_print_requests SET status = 1 WHERE status = 0;");
            
            // String-based status fields
            // Delivery Plan
            migrationBuilder.Sql("UPDATE delivery_plans SET status = 'Pending' WHERE status = 'Draft';");
            
            // Order Header
            migrationBuilder.Sql("UPDATE order_headers SET status = 'Pending' WHERE status = 'Draft';");
            
            // Immediate Order
            migrationBuilder.Sql("UPDATE immediate_orders SET status = 'Pending' WHERE status = 'Draft';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop auto_approval_configs table
            migrationBuilder.DropTable(
                name: "auto_approval_configs");

            // Note: We don't revert the status changes as Draft records have been migrated to Pending
            // Rolling back this migration would require manual intervention if Draft status restoration is needed
        }
    }
}
