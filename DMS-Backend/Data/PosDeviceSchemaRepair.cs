using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// Super Admin header polls GET /api/pos-devices/status. That query 500s when
/// <c>pos_device_agents</c> was never created (migration drift on live DBs).
/// </summary>
public static class PosDeviceSchemaRepair
{
    private const string EnsurePosDeviceAgentsSql =
        """
        DO $EF$
        BEGIN
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
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'IX_pos_device_agents_device_id'
          ) THEN
            CREATE UNIQUE INDEX "IX_pos_device_agents_device_id"
              ON pos_device_agents (device_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'IX_pos_device_agents_outlet_id'
          ) THEN
            CREATE INDEX "IX_pos_device_agents_outlet_id"
              ON pos_device_agents (outlet_id);
          END IF;
        END
        $EF$;
        """;

    public static Task EnsurePosDeviceAgentsTableAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
        => db.Database.ExecuteSqlRawAsync(EnsurePosDeviceAgentsSql, cancellationToken);
}
