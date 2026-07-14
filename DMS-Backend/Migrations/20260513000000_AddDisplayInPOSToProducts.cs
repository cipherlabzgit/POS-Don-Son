using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDisplayInPOSToProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use idempotent approach with existence check
            migrationBuilder.Sql(@"
                DO $EF$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'products'
                          AND column_name = 'DisplayInPOS'
                    ) THEN
                        ALTER TABLE products ADD COLUMN ""DisplayInPOS"" boolean NOT NULL DEFAULT true;
                    END IF;
                    
                    -- Ensure all existing products have DisplayInPOS = true
                    UPDATE products SET ""DisplayInPOS"" = true WHERE ""DisplayInPOS"" IS NULL OR ""DisplayInPOS"" = false;
                END $EF$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayInPOS",
                table: "products");
        }
    }
}
