using Microsoft.EntityFrameworkCore;

namespace DMS_Backend.Data;

/// <summary>
/// Idempotent PostgreSQL repairs for columns required by operation approvals.
/// Runs after database migrations on startup.
/// Covers drift when EF migrations were not applied or orphan migrations lack Designer metadata.
/// </summary>
public static class ApprovalWorkflowSchemaRepair
{
    /// <summary>Showroom label approval filter uses <c>status</c>.</summary>
    private const string EnsureShowroomLabelRequestStatusSql =
        """
        DO $EF$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'showroom_label_requests'
          ) THEN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema()
                AND table_name = 'showroom_label_requests'
                AND column_name = 'status'
            ) THEN
              ALTER TABLE showroom_label_requests
                ADD COLUMN status character varying(20) NOT NULL DEFAULT 'Pending';
            END IF;
          END IF;
        END $EF$;
        """;

    /// <summary>Ensures IsActive, CreatedAt, UpdatedAt have proper defaults in showroom_label_requests.</summary>
    private const string EnsureShowroomLabelRequestDefaultsSql =
        """
        DO $EF$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'showroom_label_requests'
          ) THEN
            -- Set default value for IsActive
            EXECUTE 'ALTER TABLE showroom_label_requests ALTER COLUMN "IsActive" SET DEFAULT true';
            
            -- Update any existing NULL values
            UPDATE showroom_label_requests 
            SET "IsActive" = true 
            WHERE "IsActive" IS NULL;
            
            -- Ensure CreatedAt has default
            EXECUTE 'ALTER TABLE showroom_label_requests ALTER COLUMN "CreatedAt" SET DEFAULT NOW()';
            
            -- Ensure UpdatedAt has default
            EXECUTE 'ALTER TABLE showroom_label_requests ALTER COLUMN "UpdatedAt" SET DEFAULT NOW()';
          END IF;
        END $EF$;
        """;

    /// <summary>
    /// POS sale pending approvals query uses <c>status</c>; loading POS sales requires workflow columns.
    /// Mirrors <c>AddPosSaleApprovalWorkflow</c> migration.
    /// </summary>
    private const string EnsurePosSaleApprovalWorkflowSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'pos_sales'
          ) THEN
            RETURN;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'pos_sales'
              AND column_name = 'status'
          ) THEN
            ALTER TABLE pos_sales
              ADD COLUMN status character varying(32) NOT NULL DEFAULT 'Pending';
          END IF;

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

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'IX_pos_sales_status'
          ) THEN
            CREATE INDEX "IX_pos_sales_status" ON pos_sales (status);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'IX_pos_sales_approved_by_id'
          ) THEN
            CREATE INDEX "IX_pos_sales_approved_by_id" ON pos_sales (approved_by_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'IX_pos_sales_rejected_by_id'
          ) THEN
            CREATE INDEX "IX_pos_sales_rejected_by_id" ON pos_sales (rejected_by_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_pos_sales_users_approved_by_id'
          ) THEN
            ALTER TABLE pos_sales
              ADD CONSTRAINT "FK_pos_sales_users_approved_by_id"
              FOREIGN KEY (approved_by_id) REFERENCES users ("Id") ON DELETE RESTRICT;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_pos_sales_users_rejected_by_id'
          ) THEN
            ALTER TABLE pos_sales
              ADD CONSTRAINT "FK_pos_sales_users_rejected_by_id"
              FOREIGN KEY (rejected_by_id) REFERENCES users ("Id") ON DELETE RESTRICT;
          END IF;
        END $EF$;
        """;

    /// <summary>
    /// Products table is missing WeightGrams and StandardQuantity columns that were added to the
    /// entity but never included in any applied migration (bypassed via direct SQL in PhaseB/C).
    /// </summary>
    private const string EnsureProductWeightColumnsSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'products'
              AND column_name = 'WeightGrams'
          ) THEN
            ALTER TABLE products ADD COLUMN "WeightGrams" numeric(18,4) NULL;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'products'
              AND column_name = 'StandardQuantity'
          ) THEN
            ALTER TABLE products ADD COLUMN "StandardQuantity" numeric(18,4) NULL;
          END IF;
        END $EF$;
        """;

    /// <summary>
    /// Ingredient stock-alert columns referenced by EF queries (and the
    /// PhaseC migration listed them in comments only, not in <c>Up()</c>).
    /// Without these columns every <c>SELECT ... FROM ingredients</c> fails
    /// with <c>42703 column i.low_stock_alert_enabled does not exist</c>,
    /// which cascades into every Inventory page (Products, UoM, Ingredients)
    /// returning HTTP 500.
    /// </summary>
    private const string EnsureIngredientStockAlertColumnsSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'ingredients'
          ) THEN
            RETURN;
          END IF;

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
        END $EF$;
        """;

    /// <summary>
    /// product_section_assignments was created via raw SQL in
    /// <c>20260508190000_AddProductSectionAssignments</c>. Older databases that
    /// applied an earlier hand-written variant ended up with the PK named
    /// <c>"Id"</c> (PascalCase quoted) instead of the <c>id</c> the entity now
    /// maps to. Rename so EF queries (<c>s.id</c>) match the column.
    /// </summary>
    private const string EnsureProductSectionAssignmentIdColumnSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'product_section_assignments'
          ) THEN
            RETURN;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'product_section_assignments'
              AND column_name = 'Id'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'product_section_assignments'
              AND column_name = 'id'
          ) THEN
            ALTER TABLE product_section_assignments RENAME COLUMN "Id" TO id;
          END IF;
        END $EF$;
        """;

    /// <summary>
    /// Ingredient entity has AllowExtraQty and ExtraQtyNote properties that were added to the model
    /// but never included in any applied migration (present in PhaseA Designer snapshot only).
    /// </summary>
    private const string EnsureIngredientExtraQtyColumnsSql =
        """
        DO $EF$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'ingredients'
              AND column_name = 'AllowExtraQty'
          ) THEN
            ALTER TABLE ingredients ADD COLUMN "AllowExtraQty" boolean NOT NULL DEFAULT false;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'ingredients'
              AND column_name = 'ExtraQtyNote'
          ) THEN
            ALTER TABLE ingredients ADD COLUMN "ExtraQtyNote" character varying(500) NULL;
          END IF;
        END $EF$;
        """;

    public static async Task EnsureApprovalStatusColumnsAsync(
        this ApplicationDbContext db,
        CancellationToken cancellationToken = default)
    {
        await db.Database.ExecuteSqlRawAsync(EnsureShowroomLabelRequestStatusSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureShowroomLabelRequestDefaultsSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsurePosSaleApprovalWorkflowSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureProductWeightColumnsSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureIngredientExtraQtyColumnsSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureIngredientStockAlertColumnsSql, cancellationToken);
        await db.Database.ExecuteSqlRawAsync(EnsureProductSectionAssignmentIdColumnSql, cancellationToken);
    }
}
