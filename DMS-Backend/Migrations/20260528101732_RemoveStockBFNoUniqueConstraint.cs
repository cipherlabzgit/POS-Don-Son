using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveStockBFNoUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_stock_bf_bf_no",
                table: "stock_bf");

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_bf_no",
                table: "stock_bf",
                column: "bf_no");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_stock_bf_bf_no",
                table: "stock_bf");

            migrationBuilder.CreateIndex(
                name: "IX_stock_bf_bf_no",
                table: "stock_bf",
                column: "bf_no",
                unique: true);
        }
    }
}
