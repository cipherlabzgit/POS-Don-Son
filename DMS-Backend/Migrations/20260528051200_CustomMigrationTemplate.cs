using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class CustomMigrationTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Example 1: Add a new column to an existing table
            // migrationBuilder.AddColumn<string>(
            //     name: "new_column",
            //     table: "table_name",
            //     type: "text",
            //     nullable: true);

            // Example 2: Create a new table
            // migrationBuilder.CreateTable(
            //     name: "new_table",
            //     columns: table => new
            //     {
            //         id = table.Column<Guid>(type: "uuid", nullable: false),
            //         name = table.Column<string>(type: "text", nullable: false),
            //         created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            //         updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("pk_new_table", x => x.id);
            //     });

            // Example 3: Create an index
            // migrationBuilder.CreateIndex(
            //     name: "ix_table_column",
            //     table: "table_name",
            //     column: "column_name");

            // Example 4: Execute custom SQL
            // migrationBuilder.Sql("UPDATE table_name SET column_name = 'value' WHERE condition;");

            // Example 5: Add a foreign key
            // migrationBuilder.AddForeignKey(
            //     name: "fk_table_column",
            //     table: "table_name",
            //     column: "foreign_key_column",
            //     principalTable: "referenced_table",
            //     principalColumn: "id",
            //     onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverse the changes made in Up()
            // This allows rolling back the migration if needed
            
            // Example: Drop the column added in Up()
            // migrationBuilder.DropColumn(
            //     name: "new_column",
            //     table: "table_name");

            // Example: Drop the table created in Up()
            // migrationBuilder.DropTable(
            //     name: "new_table");
        }
    }
}
