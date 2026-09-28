using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// <c>20260923090000_AddRemoteClientAgents</c> has no EF Designer, so MigrateAsync
/// can skip it. The header then calls GET /api/pos-devices/status and 500s because
/// <c>pos_device_agents</c> does not exist.
/// </summary>
public static class PosDeviceSchemaRepair
{
    private const string EnsureSql =
        """
        DO $EF$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'dn_print_agents'
          ) THEN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema() AND table_name = 'dn_print_agents' AND column_name = 'pending_command'
            ) THEN
              ALTER TABLE dn_print_agents ADD COLUMN pending_command integer NOT NULL DEFAULT 0;
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema() AND table_name = 'dn_print_agents' AND column_name = 'last_checked_at'
            ) THEN
              ALTER TABLE dn_print_agents ADD COLUMN last_checked_at timestamp with time zone NULL;
            END IF;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'label_print_agents'
          ) THEN
            CREATE TABLE label_print_agents (
              "Id" uuid NOT NULL,
              station_code character varying(50) NOT NULL,
              machine_name character varying(120) NULL,
              printer_name character varying(200) NULL,
              ip_address character varying(64) NULL,
              last_heartbeat_at timestamp with time zone NOT NULL,
              app_version character varying(40) NULL,
              pending_command integer NOT NULL DEFAULT 0,
              last_checked_at timestamp with time zone NULL,
              "IsActive" boolean NOT NULL DEFAULT true,
              "CreatedAt" timestamp with time zone NOT NULL,
              "UpdatedAt" timestamp with time zone NOT NULL,
              "CreatedById" uuid NULL,
              "UpdatedById" uuid NULL,
              CONSTRAINT "PK_label_print_agents" PRIMARY KEY ("Id")
            );
            CREATE UNIQUE INDEX "IX_label_print_agents_station_code" ON label_print_agents (station_code);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'pos_device_agents'
          ) THEN
            CREATE TABLE pos_device_agents (
              "Id" uuid NOT NULL,
              device_id character varying(80) NOT NULL,
              outlet_id uuid NULL,
              outlet_name character varying(100) NULL,
              device_name character varying(120) NULL,
              machine_name character varying(120) NULL,
              ip_address character varying(64) NULL,
              last_heartbeat_at timestamp with time zone NOT NULL,
              app_version character varying(40) NULL,
              pending_command integer NOT NULL DEFAULT 0,
              last_checked_at timestamp with time zone NULL,
              "IsActive" boolean NOT NULL DEFAULT true,
              "CreatedAt" timestamp with time zone NOT NULL,
              "UpdatedAt" timestamp with time zone NOT NULL,
              "CreatedById" uuid NULL,
              "UpdatedById" uuid NULL,
              CONSTRAINT "PK_pos_device_agents" PRIMARY KEY ("Id")
            );
            CREATE UNIQUE INDEX "IX_pos_device_agents_device_id" ON pos_device_agents (device_id);
            CREATE INDEX "IX_pos_device_agents_outlet_id" ON pos_device_agents (outlet_id);
          END IF;
        END
        $EF$;
        """;

    public static Task EnsurePosDeviceTablesAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
        => db.Database.ExecuteSqlRawAsync(EnsureSql, cancellationToken);
}
