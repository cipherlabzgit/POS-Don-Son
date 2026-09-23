using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <summary>
/// Adds Show in POS flag on showrooms for POS Transfer destination filtering.
/// Idempotent.
/// </summary>
[Migration("20260923060000_AddOutletShowInPos")]
public partial class AddOutletShowInPos : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $MIG$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = current_schema()
                  AND table_name = 'outlets'
              ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'outlets'
                  AND column_name = 'show_in_pos'
              ) THEN
                ALTER TABLE outlets
                  ADD COLUMN show_in_pos boolean NOT NULL DEFAULT true;
              END IF;
            END
            $MIG$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE outlets DROP COLUMN IF EXISTS show_in_pos;
            """);
    }
}
