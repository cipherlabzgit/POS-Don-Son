using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <summary>
    /// Permission catalog fan-out: every page (subsection) in the sidebar
    /// permission map now exposes the FULL set of <c>ActionKey</c> columns
    /// (View, Create, Edit, Delete, Approve, Reject, Print, Export, Import,
    /// Execute, Generate, Lock, Back/Future Date) so the role permissions
    /// matrix shows a checkbox in every cell instead of a dash.
    ///
    /// This migration mirrors <c>fillActions(prefix, ...)</c> in the frontend
    /// <c>permission-map.ts</c> by inserting <c>{prefix}:{action-suffix}</c>
    /// rows for every (prefix, action) combination that doesn't already exist.
    /// Existing codes (e.g. <c>operation:delivery:update</c> for the
    /// historical "edit" action) are preserved untouched.
    ///
    /// Newly inserted permissions are also auto-granted to any role whose
    /// name matches "Administrator" / "System Administrator" / "Super Admin"
    /// so the highest-privilege role keeps full coverage. The Super Admin
    /// USER (IsSuperAdmin = true) bypasses all permission checks via the
    /// JWT "*" wildcard, so that user automatically gains the new permissions
    /// without any role grant.
    /// </summary>
    public partial class AddAllActionsToAllPermissions : Migration
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

                    actions JSONB := '[
                        {""suffix"": ""view"",              ""label"": ""View""},
                        {""suffix"": ""create"",            ""label"": ""Create""},
                        {""suffix"": ""edit"",              ""label"": ""Update""},
                        {""suffix"": ""delete"",            ""label"": ""Delete""},
                        {""suffix"": ""approve"",           ""label"": ""Approve""},
                        {""suffix"": ""reject"",            ""label"": ""Reject""},
                        {""suffix"": ""print"",             ""label"": ""Print""},
                        {""suffix"": ""import"",            ""label"": ""Import""},
                        {""suffix"": ""export"",            ""label"": ""Export""},
                        {""suffix"": ""execute"",           ""label"": ""Execute""},
                        {""suffix"": ""generate"",          ""label"": ""Generate""},
                        {""suffix"": ""lock"",              ""label"": ""Lock""},
                        {""suffix"": ""allow-back-future"", ""label"": ""AllowBackFuture""}
                    ]'::jsonb;

                    item            JSONB;
                    act             JSONB;
                    p_code          TEXT;
                    p_name          TEXT;
                    p_module        TEXT;
                    p_desc          TEXT;
                    p_id            UUID;
                    next_order      INT;
                    inserted_count  INT := 0;
                    granted_count   INT := 0;
                BEGIN
                    SELECT COALESCE(MAX(""DisplayOrder""), 0) + 1
                      INTO next_order
                      FROM permissions;

                    -- ----------------------------------------------------------------
                    -- Insert any missing {prefix}:{action} permission rows.
                    -- ----------------------------------------------------------------
                    FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
                        FOR act IN SELECT * FROM jsonb_array_elements(actions) LOOP
                            p_code   := (item->>'prefix') || ':' || (act->>'suffix');
                            p_name   := (act->>'label')   || ' '  || (item->>'sub');
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
                    -- Grant every permission (including the new ones) to any role
                    -- whose name looks like an administrator role. The Super Admin
                    -- USER bypasses permission checks via IsSuperAdmin so they
                    -- automatically get the new permissions without an explicit
                    -- role grant.
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
                       AND NOT EXISTS (
                           SELECT 1
                             FROM role_permissions rp
                            WHERE rp.""RoleId"" = r.""Id""
                              AND rp.""PermissionId"" = p.""Id""
                       );

                    GET DIAGNOSTICS granted_count = ROW_COUNT;

                    RAISE NOTICE 'AddAllActionsToAllPermissions: inserted % permission(s), granted % role-permission row(s) to admin role(s).',
                        inserted_count, granted_count;
                END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Best-effort rollback: remove every permission whose code matches
            // a {prefix}:{action-suffix} produced by the Up() fan-out and which
            // is NOT a "historical" code that pre-dated this migration.
            //
            // We're conservative here: we keep any permission code that is
            // referenced by any role assignment (so revoking the migration
            // doesn't surprise-delete grants made by the user after applying).
            migrationBuilder.Sql(@"
                DO $$
                DECLARE
                    items JSONB := '[
                        {""prefix"": ""dashboard""},
                        {""prefix"": ""products""},
                        {""prefix"": ""categories""},
                        {""prefix"": ""unit-of-measure""},
                        {""prefix"": ""ingredients""},
                        {""prefix"": ""showroom""},
                        {""prefix"": ""operation:delivery""},
                        {""prefix"": ""operation:delivery-return""},
                        {""prefix"": ""operation:disposal""},
                        {""prefix"": ""operation:transfer""},
                        {""prefix"": ""operation:stock-bf""},
                        {""prefix"": ""operation:cancellation""},
                        {""prefix"": ""operation:label-printing""},
                        {""prefix"": ""operation:showroom-label-printing""},
                        {""prefix"": ""operation:showroom-open-stock""},
                        {""prefix"": ""operation:approvals""},
                        {""prefix"": ""production:daily""},
                        {""prefix"": ""production:cancel""},
                        {""prefix"": ""production:plan""},
                        {""prefix"": ""production:current-stock""},
                        {""prefix"": ""production:stock-adjustment""},
                        {""prefix"": ""production:shift""},
                        {""prefix"": ""order""},
                        {""prefix"": ""delivery_plan""},
                        {""prefix"": ""delivery-summary""},
                        {""prefix"": ""immediate_order""},
                        {""prefix"": ""default_quantity""},
                        {""prefix"": ""production-planner""},
                        {""prefix"": ""stores-issue-note""},
                        {""prefix"": ""recipes""},
                        {""prefix"": ""recipe-templates""},
                        {""prefix"": ""freezer_stock""},
                        {""prefix"": ""anytime-recipe""},
                        {""prefix"": ""dough-generator""},
                        {""prefix"": ""dms-recipe""},
                        {""prefix"": ""dashboard-pivot""},
                        {""prefix"": ""print:receipt-cards""},
                        {""prefix"": ""print:section-bundle""},
                        {""prefix"": ""xlsm-importer""},
                        {""prefix"": ""reconciliation""},
                        {""prefix"": ""reports""},
                        {""prefix"": ""reports:sales""},
                        {""prefix"": ""reports:delivery""},
                        {""prefix"": ""reports:disposal""},
                        {""prefix"": ""reports:inventory""},
                        {""prefix"": ""reports:product""},
                        {""prefix"": ""reports:showroom""},
                        {""prefix"": ""reports:category""},
                        {""prefix"": ""reports:daily""},
                        {""prefix"": ""reports:monthly""},
                        {""prefix"": ""reports:profit""},
                        {""prefix"": ""reports:financial""},
                        {""prefix"": ""reports:production""},
                        {""prefix"": ""day-end""},
                        {""prefix"": ""cashier-balance""},
                        {""prefix"": ""setting""},
                        {""prefix"": ""label-settings""},
                        {""prefix"": ""admin-delivery-plan""},
                        {""prefix"": ""security-policies""},
                        {""prefix"": ""users""},
                        {""prefix"": ""roles""},
                        {""prefix"": ""permissions""},
                        {""prefix"": ""admin""},
                        {""prefix"": ""approval""},
                        {""prefix"": ""employee""},
                        {""prefix"": ""pricing""},
                        {""prefix"": ""workflow-config""},
                        {""prefix"": ""grid-config""},
                        {""prefix"": ""day_type""},
                        {""prefix"": ""delivery_turn""},
                        {""prefix"": ""rounding-rules""},
                        {""prefix"": ""section-consumables""},
                        {""prefix"": ""label-templates""}
                    ]'::jsonb;
                    suffixes TEXT[] := ARRAY[
                        'view','create','edit','delete','approve','reject',
                        'print','import','export','execute','generate','lock',
                        'allow-back-future'
                    ];
                    item   JSONB;
                    suf    TEXT;
                    p_code TEXT;
                BEGIN
                    FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
                        FOREACH suf IN ARRAY suffixes LOOP
                            p_code := (item->>'prefix') || ':' || suf;
                            DELETE FROM permissions
                             WHERE ""Code"" = p_code
                               AND NOT EXISTS (
                                   SELECT 1 FROM role_permissions rp
                                    WHERE rp.""PermissionId"" = permissions.""Id""
                               );
                        END LOOP;
                    END LOOP;
                END $$;
            ");
        }
    }
}
