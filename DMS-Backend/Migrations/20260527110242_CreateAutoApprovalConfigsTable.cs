using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class CreateAutoApprovalConfigsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create AutoApprovalConfigs table
            migrationBuilder.CreateTable(
                name: "AutoApprovalConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubsectionCode = table.Column<string>(type: "text", nullable: false),
                    SubsectionName = table.Column<string>(type: "text", nullable: false),
                    Module = table.Column<string>(type: "text", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AutoApprovalConfigs", x => x.Id);
                });

            // Create index for faster lookups
            migrationBuilder.CreateIndex(
                name: "IX_AutoApprovalConfigs_SubsectionCode",
                table: "AutoApprovalConfigs",
                column: "SubsectionCode");

            // Note: Status migration from Draft to Pending is optional and can be done manually if needed
            // See DATABASE_MIGRATION_INSTRUCTIONS.md for manual migration script
            // The AutoApprovalConfigSeeder will populate the table data on application startup
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AutoApprovalConfigs");

            // Note: Status changes are not reversed in Down migration
            // as reverting Pending back to Draft would cause issues with the new workflow
        }
    }
}
