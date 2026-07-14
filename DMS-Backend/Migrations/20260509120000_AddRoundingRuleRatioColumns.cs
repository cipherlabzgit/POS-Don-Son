using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <inheritdoc />
public partial class AddRoundingRuleRatioColumns : Migration
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
                  AND table_name = 'rounding_rules'
                  AND column_name = 'ratio_base_quantity'
              ) THEN
                ALTER TABLE rounding_rules
                  ADD COLUMN ratio_base_quantity numeric(18,6) NULL;
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
                  AND table_name = 'rounding_rules'
                  AND column_name = 'ratio_yield_quantity'
              ) THEN
                ALTER TABLE rounding_rules
                  ADD COLUMN ratio_yield_quantity numeric(18,6) NULL;
              END IF;
            END $EF$;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("ALTER TABLE rounding_rules DROP COLUMN IF EXISTS ratio_yield_quantity;");
        migrationBuilder.Sql("ALTER TABLE rounding_rules DROP COLUMN IF EXISTS ratio_base_quantity;");
    }
}
