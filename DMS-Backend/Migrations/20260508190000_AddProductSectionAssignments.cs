using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProductSectionAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS product_section_assignments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                    production_section_id UUID NOT NULL REFERENCES production_sections(id) ON DELETE CASCADE,
                    role VARCHAR(100) NULL,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    CONSTRAINT uq_product_section UNIQUE (product_id, production_section_id)
                );

                CREATE INDEX IF NOT EXISTS ix_product_section_assignments_product_id
                    ON product_section_assignments (product_id);

                CREATE INDEX IF NOT EXISTS ix_product_section_assignments_section_id
                    ON product_section_assignments (production_section_id);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS product_section_assignments;");
        }
    }
}
