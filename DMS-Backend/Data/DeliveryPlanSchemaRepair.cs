using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// Idempotent PostgreSQL repairs for <c>delivery_plan_items</c> columns required by
/// <see cref="Models.Entities.DeliveryPlanItem"/> but missing from older databases.
/// Mirrors <c>20260509180000_AddDeliveryPlanItemExtraExcludedWeightVariant</c>.
/// </summary>
public static class DeliveryPlanSchemaRepair
{
    private const string EnsureDeliveryPlanItemColumnsSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'delivery_plan_items'
          ) THEN
            RETURN;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'delivery_plan_items'
              AND column_name = 'extra_quantity'
          ) THEN
            ALTER TABLE delivery_plan_items
              ADD COLUMN extra_quantity numeric(18,4) NOT NULL DEFAULT 0;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'delivery_plan_items'
              AND column_name = 'is_excluded'
          ) THEN
            ALTER TABLE delivery_plan_items
              ADD COLUMN is_excluded boolean NOT NULL DEFAULT false;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'delivery_plan_items'
              AND column_name = 'weight_variant_id'
          ) THEN
            ALTER TABLE delivery_plan_items
              ADD COLUMN weight_variant_id uuid NULL;
          END IF;
        END $EF$;
        """;

    private const string EnsureDeliveryPlanItemWeightVariantIndexSql =
        """
        CREATE INDEX IF NOT EXISTS "IX_delivery_plan_items_weight_variant_id"
          ON delivery_plan_items (weight_variant_id);
        """;

    private const string EnsureDeliveryPlanItemWeightVariantFkSql =
        """
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
        """;

    public static async Task EnsureDeliveryPlanItemColumnsAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlRawAsync(EnsureDeliveryPlanItemColumnsSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureDeliveryPlanItemWeightVariantIndexSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureDeliveryPlanItemWeightVariantFkSql, cancellationToken);
    }
}
