using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class PhaseC_OperationApproval_ProductSectionFK_DeliveryPlanRecipePlanFK_IngredientStockAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Applied directly via SQL — see c:\Temp\phaseC_migration.sql
            // Tables created: operation_approvals
            // Columns added: products.production_section_id,
            //                delivery_plans.recipe_plan_id,
            //                ingredients.reorder_threshold,
            //                ingredients.low_stock_alert_enabled,
            //                ingredients.low_stock_threshold
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS operation_approvals;");
            migrationBuilder.Sql("ALTER TABLE ingredients DROP COLUMN IF EXISTS low_stock_threshold;");
            migrationBuilder.Sql("ALTER TABLE ingredients DROP COLUMN IF EXISTS low_stock_alert_enabled;");
            migrationBuilder.Sql("ALTER TABLE ingredients DROP COLUMN IF EXISTS reorder_threshold;");
            migrationBuilder.Sql("ALTER TABLE delivery_plans DROP COLUMN IF EXISTS recipe_plan_id;");
            migrationBuilder.Sql("ALTER TABLE products DROP COLUMN IF EXISTS production_section_id;");
        }
    }
}
