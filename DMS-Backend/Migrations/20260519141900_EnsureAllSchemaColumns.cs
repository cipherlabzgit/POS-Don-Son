using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Comprehensive migration to ensure all schema columns exist.
    /// This migration is idempotent and safe to run multiple times.
    /// Addresses schema drift where entity properties exist but database columns are missing.
    /// </summary>
    public partial class EnsureAllSchemaColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================================
            // 1. POS Theme Config - Category Colors
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    -- Ensure pos_theme_configs table exists
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'pos_theme_configs'
                    ) THEN
                        -- Add category_colors column if missing
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'pos_theme_configs'
                              AND column_name = 'category_colors'
                        ) THEN
                            ALTER TABLE pos_theme_configs 
                              ADD COLUMN category_colors jsonb;
                            
                            -- Set default category colors
                            UPDATE pos_theme_configs 
                            SET category_colors = '[""#ffd100"",""#c8102e"",""#16a34a"",""#1d4ed8"",""#9333ea"",""#ea580c"",""#db2777"",""#0891b2""]'::jsonb
                            WHERE category_colors IS NULL;
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 2. Showroom Label Requests - Status & Approval Fields
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'showroom_label_requests'
                    ) THEN
                        -- Add status column
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'showroom_label_requests'
                              AND column_name = 'status'
                        ) THEN
                            ALTER TABLE showroom_label_requests
                              ADD COLUMN status character varying(20) NOT NULL DEFAULT 'Pending';
                        END IF;
                        
                        -- Add display_no column
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'showroom_label_requests'
                              AND column_name = 'display_no'
                        ) THEN
                            ALTER TABLE showroom_label_requests 
                              ADD COLUMN display_no character varying(50) NOT NULL DEFAULT '';
                        END IF;
                        
                        -- Add approval columns
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'showroom_label_requests'
                              AND column_name = 'approved_by_id'
                        ) THEN
                            ALTER TABLE showroom_label_requests ADD COLUMN approved_by_id uuid;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'showroom_label_requests'
                              AND column_name = 'approved_date'
                        ) THEN
                            ALTER TABLE showroom_label_requests ADD COLUMN approved_date timestamp with time zone;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'showroom_label_requests'
                              AND column_name = 'rejected_by_id'
                        ) THEN
                            ALTER TABLE showroom_label_requests ADD COLUMN rejected_by_id uuid;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'showroom_label_requests'
                              AND column_name = 'rejected_date'
                        ) THEN
                            ALTER TABLE showroom_label_requests ADD COLUMN rejected_date timestamp with time zone;
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 3. POS Sales - Status & Approval Workflow
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'pos_sales'
                    ) THEN
                        -- Add status column
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'pos_sales'
                              AND column_name = 'status'
                        ) THEN
                            ALTER TABLE pos_sales
                              ADD COLUMN status character varying(32) NOT NULL DEFAULT 'Approved';
                        END IF;
                        
                        -- Add approval workflow columns
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'pos_sales'
                              AND column_name = 'approved_by_id'
                        ) THEN
                            ALTER TABLE pos_sales ADD COLUMN approved_by_id uuid;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'pos_sales'
                              AND column_name = 'approved_at'
                        ) THEN
                            ALTER TABLE pos_sales ADD COLUMN approved_at timestamp with time zone;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'pos_sales'
                              AND column_name = 'rejected_by_id'
                        ) THEN
                            ALTER TABLE pos_sales ADD COLUMN rejected_by_id uuid;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'pos_sales'
                              AND column_name = 'rejected_at'
                        ) THEN
                            ALTER TABLE pos_sales ADD COLUMN rejected_at timestamp with time zone;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'pos_sales'
                              AND column_name = 'rejection_reason'
                        ) THEN
                            ALTER TABLE pos_sales ADD COLUMN rejection_reason character varying(500);
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 4. Products - Weight, Standard Quantity, Display in POS, Label Template
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'products'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'products'
                              AND column_name = 'WeightGrams'
                        ) THEN
                            ALTER TABLE products ADD COLUMN ""WeightGrams"" numeric(18,4) NULL;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'products'
                              AND column_name = 'StandardQuantity'
                        ) THEN
                            ALTER TABLE products ADD COLUMN ""StandardQuantity"" numeric(18,4) NULL;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'products'
                              AND column_name = 'DisplayInPOS'
                        ) THEN
                            ALTER TABLE products ADD COLUMN ""DisplayInPOS"" boolean NOT NULL DEFAULT false;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'products'
                              AND column_name = 'LabelTemplateId'
                        ) THEN
                            ALTER TABLE products ADD COLUMN ""LabelTemplateId"" uuid;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'products'
                              AND column_name = 'production_section_id'
                        ) THEN
                            ALTER TABLE products ADD COLUMN production_section_id uuid;
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 5. Ingredients - Stock Alerts & Extra Quantity
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'ingredients'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'ingredients'
                              AND column_name = 'reorder_threshold'
                        ) THEN
                            ALTER TABLE ingredients ADD COLUMN reorder_threshold numeric(18,4) NULL;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'ingredients'
                              AND column_name = 'low_stock_alert_enabled'
                        ) THEN
                            ALTER TABLE ingredients ADD COLUMN low_stock_alert_enabled boolean NOT NULL DEFAULT false;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'ingredients'
                              AND column_name = 'low_stock_threshold'
                        ) THEN
                            ALTER TABLE ingredients ADD COLUMN low_stock_threshold numeric(18,4) NULL;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'ingredients'
                              AND column_name = 'AllowExtraQty'
                        ) THEN
                            ALTER TABLE ingredients ADD COLUMN ""AllowExtraQty"" boolean NOT NULL DEFAULT false;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'ingredients'
                              AND column_name = 'ExtraQtyNote'
                        ) THEN
                            ALTER TABLE ingredients ADD COLUMN ""ExtraQtyNote"" character varying(500) NULL;
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 6. Delivery Plan Items - Extra Quantity, Is Excluded, Weight Variant
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'delivery_plan_items'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'delivery_plan_items'
                              AND column_name = 'extra_quantity'
                        ) THEN
                            ALTER TABLE delivery_plan_items ADD COLUMN extra_quantity numeric(18,4) NOT NULL DEFAULT 0;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'delivery_plan_items'
                              AND column_name = 'is_excluded'
                        ) THEN
                            ALTER TABLE delivery_plan_items ADD COLUMN is_excluded boolean NOT NULL DEFAULT false;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'delivery_plan_items'
                              AND column_name = 'weight_variant_id'
                        ) THEN
                            ALTER TABLE delivery_plan_items ADD COLUMN weight_variant_id uuid;
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 7. Immediate Orders - Scheduling Fields
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'immediate_orders'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'delivery_date'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN delivery_date date;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'delivery_time'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN delivery_time character varying(20);
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'need_by_date'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN need_by_date timestamp with time zone;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'need_by_time'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN need_by_time character varying(20);
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'order_bill_no'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN order_bill_no character varying(50);
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'production_start_date'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN production_start_date date;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'production_start_time'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN production_start_time character varying(20);
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'recipe_request_number'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN recipe_request_number character varying(100);
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'is_customized'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN is_customized boolean NOT NULL DEFAULT false;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'immediate_orders'
                              AND column_name = 'customization_notes'
                        ) THEN
                            ALTER TABLE immediate_orders ADD COLUMN customization_notes character varying(1000);
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 8. Delivery Plans - Recipe Plan ID
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'delivery_plans'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'delivery_plans'
                              AND column_name = 'recipe_plan_id'
                        ) THEN
                            ALTER TABLE delivery_plans ADD COLUMN recipe_plan_id uuid;
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 9. Rounding Rules - Ratio Columns
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'rounding_rules'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'rounding_rules'
                              AND column_name = 'ratio_base_quantity'
                        ) THEN
                            ALTER TABLE rounding_rules ADD COLUMN ratio_base_quantity numeric(18,6);
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'rounding_rules'
                              AND column_name = 'ratio_yield_quantity'
                        ) THEN
                            ALTER TABLE rounding_rules ADD COLUMN ratio_yield_quantity numeric(18,6);
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 10. Stock BF - Client Mutation ID
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'stock_bf'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'stock_bf'
                              AND column_name = 'client_mutation_id'
                        ) THEN
                            ALTER TABLE stock_bf ADD COLUMN client_mutation_id character varying(80);
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 11. Day Types - Applicable Days
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'day_types'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'day_types'
                              AND column_name = 'applicable_days'
                        ) THEN
                            ALTER TABLE day_types ADD COLUMN applicable_days character varying(20);
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 12. Outlet Employees - User ID Nullable
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = current_schema()
                          AND table_name = 'outlet_employees'
                    ) THEN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_schema = current_schema()
                              AND table_name = 'outlet_employees'
                              AND column_name = 'user_id'
                              AND is_nullable = 'NO'
                        ) THEN
                            ALTER TABLE outlet_employees ALTER COLUMN user_id DROP NOT NULL;
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 13. Create Required Indexes
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    -- Showroom label requests indexes
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'showroom_label_requests' AND column_name = 'status') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'showroom_label_requests' 
                                       AND indexname = 'IX_showroom_label_requests_status') THEN
                            CREATE INDEX ""IX_showroom_label_requests_status"" ON showroom_label_requests (status);
                        END IF;
                    END IF;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'showroom_label_requests' AND column_name = 'approved_by_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'showroom_label_requests' 
                                       AND indexname = 'IX_showroom_label_requests_approved_by_id') THEN
                            CREATE INDEX ""IX_showroom_label_requests_approved_by_id"" ON showroom_label_requests (approved_by_id);
                        END IF;
                    END IF;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'showroom_label_requests' AND column_name = 'rejected_by_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'showroom_label_requests' 
                                       AND indexname = 'IX_showroom_label_requests_rejected_by_id') THEN
                            CREATE INDEX ""IX_showroom_label_requests_rejected_by_id"" ON showroom_label_requests (rejected_by_id);
                        END IF;
                    END IF;
                    
                    -- POS sales indexes
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'pos_sales' AND column_name = 'status') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'pos_sales' 
                                       AND indexname = 'IX_pos_sales_status') THEN
                            CREATE INDEX ""IX_pos_sales_status"" ON pos_sales (status);
                        END IF;
                    END IF;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'pos_sales' AND column_name = 'approved_by_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'pos_sales' 
                                       AND indexname = 'IX_pos_sales_approved_by_id') THEN
                            CREATE INDEX ""IX_pos_sales_approved_by_id"" ON pos_sales (approved_by_id);
                        END IF;
                    END IF;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'pos_sales' AND column_name = 'rejected_by_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'pos_sales' 
                                       AND indexname = 'IX_pos_sales_rejected_by_id') THEN
                            CREATE INDEX ""IX_pos_sales_rejected_by_id"" ON pos_sales (rejected_by_id);
                        END IF;
                    END IF;
                    
                    -- Products LabelTemplateId index
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'products' AND column_name = 'LabelTemplateId') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' 
                                       AND indexname = 'IX_products_LabelTemplateId') THEN
                            CREATE INDEX ""IX_products_LabelTemplateId"" ON products (""LabelTemplateId"");
                        END IF;
                    END IF;
                    
                    -- Products production_section_id index
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'products' AND column_name = 'production_section_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' 
                                       AND indexname = 'IX_products_production_section_id') THEN
                            CREATE INDEX ""IX_products_production_section_id"" ON products (production_section_id);
                        END IF;
                    END IF;
                END $REPAIR$;
            ");

            // =========================================================================
            // 14. Create Required Foreign Keys
            // =========================================================================
            migrationBuilder.Sql(@"
                DO $REPAIR$
                BEGIN
                    -- Showroom label requests foreign keys
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'showroom_label_requests' AND column_name = 'approved_by_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                       WHERE constraint_name = 'FK_showroom_label_requests_users_approved_by_id') THEN
                            ALTER TABLE showroom_label_requests
                              ADD CONSTRAINT ""FK_showroom_label_requests_users_approved_by_id""
                              FOREIGN KEY (approved_by_id) REFERENCES users (""Id"") ON DELETE SET NULL;
                        END IF;
                    END IF;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'showroom_label_requests' AND column_name = 'rejected_by_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                       WHERE constraint_name = 'FK_showroom_label_requests_users_rejected_by_id') THEN
                            ALTER TABLE showroom_label_requests
                              ADD CONSTRAINT ""FK_showroom_label_requests_users_rejected_by_id""
                              FOREIGN KEY (rejected_by_id) REFERENCES users (""Id"") ON DELETE SET NULL;
                        END IF;
                    END IF;
                    
                    -- POS sales foreign keys
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'pos_sales' AND column_name = 'approved_by_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                       WHERE constraint_name = 'FK_pos_sales_users_approved_by_id') THEN
                            ALTER TABLE pos_sales
                              ADD CONSTRAINT ""FK_pos_sales_users_approved_by_id""
                              FOREIGN KEY (approved_by_id) REFERENCES users (""Id"") ON DELETE RESTRICT;
                        END IF;
                    END IF;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'pos_sales' AND column_name = 'rejected_by_id') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                       WHERE constraint_name = 'FK_pos_sales_users_rejected_by_id') THEN
                            ALTER TABLE pos_sales
                              ADD CONSTRAINT ""FK_pos_sales_users_rejected_by_id""
                              FOREIGN KEY (rejected_by_id) REFERENCES users (""Id"") ON DELETE RESTRICT;
                        END IF;
                    END IF;
                    
                    -- Products LabelTemplateId foreign key
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'products' AND column_name = 'LabelTemplateId')
                       AND EXISTS (SELECT 1 FROM information_schema.tables
                                   WHERE table_name = 'label_templates') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                       WHERE constraint_name = 'FK_products_label_templates_LabelTemplateId') THEN
                            ALTER TABLE products
                              ADD CONSTRAINT ""FK_products_label_templates_LabelTemplateId""
                              FOREIGN KEY (""LabelTemplateId"") REFERENCES label_templates (""Id"") ON DELETE SET NULL;
                        END IF;
                    END IF;
                    
                    -- Products production_section_id foreign key
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'products' AND column_name = 'production_section_id')
                       AND EXISTS (SELECT 1 FROM information_schema.tables
                                   WHERE table_name = 'production_sections') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                       WHERE constraint_name = 'FK_products_production_sections_production_section_id') THEN
                            ALTER TABLE products
                              ADD CONSTRAINT ""FK_products_production_sections_production_section_id""
                              FOREIGN KEY (production_section_id) REFERENCES production_sections (""Id"") ON DELETE SET NULL;
                        END IF;
                    END IF;
                    
                    -- Delivery plan items weight_variant_id foreign key
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'delivery_plan_items' AND column_name = 'weight_variant_id')
                       AND EXISTS (SELECT 1 FROM information_schema.tables
                                   WHERE table_name = 'product_weight_variants') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                       WHERE constraint_name = 'FK_delivery_plan_items_product_weight_variants_weight_vari~') THEN
                            ALTER TABLE delivery_plan_items
                              ADD CONSTRAINT ""FK_delivery_plan_items_product_weight_variants_weight_vari~""
                              FOREIGN KEY (weight_variant_id) REFERENCES product_weight_variants (""Id"") ON DELETE SET NULL;
                        END IF;
                    END IF;
                    
                    -- Delivery plans recipe_plan_id foreign key
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'delivery_plans' AND column_name = 'recipe_plan_id')
                       AND EXISTS (SELECT 1 FROM information_schema.tables
                                   WHERE table_name = 'recipe_plans') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                       WHERE constraint_name = 'FK_delivery_plans_recipe_plans_recipe_plan_id') THEN
                            ALTER TABLE delivery_plans
                              ADD CONSTRAINT ""FK_delivery_plans_recipe_plans_recipe_plan_id""
                              FOREIGN KEY (recipe_plan_id) REFERENCES recipe_plans (""Id"") ON DELETE SET NULL;
                        END IF;
                    END IF;
                END $REPAIR$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // This migration is designed to be additive only and safe to run multiple times.
            // Down migration intentionally left empty to prevent accidental data loss.
            // If you need to remove these columns, create a specific migration for that purpose.
        }
    }
}
