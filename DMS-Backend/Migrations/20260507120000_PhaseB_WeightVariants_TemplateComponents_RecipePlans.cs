using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class PhaseB_WeightVariants_TemplateComponents_RecipePlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Applied directly via SQL — see c:\Temp\phaseB_migration.sql
            // Tables created: product_weight_variants, recipe_template_components,
            //                 recipe_template_ingredients, recipe_plans, recipe_plan_items
            // Column added: delivery_plan_items.weight_variant_id
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE delivery_plan_items DROP COLUMN IF EXISTS weight_variant_id;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS recipe_plan_items;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS recipe_plans;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS recipe_template_ingredients;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS recipe_template_components;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS product_weight_variants;");
        }
    }
}
