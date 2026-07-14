using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPosSalesTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pos_sales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    sale_no = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    sold_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    payment_method = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    client_mutation_id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    outlet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pos_sales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pos_sales_outlets_outlet_id",
                        column: x => x.outlet_id,
                        principalTable: "outlets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pos_sales_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_pos_sales_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "pos_sale_lines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    pos_sale_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    line_total = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pos_sale_lines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pos_sale_lines_pos_sales_pos_sale_id",
                        column: x => x.pos_sale_id,
                        principalTable: "pos_sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_pos_sale_lines_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pos_sale_lines_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_pos_sale_lines_users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_pos_sale_lines_CreatedById",
                table: "pos_sale_lines",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_pos_sale_lines_pos_sale_id",
                table: "pos_sale_lines",
                column: "pos_sale_id");

            migrationBuilder.CreateIndex(
                name: "IX_pos_sale_lines_product_id",
                table: "pos_sale_lines",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_pos_sale_lines_UpdatedById",
                table: "pos_sale_lines",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_pos_sales_client_mutation_id",
                table: "pos_sales",
                column: "client_mutation_id",
                unique: true,
                filter: "client_mutation_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_pos_sales_CreatedById",
                table: "pos_sales",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_pos_sales_outlet_id",
                table: "pos_sales",
                column: "outlet_id");

            migrationBuilder.CreateIndex(
                name: "IX_pos_sales_sale_no",
                table: "pos_sales",
                column: "sale_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pos_sales_sold_at",
                table: "pos_sales",
                column: "sold_at");

            migrationBuilder.CreateIndex(
                name: "IX_pos_sales_UpdatedById",
                table: "pos_sales",
                column: "UpdatedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pos_sale_lines");

            migrationBuilder.DropTable(
                name: "pos_sales");
        }
    }
}
