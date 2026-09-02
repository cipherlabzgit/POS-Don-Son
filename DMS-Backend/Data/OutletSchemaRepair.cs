using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// Live DBs often have EF history ahead of actual DDL. Login loads Outlet and
/// 500s if <c>pos_verification_code</c> is missing.
/// </summary>
public static class OutletSchemaRepair
{
    private const string EnsurePosVerificationCodeSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'outlets'
          ) THEN
            RETURN;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'outlets'
              AND column_name = 'pos_verification_code'
          ) THEN
            ALTER TABLE outlets
              ADD COLUMN pos_verification_code character varying(40);
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'outlets'
              AND column_name = 'pos_verification_code'
          ) AND NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'ix_outlets_pos_verification_code'
          ) THEN
            CREATE UNIQUE INDEX ix_outlets_pos_verification_code
              ON outlets (lower(pos_verification_code))
              WHERE pos_verification_code IS NOT NULL
                AND btrim(pos_verification_code) <> '';
          END IF;
        END
        $EF$;
        """;

    public static Task EnsureOutletColumnsAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
        => db.Database.ExecuteSqlRawAsync(EnsurePosVerificationCodeSql, cancellationToken);
}
