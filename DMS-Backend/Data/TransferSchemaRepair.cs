using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// POS transfer submit 500s when EF selects <c>received_by_id</c> / <c>received_at</c>
/// but the live PostgreSQL table never got those columns.
/// </summary>
public static class TransferSchemaRepair
{
    private const string EnsureReceivedBySql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'transfers'
          ) THEN
            RETURN;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'transfers'
              AND column_name = 'received_by_id'
          ) THEN
            ALTER TABLE transfers ADD COLUMN received_by_id uuid NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'transfers'
              AND column_name = 'received_at'
          ) THEN
            ALTER TABLE transfers ADD COLUMN received_at timestamp with time zone NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'ix_transfers_received_by_id'
          ) THEN
            CREATE INDEX ix_transfers_received_by_id ON transfers (received_by_id);
          END IF;
        END
        $EF$;
        """;

    public static Task EnsureTransferColumnsAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
        => db.Database.ExecuteSqlRawAsync(EnsureReceivedBySql, cancellationToken);
}
