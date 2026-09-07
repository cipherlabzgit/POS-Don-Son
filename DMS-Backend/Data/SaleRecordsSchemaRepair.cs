using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

public static class SaleRecordsSchemaRepair
{
    private const string EnsureSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'sale_records_settings'
          ) THEN
            CREATE TABLE sale_records_settings (
              id uuid NOT NULL,
              week_start_day integer NOT NULL DEFAULT 3,
              weeks_to_show integer NOT NULL DEFAULT 2,
              updated_at timestamp with time zone NOT NULL,
              updated_by_id uuid NULL,
              CONSTRAINT pk_sale_records_settings PRIMARY KEY (id)
            );
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM sale_records_settings
            WHERE id = '9a1c0e20-7b44-4d3a-9c11-000000000001'
          ) THEN
            INSERT INTO sale_records_settings (id, week_start_day, weeks_to_show, updated_at)
            VALUES ('9a1c0e20-7b44-4d3a-9c11-000000000001', 3, 2, NOW());
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'cashier_sale_notifications'
          ) THEN
            CREATE TABLE cashier_sale_notifications (
              id uuid NOT NULL,
              process_date timestamp with time zone NOT NULL,
              outlet_id uuid NOT NULL,
              outlet_employee_id uuid NOT NULL,
              cashier_user_id uuid NULL,
              outlet_name character varying(200) NOT NULL,
              showroom_sale numeric(18,4) NOT NULL,
              system_sale numeric(18,4) NOT NULL,
              difference numeric(18,4) NOT NULL,
              notified_at timestamp with time zone NOT NULL,
              notified_by_id uuid NOT NULL,
              is_read boolean NOT NULL DEFAULT FALSE,
              read_at timestamp with time zone NULL,
              CONSTRAINT pk_cashier_sale_notifications PRIMARY KEY (id)
            );
            CREATE UNIQUE INDEX ix_cashier_sale_notifications_date_outlet
              ON cashier_sale_notifications (process_date, outlet_id);
            CREATE INDEX ix_cashier_sale_notifications_cashier
              ON cashier_sale_notifications (cashier_user_id, is_read);
          END IF;
        END
        $EF$;
        """;

    public static Task EnsureSaleRecordsTablesAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
        => db.Database.ExecuteSqlRawAsync(EnsureSql, cancellationToken);
}
