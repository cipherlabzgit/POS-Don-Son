using DMS_Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <inheritdoc />
[DbContext(typeof(ApplicationDbContext))]
[Migration("20260505180000_AddLabelPrintersAndComments")]
public partial class AddLabelPrintersAndComments : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "label_printers",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                sort_order = table.Column<int>(type: "integer", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_label_printers", x => x.Id);
                table.ForeignKey(
                    name: "FK_label_printers_users_CreatedById",
                    column: x => x.CreatedById,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_label_printers_users_UpdatedById",
                    column: x => x.UpdatedById,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_label_printers_CreatedById",
            table: "label_printers",
            column: "CreatedById");

        migrationBuilder.CreateIndex(
            name: "IX_label_printers_UpdatedById",
            table: "label_printers",
            column: "UpdatedById");

        migrationBuilder.CreateTable(
            name: "label_printing_comments",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                comment_text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                sort_order = table.Column<int>(type: "integer", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_label_printing_comments", x => x.Id);
                table.ForeignKey(
                    name: "FK_label_printing_comments_users_CreatedById",
                    column: x => x.CreatedById,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_label_printing_comments_users_UpdatedById",
                    column: x => x.UpdatedById,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_label_printing_comments_CreatedById",
            table: "label_printing_comments",
            column: "CreatedById");

        migrationBuilder.CreateIndex(
            name: "IX_label_printing_comments_UpdatedById",
            table: "label_printing_comments",
            column: "UpdatedById");

        migrationBuilder.AddColumn<Guid>(
            name: "label_printer_id",
            table: "label_templates",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_label_templates_label_printer_id",
            table: "label_templates",
            column: "label_printer_id");

        migrationBuilder.AddForeignKey(
            name: "FK_label_templates_label_printers_label_printer_id",
            table: "label_templates",
            column: "label_printer_id",
            principalTable: "label_printers",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_label_templates_label_printers_label_printer_id",
            table: "label_templates");

        migrationBuilder.DropIndex(
            name: "IX_label_templates_label_printer_id",
            table: "label_templates");

        migrationBuilder.DropColumn(
            name: "label_printer_id",
            table: "label_templates");

        migrationBuilder.DropTable(name: "label_printing_comments");
        migrationBuilder.DropTable(name: "label_printers");
    }
}
