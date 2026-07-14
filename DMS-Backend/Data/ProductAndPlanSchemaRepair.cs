using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// Idempotent PostgreSQL repairs for columns from the PhaseC migration
/// (<c>20260507140000_PhaseC_OperationApproval_ProductSectionFK_DeliveryPlanRecipePlanFK_IngredientStockAlerts</c>)
/// whose <c>Up()</c> was intentionally left empty because the DDL was applied via
/// a standalone SQL script on the original development database.
/// When EF runs <c>MigrateAsync()</c> on a fresh or restored database it records the
/// migration in <c>__EFMigrationsHistory</c> without creating the columns, causing
/// <c>42703 column … does not exist</c> errors at query time.
/// Also covers the <c>LabelTemplateId</c> column on products which may fail to apply
/// if the migration runs before the <c>label_templates</c> table exists.
/// </summary>
public static class ProductAndPlanSchemaRepair
{
    /// <summary>
    /// Ensures <c>products.production_section_id</c> exists (FK to <c>production_sections</c>).
    /// Also ensures <c>products.LabelTemplateId</c> (FK to <c>label_templates</c>).
    /// </summary>
    private const string EnsureProductColumnsSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'products'
          ) THEN
            RETURN;
          END IF;

          -- production_section_id (PhaseC migration — empty Up())
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'products'
              AND column_name = 'production_section_id'
          ) THEN
            ALTER TABLE products ADD COLUMN production_section_id uuid NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'ix_products_production_section_id'
          ) THEN
            CREATE INDEX ix_products_production_section_id ON products(production_section_id);
          END IF;

          -- FK to production_sections (only if target table exists)
          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'production_sections'
          ) AND NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class rel ON rel.oid = c.conrelid
            JOIN pg_namespace ns ON ns.oid = rel.relnamespace
            WHERE ns.nspname = current_schema()
              AND rel.relname = 'products'
              AND c.contype = 'f'
              AND pg_get_constraintdef(c.oid) ~* 'production_section_id'
              AND pg_get_constraintdef(c.oid) ~* 'production_sections'
          ) THEN
            ALTER TABLE products
              ADD CONSTRAINT "FK_products_production_sections_production_section_id"
              FOREIGN KEY (production_section_id)
              REFERENCES production_sections ("Id")
              ON DELETE RESTRICT;
          END IF;

          -- LabelTemplateId (AddProductLabelTemplateIdToProducts migration)
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'products'
              AND column_name = 'LabelTemplateId'
          ) THEN
            ALTER TABLE products ADD COLUMN "LabelTemplateId" uuid NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'IX_products_LabelTemplateId'
          ) THEN
            CREATE INDEX "IX_products_LabelTemplateId" ON products ("LabelTemplateId");
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'label_templates'
          ) AND NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_products_label_templates_LabelTemplateId'
          ) THEN
            ALTER TABLE products
              ADD CONSTRAINT "FK_products_label_templates_LabelTemplateId"
              FOREIGN KEY ("LabelTemplateId")
              REFERENCES label_templates ("Id")
              ON DELETE SET NULL;
          END IF;
        END $EF$;
        """;

    /// <summary>
    /// Ensures <c>delivery_plans.recipe_plan_id</c> exists (FK to <c>recipe_plans</c>).
    /// </summary>
    private const string EnsureDeliveryPlanRecipePlanColumnSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'delivery_plans'
          ) THEN
            RETURN;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'delivery_plans'
              AND column_name = 'recipe_plan_id'
          ) THEN
            ALTER TABLE delivery_plans ADD COLUMN recipe_plan_id uuid NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'ix_delivery_plans_recipe_plan_id'
          ) THEN
            CREATE INDEX ix_delivery_plans_recipe_plan_id ON delivery_plans(recipe_plan_id);
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'recipe_plans'
          ) AND NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class rel ON rel.oid = c.conrelid
            JOIN pg_namespace ns ON ns.oid = rel.relnamespace
            WHERE ns.nspname = current_schema()
              AND rel.relname = 'delivery_plans'
              AND c.contype = 'f'
              AND pg_get_constraintdef(c.oid) ~* 'recipe_plan_id'
              AND pg_get_constraintdef(c.oid) ~* 'recipe_plans'
          ) THEN
            ALTER TABLE delivery_plans
              ADD CONSTRAINT "FK_delivery_plans_recipe_plans_recipe_plan_id"
              FOREIGN KEY (recipe_plan_id)
              REFERENCES recipe_plans ("Id")
              ON DELETE SET NULL;
          END IF;
        END $EF$;
        """;

    /// <summary>
    /// Ensures the <c>operation_approvals</c> table exists (PhaseC migration — empty Up()).
    /// </summary>
    private const string EnsureOperationApprovalsTableSql =
        """
        CREATE TABLE IF NOT EXISTS operation_approvals (
            "Id"            uuid            NOT NULL DEFAULT gen_random_uuid(),
            "IsActive"      boolean         NOT NULL DEFAULT TRUE,
            "CreatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
            "CreatedById"   uuid            NULL,
            "UpdatedById"   uuid            NULL,
            document_type   character varying(100)  NOT NULL,
            document_id     uuid                    NOT NULL,
            document_no     character varying(100)  NULL,
            from_status     character varying(50)   NOT NULL,
            to_status       character varying(50)   NOT NULL,
            performed_by    uuid                    NOT NULL,
            performed_at    timestamp with time zone NOT NULL,
            remarks         character varying(1000) NULL,
            action          character varying(100)  NOT NULL,
            CONSTRAINT "PK_operation_approvals" PRIMARY KEY ("Id")
        );
        """;

    private const string EnsureOperationApprovalsIndexesSql =
        """
        CREATE INDEX IF NOT EXISTS "IX_operation_approvals_document_type_document_id"
          ON operation_approvals (document_type, document_id);
        CREATE INDEX IF NOT EXISTS "IX_operation_approvals_performed_by"
          ON operation_approvals (performed_by);
        """;

    /// <summary>
    /// Ensures <c>rounding_rules</c> ratio columns exist (AddRoundingRuleRatioColumns migration).
    /// </summary>
    private const string EnsureRoundingRuleRatioColumnsSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'rounding_rules'
          ) THEN
            RETURN;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'rounding_rules'
              AND column_name = 'ratio_base_quantity'
          ) THEN
            ALTER TABLE rounding_rules ADD COLUMN ratio_base_quantity numeric(18,6) NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'rounding_rules'
              AND column_name = 'ratio_yield_quantity'
          ) THEN
            ALTER TABLE rounding_rules ADD COLUMN ratio_yield_quantity numeric(18,6) NULL;
          END IF;
        END $EF$;
        """;

    // ── PhaseB tables (empty Up() migration — applied via external SQL on dev DB) ─────

    private const string EnsureProductWeightVariantsTableSql =
        """
        CREATE TABLE IF NOT EXISTS product_weight_variants (
            "Id"            uuid            NOT NULL DEFAULT gen_random_uuid(),
            "IsActive"      boolean         NOT NULL DEFAULT TRUE,
            "CreatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
            "CreatedById"   uuid            NULL,
            "UpdatedById"   uuid            NULL,
            product_id      uuid            NOT NULL,
            label           character varying(100) NOT NULL,
            weight_grams    numeric(18,4)   NOT NULL DEFAULT 0,
            is_default      boolean         NOT NULL DEFAULT FALSE,
            sort_order      integer         NOT NULL DEFAULT 0,
            CONSTRAINT "PK_product_weight_variants" PRIMARY KEY ("Id")
        );
        CREATE INDEX IF NOT EXISTS ix_product_weight_variants_product_id
          ON product_weight_variants (product_id);
        """;

    private const string EnsureRecipeTemplateComponentsTableSql =
        """
        CREATE TABLE IF NOT EXISTS recipe_template_components (
            "Id"                  uuid            NOT NULL DEFAULT gen_random_uuid(),
            "IsActive"            boolean         NOT NULL DEFAULT TRUE,
            "CreatedAt"           timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAt"           timestamp with time zone NOT NULL DEFAULT now(),
            "CreatedById"         uuid            NULL,
            "UpdatedById"         uuid            NULL,
            recipe_template_id    uuid            NOT NULL,
            production_section_id uuid            NOT NULL,
            component_name        character varying(200) NOT NULL,
            sort_order            integer         NOT NULL DEFAULT 0,
            CONSTRAINT "PK_recipe_template_components" PRIMARY KEY ("Id")
        );
        CREATE INDEX IF NOT EXISTS ix_recipe_template_components_recipe_template_id
          ON recipe_template_components (recipe_template_id);
        CREATE INDEX IF NOT EXISTS ix_recipe_template_components_production_section_id
          ON recipe_template_components (production_section_id);
        """;

    private const string EnsureRecipeTemplateIngredientsTableSql =
        """
        CREATE TABLE IF NOT EXISTS recipe_template_ingredients (
            "Id"                          uuid            NOT NULL DEFAULT gen_random_uuid(),
            "IsActive"                    boolean         NOT NULL DEFAULT TRUE,
            "CreatedAt"                   timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAt"                   timestamp with time zone NOT NULL DEFAULT now(),
            "CreatedById"                 uuid            NULL,
            "UpdatedById"                 uuid            NULL,
            recipe_template_component_id  uuid            NOT NULL,
            ingredient_id                 uuid            NOT NULL,
            qty_per_unit                  numeric(18,4)   NOT NULL DEFAULT 0,
            extra_qty_per_unit            numeric(18,4)   NOT NULL DEFAULT 0,
            stores_only                   boolean         NOT NULL DEFAULT FALSE,
            show_extra_in_stores          boolean         NOT NULL DEFAULT FALSE,
            sort_order                    integer         NOT NULL DEFAULT 0,
            CONSTRAINT "PK_recipe_template_ingredients" PRIMARY KEY ("Id")
        );
        CREATE INDEX IF NOT EXISTS ix_recipe_template_ingredients_component_id
          ON recipe_template_ingredients (recipe_template_component_id);
        CREATE INDEX IF NOT EXISTS ix_recipe_template_ingredients_ingredient_id
          ON recipe_template_ingredients (ingredient_id);
        """;

    private const string EnsureRecipePlansTableSql =
        """
        CREATE TABLE IF NOT EXISTS recipe_plans (
            "Id"            uuid            NOT NULL DEFAULT gen_random_uuid(),
            "IsActive"      boolean         NOT NULL DEFAULT TRUE,
            "CreatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
            "CreatedById"   uuid            NULL,
            "UpdatedById"   uuid            NULL,
            code            character varying(20)  NOT NULL,
            name            character varying(200) NOT NULL,
            description     character varying(500) NULL,
            effective_from  timestamp with time zone NULL,
            effective_to    timestamp with time zone NULL,
            is_default      boolean         NOT NULL DEFAULT FALSE,
            sort_order      integer         NOT NULL DEFAULT 0,
            CONSTRAINT "PK_recipe_plans" PRIMARY KEY ("Id")
        );
        """;

    private const string EnsureRecipePlanItemsTableSql =
        """
        CREATE TABLE IF NOT EXISTS recipe_plan_items (
            "Id"            uuid            NOT NULL DEFAULT gen_random_uuid(),
            "IsActive"      boolean         NOT NULL DEFAULT TRUE,
            "CreatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
            "UpdatedAt"     timestamp with time zone NOT NULL DEFAULT now(),
            "CreatedById"   uuid            NULL,
            "UpdatedById"   uuid            NULL,
            recipe_plan_id  uuid            NOT NULL,
            product_id      uuid            NOT NULL,
            recipe_id       uuid            NOT NULL,
            notes           character varying(500) NULL,
            CONSTRAINT "PK_recipe_plan_items" PRIMARY KEY ("Id")
        );
        CREATE INDEX IF NOT EXISTS ix_recipe_plan_items_recipe_plan_id
          ON recipe_plan_items (recipe_plan_id);
        CREATE INDEX IF NOT EXISTS ix_recipe_plan_items_product_id
          ON recipe_plan_items (product_id);
        CREATE INDEX IF NOT EXISTS ix_recipe_plan_items_recipe_id
          ON recipe_plan_items (recipe_id);
        """;

    // ── product_section_assignments (migration uses raw SQL, FK can fail on fresh DB) ──

    private const string EnsureProductSectionAssignmentsTableSql =
        """
        CREATE TABLE IF NOT EXISTS product_section_assignments (
            id                    uuid    NOT NULL DEFAULT gen_random_uuid(),
            product_id            uuid    NOT NULL,
            production_section_id uuid    NOT NULL,
            role                  character varying(100) NULL,
            sort_order            integer NOT NULL DEFAULT 0,
            CONSTRAINT "PK_product_section_assignments" PRIMARY KEY (id),
            CONSTRAINT uq_product_section UNIQUE (product_id, production_section_id)
        );
        CREATE INDEX IF NOT EXISTS ix_product_section_assignments_product_id
          ON product_section_assignments (product_id);
        CREATE INDEX IF NOT EXISTS ix_product_section_assignments_section_id
          ON product_section_assignments (production_section_id);
        """;

    private const string EnsureProductSectionAssignmentsFkSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_psa_products'
              OR conname = 'product_section_assignments_product_id_fkey'
          ) AND EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'product_section_assignments'
          ) THEN
            ALTER TABLE product_section_assignments
              ADD CONSTRAINT "FK_psa_products"
              FOREIGN KEY (product_id) REFERENCES products ("Id") ON DELETE CASCADE;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_psa_production_sections'
              OR conname = 'product_section_assignments_production_section_id_fkey'
          ) AND EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema() AND table_name = 'production_sections'
          ) THEN
            ALTER TABLE product_section_assignments
              ADD CONSTRAINT "FK_psa_production_sections"
              FOREIGN KEY (production_section_id) REFERENCES production_sections ("Id") ON DELETE CASCADE;
          END IF;
        END $EF$;
        """;

    public static async Task EnsureProductAndPlanColumnsAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
    {
        // Column repairs
        await db.Database.ExecuteSqlRawAsync(EnsureProductColumnsSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureDeliveryPlanRecipePlanColumnSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureRoundingRuleRatioColumnsSql, cancellationToken);

        // PhaseB tables (empty Up() migration)
        await db.Database.ExecuteSqlRawAsync(EnsureProductWeightVariantsTableSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureRecipeTemplateComponentsTableSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureRecipeTemplateIngredientsTableSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureRecipePlansTableSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureRecipePlanItemsTableSql, cancellationToken);

        // PhaseC tables (empty Up() migration)
        await db.Database.ExecuteSqlRawAsync(EnsureOperationApprovalsTableSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureOperationApprovalsIndexesSql, cancellationToken);

        // product_section_assignments (raw SQL migration, FK can fail on fresh DB)
        await db.Database.ExecuteSqlRawAsync(EnsureProductSectionAssignmentsTableSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureProductSectionAssignmentsFkSql, cancellationToken);
    }
}
