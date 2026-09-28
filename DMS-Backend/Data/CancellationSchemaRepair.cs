using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// Delivery Cancellation no longer collects Delivery No / Delivered Date.
/// Live DBs still have those columns as NOT NULL, which 500s on create.
/// </summary>
public static class CancellationSchemaRepair
{
    private const string EnsureOptionalDeliveryFieldsSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'cancellations'
          ) THEN
            RETURN;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'cancellations'
              AND column_name = 'delivery_no'
              AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE cancellations ALTER COLUMN delivery_no DROP NOT NULL;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'cancellations'
              AND column_name = 'delivered_date'
              AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE cancellations ALTER COLUMN delivered_date DROP NOT NULL;
          END IF;
        END
        $EF$;
        """;

    public static Task EnsureCancellationDeliveryFieldsOptionalAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
        => db.Database.ExecuteSqlRawAsync(EnsureOptionalDeliveryFieldsSql, cancellationToken);
}
