using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    public partial class AddCustomOrderRequestFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $EF$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'order_headers'
                      AND column_name = 'delivery_date'
                  ) THEN
                    ALTER TABLE order_headers
                      ADD COLUMN delivery_date date NOT NULL DEFAULT CURRENT_DATE;
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
                      AND table_name = 'order_headers'
                      AND column_name = 'delivery_time'
                  ) THEN
                    ALTER TABLE order_headers
                      ADD COLUMN delivery_time character varying(20) NOT NULL DEFAULT '';
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
                      AND table_name = 'order_headers'
                      AND column_name = 'production_start_date'
                  ) THEN
                    ALTER TABLE order_headers
                      ADD COLUMN production_start_date date NOT NULL DEFAULT CURRENT_DATE;
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
                      AND table_name = 'order_headers'
                      AND column_name = 'production_start_time'
                  ) THEN
                    ALTER TABLE order_headers
                      ADD COLUMN production_start_time character varying(20) NOT NULL DEFAULT '';
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
                      AND table_name = 'order_headers'
                      AND column_name = 'recipe_request_number'
                  ) THEN
                    ALTER TABLE order_headers
                      ADD COLUMN recipe_request_number character varying(100);
                  END IF;
                END $EF$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE order_headers DROP COLUMN IF EXISTS recipe_request_number;");
            migrationBuilder.Sql("ALTER TABLE order_headers DROP COLUMN IF EXISTS production_start_time;");
            migrationBuilder.Sql("ALTER TABLE order_headers DROP COLUMN IF EXISTS production_start_date;");
            migrationBuilder.Sql("ALTER TABLE order_headers DROP COLUMN IF EXISTS delivery_time;");
            migrationBuilder.Sql("ALTER TABLE order_headers DROP COLUMN IF EXISTS delivery_date;");
        }
    }
}
