using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// Idempotent PostgreSQL repairs for <c>immediate_orders</c> columns required by
/// <see cref="Models.Entities.ImmediateOrder"/> scheduling fields.
/// Mirrors <c>20260509210000_AddImmediateOrderSchedulingFields</c> when migrations lag or drift.
/// </summary>
public static class ImmediateOrderSchemaRepair
{
    private const string EnsureSchedulingColumnsSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'immediate_orders'
          ) THEN
            RETURN;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'order_bill_no'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN order_bill_no character varying(50) NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'delivery_date'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN delivery_date date NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'delivery_time'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN delivery_time character varying(20) NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'production_start_date'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN production_start_date date NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'production_start_time'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN production_start_time character varying(20) NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'recipe_request_number'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN recipe_request_number character varying(100) NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'need_by_time'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN need_by_time character varying(20) NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'is_customized'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN is_customized boolean NOT NULL DEFAULT false;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'immediate_orders'
              AND column_name = 'customization_notes'
          ) THEN
            ALTER TABLE immediate_orders
              ADD COLUMN customization_notes character varying(1000) NULL;
          END IF;
        END $EF$;
        """;

    /// <summary>
    /// Same backfill as the scheduling migration for legacy rows missing values.
    /// </summary>
    private const string BackfillSchedulingFieldsSql =
        """
        UPDATE immediate_orders
        SET delivery_date = (order_date AT TIME ZONE 'UTC')::date,
            delivery_time = COALESCE(delivery_time, '10:00'),
            production_start_date = (order_date AT TIME ZONE 'UTC')::date,
            production_start_time = COALESCE(production_start_time, '08:00'),
            recipe_request_number = COALESCE(recipe_request_number, ''),
            need_by_time = COALESCE(NULLIF(trim(need_by_time), ''), '12:00')
        WHERE delivery_date IS NULL OR recipe_request_number IS NULL;
        """;

    public static async Task EnsureImmediateOrderSchedulingColumnsAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlRawAsync(EnsureSchedulingColumnsSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(BackfillSchedulingFieldsSql, cancellationToken);
    }
}
