using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

[Migration("20260923080000_AddDnPrintAgents")]
public partial class AddDnPrintAgents : Migration
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
                  AND table_name = 'dn_print_agents'
              ) THEN
                CREATE TABLE dn_print_agents (
                  "Id" uuid NOT NULL,
                  station_code character varying(50) NOT NULL,
                  machine_name character varying(120) NULL,
                  printer_name character varying(200) NULL,
                  ip_address character varying(64) NULL,
                  last_heartbeat_at timestamp with time zone NOT NULL,
                  app_version character varying(40) NULL,
                  "IsActive" boolean NOT NULL DEFAULT true,
                  "CreatedAt" timestamp with time zone NOT NULL,
                  "UpdatedAt" timestamp with time zone NOT NULL,
                  "CreatedById" uuid NULL,
                  "UpdatedById" uuid NULL,
                  CONSTRAINT "PK_dn_print_agents" PRIMARY KEY ("Id")
                );
                CREATE UNIQUE INDEX "IX_dn_print_agents_station_code"
                  ON dn_print_agents (station_code);
              END IF;
            END
            $MIG$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""DROP TABLE IF EXISTS dn_print_agents;""");
    }
}
