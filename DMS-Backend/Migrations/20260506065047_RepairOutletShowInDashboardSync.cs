using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class RepairOutletShowInDashboardSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Model expects outlets.show_in_dashboard; some DBs were never migrated. Idempotent for PostgreSQL 9.1+.
            migrationBuilder.Sql(
                """
                DO $EF$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'outlets'
                      AND column_name = 'show_in_dashboard'
                  ) THEN
                    ALTER TABLE outlets ADD COLUMN show_in_dashboard boolean NOT NULL DEFAULT true;
                  END IF;
                END $EF$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE outlets DROP COLUMN IF EXISTS show_in_dashboard;
                """);
        }
    }
}
