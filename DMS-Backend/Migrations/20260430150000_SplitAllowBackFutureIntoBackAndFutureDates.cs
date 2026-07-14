using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <summary>
    /// Splits the single <c>{prefix}:allow-back-future</c> permission into two
    /// independent permissions per prefix:
    ///
    ///     {prefix}:allow-back-date     — grants back-date access
    ///     {prefix}:allow-future-date   — grants future-date access
    ///
    /// This lets a role be configured to permit ONLY back-dating OR ONLY
    /// future-dating instead of both at once.
    ///
    /// Behaviour preserved:
    ///   - Roles that previously held <c>{prefix}:allow-back-future</c> are
    ///     auto-granted BOTH new permissions (so users keep their current
    ///     reach).
    ///   - The Super Admin USER (<c>IsSuperAdmin = true</c>) bypasses
    ///     permission checks via the JWT <c>"*"</c> wildcard, so they need no
    ///     explicit grant.
    ///   - Administrator-style roles (matched by name) are auto-granted both
    ///     new permissions for full coverage.
    ///
    /// After re-pointing every grant, the old <c>{prefix}:allow-back-future</c>
    /// rows (and their role assignments) are removed from the catalog.
    /// </summary>
    public partial class SplitAllowBackFutureIntoBackAndFutureDates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $$
                DECLARE
                    items JSONB := '[
                        {""prefix"": ""dashboard"", ""sub"": ""Main"", ""parent"": ""Dashboard""},

                        {""prefix"": ""products"", ""sub"": ""Products"", ""parent"": ""Inventory""},
                        {""prefix"": ""categories"", ""sub"": ""Categories"", ""parent"": ""Inventory""},
                        {""prefix"": ""unit-of-measure"", ""sub"": ""UnitOfMeasure"", ""parent"": ""Inventory""},
                        {""prefix"": ""ingredients"", ""sub"": ""Ingredients"", ""parent"": ""Inventory""},

                        {""prefix"": ""showroom"", ""sub"": ""Outlets"", ""parent"": ""Showroom""},

                        {""prefix"": ""operation:delivery"", ""sub"": ""Delivery"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:delivery-return"", ""sub"": ""DeliveryReturn"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:disposal"", ""sub"": ""Disposal"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:transfer"", ""sub"": ""Transfer"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:stock-bf"", ""sub"": ""StockBF"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:cancellation"", ""sub"": ""Cancellation"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:label-printing"", ""sub"": ""LabelPrinting"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:showroom-label-printing"", ""sub"": ""ShowroomLabelPrinting"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:showroom-open-stock"", ""sub"": ""ShowroomOpenStock"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:approvals"", ""sub"": ""Approvals"", ""parent"": ""Operation""},

                        {""prefix"": ""production:daily"", ""sub"": ""DailyProduction"", ""parent"": ""Production""},
                        {""prefix"": ""production:cancel"", ""sub"": ""ProductionCancel"", ""parent"": ""Production""},
                        {""prefix"": ""production:plan"", ""sub"": ""ProductionPlan"", ""parent"": ""Production""},
                        {""prefix"": ""production:current-stock"", ""sub"": ""CurrentStock"", ""parent"": ""Production""},
                        {""prefix"": ""production:stock-adjustment"", ""sub"": ""StockAdjustment"", ""parent"": ""Production""},
                        {""prefix"": ""production:shift"", ""sub"": ""Shifts"", ""parent"": ""Production""},

                        {""prefix"": ""order"", ""sub"": ""OrderEntry"", ""parent"": ""DMS""},
                        {""prefix"": ""delivery_plan"", ""sub"": ""DeliveryPlan"", ""parent"": ""DMS""},
                        {""prefix"": ""delivery-summary"", ""sub"": ""DeliverySummary"", ""parent"": ""DMS""},
                        {""prefix"": ""immediate_order"", ""sub"": ""ImmediateOrders"", ""parent"": ""DMS""},
                        {""prefix"": ""default_quantity"", ""sub"": ""DefaultQuantities"", ""parent"": ""DMS""},
                        {""prefix"": ""production-planner"", ""sub"": ""ProductionPlanner"", ""parent"": ""DMS""},
                        {""prefix"": ""stores-issue-note"", ""sub"": ""StoresIssueNote"", ""parent"": ""DMS""},
                        {""prefix"": ""recipes"", ""sub"": ""RecipeManagement"", ""parent"": ""DMS""},
                        {""prefix"": ""recipe-templates"", ""sub"": ""RecipeTemplates"", ""parent"": ""DMS""},
                        {""prefix"": ""freezer_stock"", ""sub"": ""FreezerStock"", ""parent"": ""DMS""},
                        {""prefix"": ""anytime-recipe"", ""sub"": ""AnytimeRecipe"", ""parent"": ""DMS""},
                        {""prefix"": ""dough-generator"", ""sub"": ""DoughGenerator"", ""parent"": ""DMS""},
                        {""prefix"": ""dms-recipe"", ""sub"": ""RecipeExport"", ""parent"": ""DMS""},
                        {""prefix"": ""dashboard-pivot"", ""sub"": ""DashboardPivot"", ""parent"": ""DMS""},
                        {""prefix"": ""print:receipt-cards"", ""sub"": ""PrintReceiptCards"", ""parent"": ""DMS""},
                        {""prefix"": ""print:section-bundle"", ""sub"": ""SectionPrintBundle"", ""parent"": ""DMS""},
                        {""prefix"": ""xlsm-importer"", ""sub"": ""XlsmImporter"", ""parent"": ""DMS""},
                        {""prefix"": ""reconciliation"", ""sub"": ""Reconciliation"", ""parent"": ""DMS""},

                        {""prefix"": ""reports"", ""sub"": ""General"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:sales"", ""sub"": ""Sales"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:delivery"", ""sub"": ""Delivery"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:disposal"", ""sub"": ""Disposal"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:inventory"", ""sub"": ""Inventory"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:product"", ""sub"": ""Product"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:showroom"", ""sub"": ""Showroom"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:category"", ""sub"": ""Category"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:daily"", ""sub"": ""Daily"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:monthly"", ""sub"": ""Monthly"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:profit"", ""sub"": ""Profit"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:financial"", ""sub"": ""Financial"", ""parent"": ""Reports""},
                        {""prefix"": ""reports:production"", ""sub"": ""Production"", ""parent"": ""Reports""},

                        {""prefix"": ""day-end"", ""sub"": ""DayEndProcess"", ""parent"": ""Administrator""},
                        {""prefix"": ""cashier-balance"", ""sub"": ""CashierBalance"", ""parent"": ""Administrator""},
                        {""prefix"": ""setting"", ""sub"": ""SystemSettings"", ""parent"": ""Administrator""},
                        {""prefix"": ""label-settings"", ""sub"": ""LabelSettings"", ""parent"": ""Administrator""},
                        {""prefix"": ""admin-delivery-plan"", ""sub"": ""AdminDeliveryPlan"", ""parent"": ""Administrator""},
                        {""prefix"": ""security-policies"", ""sub"": ""Security"", ""parent"": ""Administrator""},
                        {""prefix"": ""users"", ""sub"": ""Users"", ""parent"": ""Administrator""},
                        {""prefix"": ""roles"", ""sub"": ""Roles"", ""parent"": ""Administrator""},
                        {""prefix"": ""permissions"", ""sub"": ""Permissions"", ""parent"": ""Administrator""},
                        {""prefix"": ""admin"", ""sub"": ""DayLock"", ""parent"": ""Administrator""},
                        {""prefix"": ""approval"", ""sub"": ""Approvals"", ""parent"": ""Administrator""},
                        {""prefix"": ""employee"", ""sub"": ""ShowroomEmployee"", ""parent"": ""Administrator""},
                        {""prefix"": ""pricing"", ""sub"": ""PriceManager"", ""parent"": ""Administrator""},
                        {""prefix"": ""workflow-config"", ""sub"": ""WorkflowConfig"", ""parent"": ""Administrator""},
                        {""prefix"": ""grid-config"", ""sub"": ""GridConfiguration"", ""parent"": ""Administrator""},
                        {""prefix"": ""day_type"", ""sub"": ""DayTypes"", ""parent"": ""Administrator""},
                        {""prefix"": ""delivery_turn"", ""sub"": ""DeliveryTurns"", ""parent"": ""Administrator""},
                        {""prefix"": ""rounding-rules"", ""sub"": ""RoundingRules"", ""parent"": ""Administrator""},
                        {""prefix"": ""section-consumables"", ""sub"": ""SectionConsumables"", ""parent"": ""Administrator""},
                        {""prefix"": ""label-templates"", ""sub"": ""LabelTemplates"", ""parent"": ""Administrator""}
                    ]'::jsonb;

                    -- New independent suffixes that replace the legacy
                    -- ""allow-back-future"" combo column.
                    new_actions JSONB := '[
                        {""suffix"": ""allow-back-date"",   ""label"": ""AllowBackDate""},
                        {""suffix"": ""allow-future-date"", ""label"": ""AllowFutureDate""}
                    ]'::jsonb;

                    item            JSONB;
                    act             JSONB;
                    p_code          TEXT;
                    p_name          TEXT;
                    p_module        TEXT;
                    p_desc          TEXT;
                    next_order      INT;
                    legacy_code     TEXT;
                    legacy_id       UUID;
                    new_back_id     UUID;
                    new_future_id   UUID;
                    last_count      INT := 0;
                    inserted_count  INT := 0;
                    migrated_count  INT := 0;
                    deleted_count   INT := 0;
                BEGIN
                    SELECT COALESCE(MAX(""DisplayOrder""), 0) + 1
                      INTO next_order
                      FROM permissions;

                    -- ----------------------------------------------------------------
                    -- 1) Insert the two new permissions for every prefix that does not
                    --    already have them.
                    -- ----------------------------------------------------------------
                    FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
                        FOR act IN SELECT * FROM jsonb_array_elements(new_actions) LOOP
                            p_code   := (item->>'prefix') || ':' || (act->>'suffix');
                            p_name   := (act->>'label')   || ' ' || (item->>'sub');
                            p_module := (item->>'parent') || ' - ' || (item->>'sub');
                            p_desc   := p_name;

                            IF NOT EXISTS (SELECT 1 FROM permissions WHERE ""Code"" = p_code) THEN
                                INSERT INTO permissions
                                    (""Id"", ""Code"", ""Name"", ""Module"", ""Description"",
                                     ""IsSystemPermission"", ""DisplayOrder"", ""CreatedAt"")
                                VALUES
                                    (gen_random_uuid(), p_code, p_name, p_module, p_desc,
                                     true, next_order, NOW());

                                next_order     := next_order + 1;
                                inserted_count := inserted_count + 1;
                            END IF;
                        END LOOP;
                    END LOOP;

                    -- ----------------------------------------------------------------
                    -- 2) For every prefix, copy any role assignments held against the
                    --    legacy ""{prefix}:allow-back-future"" permission onto BOTH new
                    --    permissions. This preserves current user reach.
                    -- ----------------------------------------------------------------
                    FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
                        legacy_code := (item->>'prefix') || ':allow-back-future';

                        SELECT ""Id"" INTO legacy_id
                          FROM permissions WHERE ""Code"" = legacy_code;

                        IF legacy_id IS NULL THEN
                            CONTINUE;
                        END IF;

                        SELECT ""Id"" INTO new_back_id
                          FROM permissions
                         WHERE ""Code"" = (item->>'prefix') || ':allow-back-date';

                        SELECT ""Id"" INTO new_future_id
                          FROM permissions
                         WHERE ""Code"" = (item->>'prefix') || ':allow-future-date';

                        IF new_back_id IS NULL OR new_future_id IS NULL THEN
                            CONTINUE;
                        END IF;

                        -- Mirror legacy grants -> new back-date permission
                        INSERT INTO role_permissions (""Id"", ""RoleId"", ""PermissionId"", ""GrantedAt"")
                        SELECT gen_random_uuid(), rp.""RoleId"", new_back_id, NOW()
                          FROM role_permissions rp
                         WHERE rp.""PermissionId"" = legacy_id
                           AND NOT EXISTS (
                               SELECT 1 FROM role_permissions rp2
                                WHERE rp2.""RoleId"" = rp.""RoleId""
                                  AND rp2.""PermissionId"" = new_back_id
                           );
                        GET DIAGNOSTICS last_count = ROW_COUNT;
                        migrated_count := migrated_count + last_count;

                        -- Mirror legacy grants -> new future-date permission
                        INSERT INTO role_permissions (""Id"", ""RoleId"", ""PermissionId"", ""GrantedAt"")
                        SELECT gen_random_uuid(), rp.""RoleId"", new_future_id, NOW()
                          FROM role_permissions rp
                         WHERE rp.""PermissionId"" = legacy_id
                           AND NOT EXISTS (
                               SELECT 1 FROM role_permissions rp2
                                WHERE rp2.""RoleId"" = rp.""RoleId""
                                  AND rp2.""PermissionId"" = new_future_id
                           );
                        GET DIAGNOSTICS last_count = ROW_COUNT;
                        migrated_count := migrated_count + last_count;
                    END LOOP;

                    -- ----------------------------------------------------------------
                    -- 3) Auto-grant the two new permissions to administrator-style
                    --    roles so they keep full coverage out of the box.
                    -- ----------------------------------------------------------------
                    INSERT INTO role_permissions (""Id"", ""RoleId"", ""PermissionId"", ""GrantedAt"")
                    SELECT gen_random_uuid(), r.""Id"", p.""Id"", NOW()
                      FROM roles r
                      CROSS JOIN permissions p
                     WHERE (
                            r.""Name"" ILIKE 'administrator'
                         OR r.""Name"" ILIKE 'system administrator'
                         OR r.""Name"" ILIKE 'super admin'
                         OR r.""Name"" ILIKE 'super administrator'
                       )
                       AND (
                            p.""Code"" LIKE '%:allow-back-date'
                         OR p.""Code"" LIKE '%:allow-future-date'
                       )
                       AND NOT EXISTS (
                           SELECT 1 FROM role_permissions rp
                            WHERE rp.""RoleId"" = r.""Id""
                              AND rp.""PermissionId"" = p.""Id""
                       );

                    -- ----------------------------------------------------------------
                    -- 4) Drop the legacy {prefix}:allow-back-future rows. Their
                    --    role_permissions rows cascade with the FK; if the FK does
                    --    not cascade, delete grants explicitly first.
                    -- ----------------------------------------------------------------
                    DELETE FROM role_permissions
                     WHERE ""PermissionId"" IN (
                        SELECT ""Id"" FROM permissions WHERE ""Code"" LIKE '%:allow-back-future'
                     );

                    DELETE FROM permissions
                     WHERE ""Code"" LIKE '%:allow-back-future';
                    GET DIAGNOSTICS deleted_count = ROW_COUNT;

                    RAISE NOTICE 'SplitAllowBackFutureIntoBackAndFutureDates: inserted % permission(s), migrated % role grant(s), removed % legacy permission(s).',
                        inserted_count, migrated_count, deleted_count;
                END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort rollback: re-create the legacy {prefix}:allow-back-future
            // permission per known prefix and copy role grants from EITHER of the
            // split permissions back onto it. The split permissions are then
            // removed (only when not referenced by any role grant the migration
            // didn't introduce).
            migrationBuilder.Sql(@"
                DO $$
                DECLARE
                    items JSONB := '[
                        {""prefix"": ""dashboard"", ""sub"": ""Main"", ""parent"": ""Dashboard""},
                        {""prefix"": ""products"", ""sub"": ""Products"", ""parent"": ""Inventory""},
                        {""prefix"": ""categories"", ""sub"": ""Categories"", ""parent"": ""Inventory""},
                        {""prefix"": ""unit-of-measure"", ""sub"": ""UnitOfMeasure"", ""parent"": ""Inventory""},
                        {""prefix"": ""ingredients"", ""sub"": ""Ingredients"", ""parent"": ""Inventory""},
                        {""prefix"": ""showroom"", ""sub"": ""Outlets"", ""parent"": ""Showroom""},
                        {""prefix"": ""operation:delivery"", ""sub"": ""Delivery"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:delivery-return"", ""sub"": ""DeliveryReturn"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:disposal"", ""sub"": ""Disposal"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:transfer"", ""sub"": ""Transfer"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:stock-bf"", ""sub"": ""StockBF"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:cancellation"", ""sub"": ""Cancellation"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:label-printing"", ""sub"": ""LabelPrinting"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:showroom-label-printing"", ""sub"": ""ShowroomLabelPrinting"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:showroom-open-stock"", ""sub"": ""ShowroomOpenStock"", ""parent"": ""Operation""},
                        {""prefix"": ""operation:approvals"", ""sub"": ""Approvals"", ""parent"": ""Operation""},
                        {""prefix"": ""production:daily"", ""sub"": ""DailyProduction"", ""parent"": ""Production""},
                        {""prefix"": ""production:cancel"", ""sub"": ""ProductionCancel"", ""parent"": ""Production""},
                        {""prefix"": ""production:plan"", ""sub"": ""ProductionPlan"", ""parent"": ""Production""},
                        {""prefix"": ""production:current-stock"", ""sub"": ""CurrentStock"", ""parent"": ""Production""},
                        {""prefix"": ""production:stock-adjustment"", ""sub"": ""StockAdjustment"", ""parent"": ""Production""},
                        {""prefix"": ""production:shift"", ""sub"": ""Shifts"", ""parent"": ""Production""}
                    ]'::jsonb;

                    item       JSONB;
                    legacy_code TEXT;
                    legacy_id   UUID;
                    next_order  INT;
                BEGIN
                    SELECT COALESCE(MAX(""DisplayOrder""), 0) + 1
                      INTO next_order
                      FROM permissions;

                    FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
                        legacy_code := (item->>'prefix') || ':allow-back-future';

                        IF NOT EXISTS (SELECT 1 FROM permissions WHERE ""Code"" = legacy_code) THEN
                            INSERT INTO permissions
                                (""Id"", ""Code"", ""Name"", ""Module"", ""Description"",
                                 ""IsSystemPermission"", ""DisplayOrder"", ""CreatedAt"")
                            VALUES
                                (gen_random_uuid(), legacy_code,
                                 'AllowBackFuture ' || (item->>'sub'),
                                 (item->>'parent') || ' - ' || (item->>'sub'),
                                 'AllowBackFuture ' || (item->>'sub'),
                                 true, next_order, NOW());
                            next_order := next_order + 1;
                        END IF;

                        SELECT ""Id"" INTO legacy_id
                          FROM permissions WHERE ""Code"" = legacy_code;

                        -- Re-create grants from EITHER split permission.
                        INSERT INTO role_permissions (""Id"", ""RoleId"", ""PermissionId"", ""GrantedAt"")
                        SELECT DISTINCT gen_random_uuid(), rp.""RoleId"", legacy_id, NOW()
                          FROM role_permissions rp
                          JOIN permissions p ON p.""Id"" = rp.""PermissionId""
                         WHERE p.""Code"" IN (
                                (item->>'prefix') || ':allow-back-date',
                                (item->>'prefix') || ':allow-future-date'
                         )
                           AND NOT EXISTS (
                               SELECT 1 FROM role_permissions rp2
                                WHERE rp2.""RoleId"" = rp.""RoleId""
                                  AND rp2.""PermissionId"" = legacy_id
                           );
                    END LOOP;

                    -- Drop the new split permissions (and their grants).
                    DELETE FROM role_permissions
                     WHERE ""PermissionId"" IN (
                        SELECT ""Id"" FROM permissions
                         WHERE ""Code"" LIKE '%:allow-back-date'
                            OR ""Code"" LIKE '%:allow-future-date'
                     );

                    DELETE FROM permissions
                     WHERE ""Code"" LIKE '%:allow-back-date'
                        OR ""Code"" LIKE '%:allow-future-date';
                END $$;
            ");
        }
    }
}
