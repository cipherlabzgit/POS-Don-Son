using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <inheritdoc />
public class PosSaleOutletMutationIndex : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_pos_sales_client_mutation_id",
            table: "pos_sales");

        migrationBuilder.CreateIndex(
            name: "IX_pos_sales_outlet_id_client_mutation_id",
            table: "pos_sales",
            columns: new[] { "outlet_id", "client_mutation_id" },
            unique: true,
            filter: "client_mutation_id IS NOT NULL");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_pos_sales_outlet_id_client_mutation_id",
            table: "pos_sales");

        migrationBuilder.CreateIndex(
            name: "IX_pos_sales_client_mutation_id",
            table: "pos_sales",
            column: "client_mutation_id",
            unique: true,
            filter: "client_mutation_id IS NOT NULL");
    }
}
