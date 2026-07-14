using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class PhaseA_ProductType_DayOffsets_StoresItemBreakdown2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── order_headers: production/delivery timing (previously pending) ──
            migrationBuilder.AddColumn<DateTime>(
                name: "delivery_date",
                table: "order_headers",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "delivery_time",
                table: "order_headers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "production_start_date",
                table: "order_headers",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "production_start_time",
                table: "order_headers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "recipe_request_number",
                table: "order_headers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            // ── GAP 1: ProductType — enforce non-null with default "Finished" ──
            migrationBuilder.Sql(@"
                UPDATE ""products"" SET ""ProductType"" = 'Finished' WHERE ""ProductType"" IS NULL;
            ");
            migrationBuilder.AlterColumn<string>(
                name: "ProductType",
                table: "products",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Finished",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            // ── GAP 1: DeliveryTurnSectionTiming — table was never added in InitialCreate; PhaseA
            // previously only ALTERed it, which fails on fresh databases. Create idempotently, then
            // ensure offset columns exist for older partial DBs.
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS delivery_turn_section_timings (
    ""Id"" uuid NOT NULL,
    ""IsActive"" boolean NOT NULL DEFAULT TRUE,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NOT NULL,
    ""CreatedById"" uuid NULL,
    ""UpdatedById"" uuid NULL,
    delivery_turn_id uuid NOT NULL,
    production_section_id uuid NOT NULL,
    production_start_time interval NULL,
    effective_delivery_time interval NULL,
    production_day_offset integer NOT NULL DEFAULT 0,
    delivery_day_offset integer NOT NULL DEFAULT 0,
    CONSTRAINT ""PK_delivery_turn_section_timings"" PRIMARY KEY (""Id"")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delivery_turn_section_timings' AND column_name = 'production_day_offset'
  ) THEN
    ALTER TABLE delivery_turn_section_timings ADD COLUMN production_day_offset integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delivery_turn_section_timings' AND column_name = 'delivery_day_offset'
  ) THEN
    ALTER TABLE delivery_turn_section_timings ADD COLUMN delivery_day_offset integer NOT NULL DEFAULT 0;
  END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $EF$
BEGIN
  ALTER TABLE delivery_turn_section_timings ADD CONSTRAINT ""FK_delivery_turn_section_timings_delivery_turns_delivery_turn_id"" FOREIGN KEY (delivery_turn_id) REFERENCES delivery_turns (""Id"") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $EF$;

DO $EF$
BEGIN
  ALTER TABLE delivery_turn_section_timings ADD CONSTRAINT ""FK_delivery_turn_section_timings_production_sections_production_section_id"" FOREIGN KEY (production_section_id) REFERENCES production_sections (""Id"") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $EF$;

DO $EF$
BEGIN
  ALTER TABLE delivery_turn_section_timings ADD CONSTRAINT ""FK_delivery_turn_section_timings_users_CreatedById"" FOREIGN KEY (""CreatedById"") REFERENCES users (""Id"");
EXCEPTION WHEN duplicate_object THEN NULL;
END $EF$;

DO $EF$
BEGIN
  ALTER TABLE delivery_turn_section_timings ADD CONSTRAINT ""FK_delivery_turn_section_timings_users_UpdatedById"" FOREIGN KEY (""UpdatedById"") REFERENCES users (""Id"");
EXCEPTION WHEN duplicate_object THEN NULL;
END $EF$;
");

            migrationBuilder.Sql(@"
CREATE INDEX IF NOT EXISTS ""IX_delivery_turn_section_timings_CreatedById"" ON delivery_turn_section_timings (""CreatedById"");
CREATE INDEX IF NOT EXISTS ""IX_delivery_turn_section_timings_delivery_turn_id"" ON delivery_turn_section_timings (delivery_turn_id);
CREATE INDEX IF NOT EXISTS ""IX_delivery_turn_section_timings_production_section_id"" ON delivery_turn_section_timings (production_section_id);
CREATE INDEX IF NOT EXISTS ""IX_delivery_turn_section_timings_UpdatedById"" ON delivery_turn_section_timings (""UpdatedById"");
");

            // ── GAP 4: StoresIssueNoteItem product/component breakdown ──
            // Remove unique constraint so same ingredient can appear multiple times per note (once per product)
            migrationBuilder.DropIndex(
                name: "IX_stores_issue_note_items_StoresIssueNoteId_IngredientId",
                table: "stores_issue_note_items");

            migrationBuilder.AddColumn<Guid>(
                name: "product_id",
                table: "stores_issue_note_items",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "recipe_component_id",
                table: "stores_issue_note_items",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_note_items_StoresIssueNoteId_IngredientId",
                table: "stores_issue_note_items",
                columns: new[] { "StoresIssueNoteId", "IngredientId" });

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_note_items_product_id",
                table: "stores_issue_note_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_note_items_recipe_component_id",
                table: "stores_issue_note_items",
                column: "recipe_component_id");

            migrationBuilder.AddForeignKey(
                name: "FK_stores_issue_note_items_products_product_id",
                table: "stores_issue_note_items",
                column: "product_id",
                principalTable: "products",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_stores_issue_note_items_recipe_components_recipe_component_id",
                table: "stores_issue_note_items",
                column: "recipe_component_id",
                principalTable: "recipe_components",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ── Reverse StoresIssueNoteItem breakdown ──
            migrationBuilder.DropForeignKey(
                name: "FK_stores_issue_note_items_products_product_id",
                table: "stores_issue_note_items");

            migrationBuilder.DropForeignKey(
                name: "FK_stores_issue_note_items_recipe_components_recipe_component_id",
                table: "stores_issue_note_items");

            migrationBuilder.DropIndex(
                name: "IX_stores_issue_note_items_product_id",
                table: "stores_issue_note_items");

            migrationBuilder.DropIndex(
                name: "IX_stores_issue_note_items_recipe_component_id",
                table: "stores_issue_note_items");

            migrationBuilder.DropIndex(
                name: "IX_stores_issue_note_items_StoresIssueNoteId_IngredientId",
                table: "stores_issue_note_items");

            migrationBuilder.DropColumn(name: "product_id", table: "stores_issue_note_items");
            migrationBuilder.DropColumn(name: "recipe_component_id", table: "stores_issue_note_items");

            migrationBuilder.CreateIndex(
                name: "IX_stores_issue_note_items_StoresIssueNoteId_IngredientId",
                table: "stores_issue_note_items",
                columns: new[] { "StoresIssueNoteId", "IngredientId" },
                unique: true);

            // ── Reverse DeliveryTurnSectionTiming day offsets ──
            migrationBuilder.DropColumn(name: "production_day_offset", table: "delivery_turn_section_timings");
            migrationBuilder.DropColumn(name: "delivery_day_offset", table: "delivery_turn_section_timings");

            // ── Reverse ProductType nullability ──
            migrationBuilder.AlterColumn<string>(
                name: "ProductType",
                table: "products",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldDefaultValue: "Finished");

            // ── Reverse order_headers columns ──
            migrationBuilder.DropColumn(name: "delivery_date", table: "order_headers");
            migrationBuilder.DropColumn(name: "delivery_time", table: "order_headers");
            migrationBuilder.DropColumn(name: "production_start_date", table: "order_headers");
            migrationBuilder.DropColumn(name: "production_start_time", table: "order_headers");
            migrationBuilder.DropColumn(name: "recipe_request_number", table: "order_headers");
        }
    }
}
