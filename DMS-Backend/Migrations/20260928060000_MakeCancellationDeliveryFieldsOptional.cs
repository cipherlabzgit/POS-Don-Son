using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

[Migration("20260928060000_MakeCancellationDeliveryFieldsOptional")]
public partial class MakeCancellationDeliveryFieldsOptional : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $MIG$
            BEGIN
              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'cancellations'
                  AND column_name = 'delivery_no'
                  AND is_nullable = 'NO'
              ) THEN
                ALTER TABLE cancellations ALTER COLUMN delivery_no DROP NOT NULL;
              END IF;

              IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'cancellations'
                  AND column_name = 'delivered_date'
                  AND is_nullable = 'NO'
              ) THEN
                ALTER TABLE cancellations ALTER COLUMN delivered_date DROP NOT NULL;
              END IF;
            END
            $MIG$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE cancellations SET delivery_no = '' WHERE delivery_no IS NULL;
            UPDATE cancellations SET delivered_date = TIMESTAMPTZ '1970-01-01 00:00:00+00' WHERE delivered_date IS NULL;
            ALTER TABLE cancellations ALTER COLUMN delivery_no SET NOT NULL;
            ALTER TABLE cancellations ALTER COLUMN delivered_date SET NOT NULL;
            """);
    }
}
