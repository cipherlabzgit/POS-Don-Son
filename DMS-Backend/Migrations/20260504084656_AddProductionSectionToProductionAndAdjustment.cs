using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionSectionToProductionAndAdjustment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add production_section_id to daily_productions if it doesn't exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'daily_productions' AND column_name = 'production_section_id'
                    ) THEN
                        ALTER TABLE daily_productions ADD COLUMN production_section_id uuid;
                    END IF;
                END $$;
            ");

            // Backfill any NULLs with the first available production section
            migrationBuilder.Sql(@"
                UPDATE daily_productions
                SET production_section_id = (
                    SELECT ""Id"" FROM production_sections
                    WHERE ""IsActive"" = TRUE
                    ORDER BY ""CreatedAt""
                    LIMIT 1
                )
                WHERE production_section_id IS NULL;
            ");

            // Make NOT NULL
            migrationBuilder.Sql(@"
                ALTER TABLE daily_productions ALTER COLUMN production_section_id SET NOT NULL;
            ");

            // Create index if not exists
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_daily_productions_production_section_id""
                ON daily_productions (production_section_id);
            ");

            // Add FK if not exists
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'FK_daily_productions_production_sections_production_section_id'
                    ) THEN
                        ALTER TABLE daily_productions
                        ADD CONSTRAINT ""FK_daily_productions_production_sections_production_section_id""
                        FOREIGN KEY (production_section_id)
                        REFERENCES production_sections (""Id"")
                        ON DELETE RESTRICT;
                    END IF;
                END $$;
            ");

            // Add production_section_id to stock_adjustments if it doesn't exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'stock_adjustments' AND column_name = 'production_section_id'
                    ) THEN
                        ALTER TABLE stock_adjustments ADD COLUMN production_section_id uuid;
                    END IF;
                END $$;
            ");

            // Backfill
            migrationBuilder.Sql(@"
                UPDATE stock_adjustments
                SET production_section_id = (
                    SELECT ""Id"" FROM production_sections
                    WHERE ""IsActive"" = TRUE
                    ORDER BY ""CreatedAt""
                    LIMIT 1
                )
                WHERE production_section_id IS NULL;
            ");

            // Make NOT NULL
            migrationBuilder.Sql(@"
                ALTER TABLE stock_adjustments ALTER COLUMN production_section_id SET NOT NULL;
            ");

            // Create index if not exists
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_stock_adjustments_production_section_id""
                ON stock_adjustments (production_section_id);
            ");

            // Add FK if not exists
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'FK_stock_adjustments_production_sections_production_section_id'
                    ) THEN
                        ALTER TABLE stock_adjustments
                        ADD CONSTRAINT ""FK_stock_adjustments_production_sections_production_section_id""
                        FOREIGN KEY (production_section_id)
                        REFERENCES production_sections (""Id"")
                        ON DELETE RESTRICT;
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE daily_productions
                DROP CONSTRAINT IF EXISTS ""FK_daily_productions_production_sections_production_section_id"";
                DROP INDEX IF EXISTS ""IX_daily_productions_production_section_id"";
                ALTER TABLE daily_productions DROP COLUMN IF EXISTS production_section_id;

                ALTER TABLE stock_adjustments
                DROP CONSTRAINT IF EXISTS ""FK_stock_adjustments_production_sections_production_section_id"";
                DROP INDEX IF EXISTS ""IX_stock_adjustments_production_section_id"";
                ALTER TABLE stock_adjustments DROP COLUMN IF EXISTS production_section_id;
            ");
        }
    }
}
