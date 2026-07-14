using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryColorsToPosThemeConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $EF$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'pos_theme_configs' 
                                   AND column_name = 'category_colors') THEN
                        ALTER TABLE pos_theme_configs ADD COLUMN category_colors jsonb;
                    END IF;
                END $EF$;
            ");

            // Set default category colors for existing themes
            migrationBuilder.Sql(@"
                UPDATE pos_theme_configs 
                SET category_colors = '[""#ffd100"",""#c8102e"",""#16a34a"",""#1d4ed8"",""#9333ea"",""#ea580c"",""#db2777"",""#0891b2""]'::jsonb
                WHERE category_colors IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE pos_theme_configs DROP COLUMN IF EXISTS category_colors;
            ");
        }
    }
}
