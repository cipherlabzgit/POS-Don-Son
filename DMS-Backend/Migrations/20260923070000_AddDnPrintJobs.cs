using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <summary>
/// Hybrid DN print queue for WPF DN Print Client.
/// Idempotent.
/// </summary>
[Migration("20260923070000_AddDnPrintJobs")]
public partial class AddDnPrintJobs : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $MIG$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = current_schema()
                  AND table_name = 'dn_print_jobs'
              ) THEN
                CREATE TABLE dn_print_jobs (
                  "Id" uuid NOT NULL,
                  delivery_id uuid NOT NULL,
                  delivery_no character varying(50) NOT NULL DEFAULT '',
                  status integer NOT NULL DEFAULT 0,
                  station_code character varying(50) NULL,
                  claimed_by_station character varying(50) NULL,
                  claimed_at timestamp with time zone NULL,
                  printed_at timestamp with time zone NULL,
                  requested_by_name character varying(150) NOT NULL DEFAULT '',
                  requested_by_user_id uuid NULL,
                  payload_json text NOT NULL DEFAULT '{}',
                  error_message character varying(500) NULL,
                  "IsActive" boolean NOT NULL DEFAULT true,
                  "CreatedAt" timestamp with time zone NOT NULL,
                  "UpdatedAt" timestamp with time zone NOT NULL,
                  "CreatedById" uuid NULL,
                  "UpdatedById" uuid NULL,
                  CONSTRAINT "PK_dn_print_jobs" PRIMARY KEY ("Id"),
                  CONSTRAINT "FK_dn_print_jobs_deliveries_delivery_id"
                    FOREIGN KEY (delivery_id) REFERENCES deliveries ("Id") ON DELETE CASCADE
                );
                CREATE INDEX "IX_dn_print_jobs_delivery_id" ON dn_print_jobs (delivery_id);
                CREATE INDEX "IX_dn_print_jobs_status_created" ON dn_print_jobs (status, "CreatedAt");
              END IF;
            END
            $MIG$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""DROP TABLE IF EXISTS dn_print_jobs;""");
    }
}
