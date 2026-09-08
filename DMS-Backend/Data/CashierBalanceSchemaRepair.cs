using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// Live client DBs often have EF history ahead of DDL. Cash Submission loads
/// <c>cashier_balance_outlet_lines</c> and 500s if <c>cashier_name</c> is missing.
/// </summary>
public static class CashierBalanceSchemaRepair
{
    private const string EnsureCashierNameSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'cashier_balance_outlet_lines'
          ) THEN
            RETURN;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'cashier_balance_outlet_lines'
              AND column_name = 'cashier_name'
          ) THEN
            ALTER TABLE cashier_balance_outlet_lines
              ADD COLUMN cashier_name character varying(200) NULL;
          END IF;
        END
        $EF$;
        """;

    public static Task EnsureCashierBalanceColumnsAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
        => db.Database.ExecuteSqlRawAsync(EnsureCashierNameSql, cancellationToken);
}
