using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <summary>
/// Aligns PostgreSQL <c>delivery_plan_items</c> with <see cref="Models.Entities.DeliveryPlanItem"/>:
/// extra_quantity, is_excluded, weight_variant_id were added to the model but never migrated from InitialCreate.
/// </summary>
public partial class AddDeliveryPlanItemExtraExcludedWeightVariant : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE delivery_plan_items
              ADD COLUMN IF NOT EXISTS extra_quantity numeric(18,4) NOT NULL DEFAULT 0;

            ALTER TABLE delivery_plan_items
              ADD COLUMN IF NOT EXISTS is_excluded boolean NOT NULL DEFAULT false;

            ALTER TABLE delivery_plan_items
              ADD COLUMN IF NOT EXISTS weight_variant_id uuid NULL;
            """);

        migrationBuilder.Sql("""
            CREATE INDEX IF NOT EXISTS "IX_delivery_plan_items_weight_variant_id"
              ON delivery_plan_items (weight_variant_id);
            """);

        migrationBuilder.Sql("""
            DO $EF$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = current_schema() AND table_name = 'product_weight_variants'
              ) AND NOT EXISTS (
                SELECT 1
                FROM pg_constraint c
                JOIN pg_class rel ON rel.oid = c.conrelid
                JOIN pg_namespace ns ON ns.oid = rel.relnamespace
                WHERE ns.nspname = current_schema()
                  AND rel.relname = 'delivery_plan_items'
                  AND c.contype = 'f'
                  AND pg_get_constraintdef(c.oid) ~* 'weight_variant_id'
                  AND pg_get_constraintdef(c.oid) ~* 'product_weight_variants'
              ) THEN
                ALTER TABLE delivery_plan_items
                  ADD CONSTRAINT FK_delivery_plan_items_product_weight_variants_weight_variant_id
                  FOREIGN KEY (weight_variant_id) REFERENCES product_weight_variants ("Id") ON DELETE SET NULL;
              END IF;
            END $EF$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE delivery_plan_items DROP CONSTRAINT IF EXISTS FK_delivery_plan_items_product_weight_variants_weight_variant_id;
            DROP INDEX IF EXISTS "IX_delivery_plan_items_weight_variant_id";
            ALTER TABLE delivery_plan_items DROP COLUMN IF EXISTS weight_variant_id;
            ALTER TABLE delivery_plan_items DROP COLUMN IF EXISTS is_excluded;
            ALTER TABLE delivery_plan_items DROP COLUMN IF EXISTS extra_quantity;
            """);
    }
}
