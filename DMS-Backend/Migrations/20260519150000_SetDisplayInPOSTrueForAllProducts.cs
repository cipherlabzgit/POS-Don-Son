using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class SetDisplayInPOSTrueForAllProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Set all existing products to DisplayInPOS = true so they appear in POS terminals
            migrationBuilder.Sql(@"
                UPDATE products 
                SET ""DisplayInPOS"" = true 
                WHERE ""DisplayInPOS"" = false OR ""DisplayInPOS"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No need to revert - this is a data fix
        }
    }
}
