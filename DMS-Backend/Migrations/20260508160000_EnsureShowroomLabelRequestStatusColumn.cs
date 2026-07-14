using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Ensures status columns used by operation approvals exist when migrations were skipped or partially applied.
    /// Fixes Npgsql 42703 (e.g. column s.status does not exist on showroom_label_requests or pos_sales).
    /// </summary>
    public partial class EnsureShowroomLabelRequestStatusColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $EF$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'showroom_label_requests'
                      AND column_name = 'status'
                  ) THEN
                    ALTER TABLE showroom_label_requests
                      ADD COLUMN status character varying(20) NOT NULL DEFAULT 'Pending';
                  END IF;
                END $EF$;
                """);

            migrationBuilder.Sql(
                """
                DO $EF$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'pos_sales'
                      AND column_name = 'status'
                  ) THEN
                    ALTER TABLE pos_sales
                      ADD COLUMN status character varying(32) NOT NULL DEFAULT 'Pending';
                  END IF;
                END $EF$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE showroom_label_requests DROP COLUMN IF EXISTS status;
                """);
        }
    }
}
