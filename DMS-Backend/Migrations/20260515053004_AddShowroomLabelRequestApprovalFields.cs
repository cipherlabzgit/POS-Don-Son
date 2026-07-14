using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddShowroomLabelRequestApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use raw SQL with existence checks to avoid conflicts with manual schema changes
            migrationBuilder.Sql(@"
                -- Add client_mutation_id to stock_bf if not exists
                DO $EF$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'stock_bf' 
                                   AND column_name = 'client_mutation_id') THEN
                        ALTER TABLE stock_bf ADD COLUMN client_mutation_id character varying(80);
                    END IF;
                END $EF$;
            ");

            // Add ShowroomLabelRequest approval fields if not exists
            migrationBuilder.Sql(@"
                DO $EF$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'showroom_label_requests' 
                                   AND column_name = 'display_no') THEN
                        ALTER TABLE showroom_label_requests ADD COLUMN display_no character varying(50) NOT NULL DEFAULT '';
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'showroom_label_requests' 
                                   AND column_name = 'approved_by_id') THEN
                        ALTER TABLE showroom_label_requests ADD COLUMN approved_by_id uuid;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'showroom_label_requests' 
                                   AND column_name = 'approved_date') THEN
                        ALTER TABLE showroom_label_requests ADD COLUMN approved_date timestamp with time zone;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'showroom_label_requests' 
                                   AND column_name = 'rejected_by_id') THEN
                        ALTER TABLE showroom_label_requests ADD COLUMN rejected_by_id uuid;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'showroom_label_requests' 
                                   AND column_name = 'rejected_date') THEN
                        ALTER TABLE showroom_label_requests ADD COLUMN rejected_date timestamp with time zone;
                    END IF;
                END $EF$;
            ");

            // Add other missing columns with existence checks
            migrationBuilder.Sql(@"
                DO $EF$
                BEGIN
                    -- rounding_rules
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'rounding_rules' 
                                   AND column_name = 'ratio_base_quantity') THEN
                        ALTER TABLE rounding_rules ADD COLUMN ratio_base_quantity numeric(18,6);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'rounding_rules' 
                                   AND column_name = 'ratio_yield_quantity') THEN
                        ALTER TABLE rounding_rules ADD COLUMN ratio_yield_quantity numeric(18,6);
                    END IF;
                    
                    -- products
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'products' 
                                   AND column_name = 'DisplayInPOS') THEN
                        ALTER TABLE products ADD COLUMN ""DisplayInPOS"" boolean NOT NULL DEFAULT false;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'products' 
                                   AND column_name = 'LabelTemplateId') THEN
                        ALTER TABLE products ADD COLUMN ""LabelTemplateId"" uuid;
                    END IF;
                    
                    -- outlet_employees
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_schema = current_schema() 
                               AND table_name = 'outlet_employees' 
                               AND column_name = 'user_id' 
                               AND is_nullable = 'NO') THEN
                        ALTER TABLE outlet_employees ALTER COLUMN user_id DROP NOT NULL;
                    END IF;
                    
                    -- immediate_orders
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'immediate_orders' 
                                   AND column_name = 'delivery_date') THEN
                        ALTER TABLE immediate_orders ADD COLUMN delivery_date date;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'immediate_orders' 
                                   AND column_name = 'delivery_time') THEN
                        ALTER TABLE immediate_orders ADD COLUMN delivery_time character varying(20);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'immediate_orders' 
                                   AND column_name = 'need_by_date') THEN
                        ALTER TABLE immediate_orders ADD COLUMN need_by_date timestamp with time zone;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'immediate_orders' 
                                   AND column_name = 'need_by_time') THEN
                        ALTER TABLE immediate_orders ADD COLUMN need_by_time character varying(20);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'immediate_orders' 
                                   AND column_name = 'order_bill_no') THEN
                        ALTER TABLE immediate_orders ADD COLUMN order_bill_no character varying(50);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'immediate_orders' 
                                   AND column_name = 'production_start_date') THEN
                        ALTER TABLE immediate_orders ADD COLUMN production_start_date date;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'immediate_orders' 
                                   AND column_name = 'production_start_time') THEN
                        ALTER TABLE immediate_orders ADD COLUMN production_start_time character varying(20);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'immediate_orders' 
                                   AND column_name = 'recipe_request_number') THEN
                        ALTER TABLE immediate_orders ADD COLUMN recipe_request_number character varying(100);
                    END IF;
                    
                    -- delivery_plan_items
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'delivery_plan_items' 
                                   AND column_name = 'is_excluded') THEN
                        ALTER TABLE delivery_plan_items ADD COLUMN is_excluded boolean NOT NULL DEFAULT false;
                    END IF;
                    
                    -- day_types
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'day_types' 
                                   AND column_name = 'applicable_days') THEN
                        ALTER TABLE day_types ADD COLUMN applicable_days character varying(20);
                    END IF;
                END $EF$;
            ");

            // Create tables if not exists
            migrationBuilder.Sql(@"
                DO $EF$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'pos_theme_configs') THEN
                        CREATE TABLE pos_theme_configs (
                            ""Id"" uuid NOT NULL,
                            theme_name character varying(100) NOT NULL,
                            description character varying(500),
                            primary_color character varying(7) NOT NULL,
                            primary_light character varying(7),
                            primary_dark character varying(7),
                            accent_color character varying(7) NOT NULL,
                            accent_light character varying(7),
                            accent_dark character varying(7),
                            is_active boolean NOT NULL,
                            is_system boolean NOT NULL,
                            display_order integer NOT NULL,
                            ""CreatedAt"" timestamp with time zone NOT NULL,
                            ""UpdatedAt"" timestamp with time zone NOT NULL,
                            ""CreatedById"" uuid,
                            ""UpdatedById"" uuid,
                            CONSTRAINT ""PK_pos_theme_configs"" PRIMARY KEY (""Id""),
                            CONSTRAINT ""FK_pos_theme_configs_users_CreatedById"" FOREIGN KEY (""CreatedById"") REFERENCES users (""Id""),
                            CONSTRAINT ""FK_pos_theme_configs_users_UpdatedById"" FOREIGN KEY (""UpdatedById"") REFERENCES users (""Id"")
                        );
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                                   WHERE table_schema = current_schema() 
                                   AND table_name = 'product_section_assignments') THEN
                        CREATE TABLE product_section_assignments (
                            id uuid NOT NULL,
                            product_id uuid NOT NULL,
                            production_section_id uuid NOT NULL,
                            role character varying(100),
                            sort_order integer NOT NULL DEFAULT 0,
                            CONSTRAINT ""PK_product_section_assignments"" PRIMARY KEY (id),
                            CONSTRAINT ""FK_product_section_assignments_production_sections_production_~"" 
                                FOREIGN KEY (production_section_id) REFERENCES production_sections (""Id"") ON DELETE CASCADE,
                            CONSTRAINT ""FK_product_section_assignments_products_product_id"" 
                                FOREIGN KEY (product_id) REFERENCES products (""Id"") ON DELETE CASCADE
                        );
                    END IF;
                END $EF$;
            ");

            // Create indexes if not exists
            migrationBuilder.Sql(@"
                DO $EF$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'showroom_label_requests' AND indexname = 'IX_showroom_label_requests_approved_by_id') THEN
                        CREATE INDEX ""IX_showroom_label_requests_approved_by_id"" ON showroom_label_requests (approved_by_id);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'showroom_label_requests' AND indexname = 'IX_showroom_label_requests_display_no') THEN
                        CREATE UNIQUE INDEX ""IX_showroom_label_requests_display_no"" ON showroom_label_requests (display_no);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'showroom_label_requests' AND indexname = 'IX_showroom_label_requests_rejected_by_id') THEN
                        CREATE INDEX ""IX_showroom_label_requests_rejected_by_id"" ON showroom_label_requests (rejected_by_id);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'showroom_label_requests' AND indexname = 'IX_showroom_label_requests_request_date') THEN
                        CREATE INDEX ""IX_showroom_label_requests_request_date"" ON showroom_label_requests (request_date);
                    END IF;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_schema = current_schema() 
                               AND table_name = 'showroom_label_requests' 
                               AND column_name = 'status') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                       AND tablename = 'showroom_label_requests' AND indexname = 'IX_showroom_label_requests_status') THEN
                            CREATE INDEX ""IX_showroom_label_requests_status"" ON showroom_label_requests (status);
                        END IF;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'products' AND indexname = 'IX_products_LabelTemplateId') THEN
                        CREATE INDEX ""IX_products_LabelTemplateId"" ON products (""LabelTemplateId"");
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'pos_theme_configs' AND indexname = 'IX_pos_theme_configs_CreatedById') THEN
                        CREATE INDEX ""IX_pos_theme_configs_CreatedById"" ON pos_theme_configs (""CreatedById"");
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'pos_theme_configs' AND indexname = 'IX_pos_theme_configs_UpdatedById') THEN
                        CREATE INDEX ""IX_pos_theme_configs_UpdatedById"" ON pos_theme_configs (""UpdatedById"");
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'product_section_assignments' AND indexname = 'IX_product_section_assignments_product_id_production_section_id') THEN
                        CREATE UNIQUE INDEX ""IX_product_section_assignments_product_id_production_section_id"" 
                            ON product_section_assignments (product_id, production_section_id);
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() 
                                   AND tablename = 'product_section_assignments' AND indexname = 'IX_product_section_assignments_production_section_id') THEN
                        CREATE INDEX ""IX_product_section_assignments_production_section_id"" 
                            ON product_section_assignments (production_section_id);
                    END IF;
                END $EF$;
            ");

            // Add foreign keys if not exists
            migrationBuilder.Sql(@"
                DO $EF$
                BEGIN
                    -- Drop and recreate foreign keys to update delete behavior
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                               WHERE constraint_schema = current_schema() 
                               AND constraint_name = 'FK_daily_productions_production_sections_production_section_id') THEN
                        ALTER TABLE daily_productions 
                            DROP CONSTRAINT ""FK_daily_productions_production_sections_production_section_id"";
                    END IF;
                    
                    ALTER TABLE daily_productions 
                        ADD CONSTRAINT ""FK_daily_productions_production_sections_production_section_id"" 
                        FOREIGN KEY (production_section_id) REFERENCES production_sections (""Id"") ON DELETE RESTRICT;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                               WHERE constraint_schema = current_schema() 
                               AND constraint_name = 'FK_outlet_employees_users_user_id') THEN
                        ALTER TABLE outlet_employees 
                            DROP CONSTRAINT ""FK_outlet_employees_users_user_id"";
                    END IF;
                    
                    ALTER TABLE outlet_employees 
                        ADD CONSTRAINT ""FK_outlet_employees_users_user_id"" 
                        FOREIGN KEY (user_id) REFERENCES users (""Id"");
                    
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                               WHERE constraint_schema = current_schema() 
                               AND constraint_name = 'FK_showroom_label_requests_outlets_outlet_id') THEN
                        ALTER TABLE showroom_label_requests 
                            DROP CONSTRAINT ""FK_showroom_label_requests_outlets_outlet_id"";
                    END IF;
                    
                    ALTER TABLE showroom_label_requests 
                        ADD CONSTRAINT ""FK_showroom_label_requests_outlets_outlet_id"" 
                        FOREIGN KEY (outlet_id) REFERENCES outlets (""Id"") ON DELETE RESTRICT;
                    
                    -- Add new foreign keys if they don't exist
                    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                   WHERE constraint_schema = current_schema() 
                                   AND constraint_name = 'FK_products_label_templates_LabelTemplateId') THEN
                        ALTER TABLE products 
                            ADD CONSTRAINT ""FK_products_label_templates_LabelTemplateId"" 
                            FOREIGN KEY (""LabelTemplateId"") REFERENCES label_templates (""Id"") ON DELETE SET NULL;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                   WHERE constraint_schema = current_schema() 
                                   AND constraint_name = 'FK_showroom_label_requests_users_approved_by_id') THEN
                        ALTER TABLE showroom_label_requests 
                            ADD CONSTRAINT ""FK_showroom_label_requests_users_approved_by_id"" 
                            FOREIGN KEY (approved_by_id) REFERENCES users (""Id"") ON DELETE SET NULL;
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                   WHERE constraint_schema = current_schema() 
                                   AND constraint_name = 'FK_showroom_label_requests_users_rejected_by_id') THEN
                        ALTER TABLE showroom_label_requests 
                            ADD CONSTRAINT ""FK_showroom_label_requests_users_rejected_by_id"" 
                            FOREIGN KEY (rejected_by_id) REFERENCES users (""Id"") ON DELETE SET NULL;
                    END IF;
                END $EF$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_daily_productions_production_sections_production_section_id",
                table: "daily_productions");

            migrationBuilder.DropForeignKey(
                name: "FK_outlet_employees_users_user_id",
                table: "outlet_employees");

            migrationBuilder.DropForeignKey(
                name: "FK_products_label_templates_LabelTemplateId",
                table: "products");

            migrationBuilder.DropForeignKey(
                name: "FK_showroom_label_requests_outlets_outlet_id",
                table: "showroom_label_requests");

            migrationBuilder.DropForeignKey(
                name: "FK_showroom_label_requests_users_approved_by_id",
                table: "showroom_label_requests");

            migrationBuilder.DropForeignKey(
                name: "FK_showroom_label_requests_users_rejected_by_id",
                table: "showroom_label_requests");

            migrationBuilder.DropTable(
                name: "pos_theme_configs");

            migrationBuilder.DropTable(
                name: "product_section_assignments");

            migrationBuilder.DropIndex(
                name: "IX_showroom_label_requests_approved_by_id",
                table: "showroom_label_requests");

            migrationBuilder.DropIndex(
                name: "IX_showroom_label_requests_display_no",
                table: "showroom_label_requests");

            migrationBuilder.DropIndex(
                name: "IX_showroom_label_requests_rejected_by_id",
                table: "showroom_label_requests");

            migrationBuilder.DropIndex(
                name: "IX_showroom_label_requests_request_date",
                table: "showroom_label_requests");

            migrationBuilder.DropIndex(
                name: "IX_showroom_label_requests_status",
                table: "showroom_label_requests");

            migrationBuilder.DropIndex(
                name: "IX_products_LabelTemplateId",
                table: "products");

            migrationBuilder.DropColumn(
                name: "client_mutation_id",
                table: "stock_bf");

            migrationBuilder.DropColumn(
                name: "approved_by_id",
                table: "showroom_label_requests");

            migrationBuilder.DropColumn(
                name: "approved_date",
                table: "showroom_label_requests");

            migrationBuilder.DropColumn(
                name: "display_no",
                table: "showroom_label_requests");

            migrationBuilder.DropColumn(
                name: "rejected_by_id",
                table: "showroom_label_requests");

            migrationBuilder.DropColumn(
                name: "rejected_date",
                table: "showroom_label_requests");

            migrationBuilder.DropColumn(
                name: "ratio_base_quantity",
                table: "rounding_rules");

            migrationBuilder.DropColumn(
                name: "ratio_yield_quantity",
                table: "rounding_rules");

            migrationBuilder.DropColumn(
                name: "DisplayInPOS",
                table: "products");

            migrationBuilder.DropColumn(
                name: "LabelTemplateId",
                table: "products");

            migrationBuilder.DropColumn(
                name: "delivery_date",
                table: "immediate_orders");

            migrationBuilder.DropColumn(
                name: "delivery_time",
                table: "immediate_orders");

            migrationBuilder.DropColumn(
                name: "need_by_date",
                table: "immediate_orders");

            migrationBuilder.DropColumn(
                name: "need_by_time",
                table: "immediate_orders");

            migrationBuilder.DropColumn(
                name: "order_bill_no",
                table: "immediate_orders");

            migrationBuilder.DropColumn(
                name: "production_start_date",
                table: "immediate_orders");

            migrationBuilder.DropColumn(
                name: "production_start_time",
                table: "immediate_orders");

            migrationBuilder.DropColumn(
                name: "recipe_request_number",
                table: "immediate_orders");

            migrationBuilder.DropColumn(
                name: "is_excluded",
                table: "delivery_plan_items");

            migrationBuilder.DropColumn(
                name: "applicable_days",
                table: "day_types");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "showroom_label_requests",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "showroom_label_requests",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "showroom_label_requests",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<Guid>(
                name: "user_id",
                table: "outlet_employees",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_daily_productions_production_sections_production_section_id",
                table: "daily_productions",
                column: "production_section_id",
                principalTable: "production_sections",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_outlet_employees_users_user_id",
                table: "outlet_employees",
                column: "user_id",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_showroom_label_requests_outlets_outlet_id",
                table: "showroom_label_requests",
                column: "outlet_id",
                principalTable: "outlets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
