# Docker Migration Issue - FIXED

## Problem Summary

When running the application in Docker with a fresh database, the backend container failed to start with the following error:

```
Npgsql.PostgresException (0x80004005): 42P01: relation "product_weight_variants" does not exist
```

The application worked fine without Docker because the local database already had all tables created.

## Root Cause

The migration file `20260519141900_EnsureAllSchemaColumns.cs` was attempting to create foreign key constraints that referenced tables (`product_weight_variants`, `recipe_plans`, `label_templates`, `production_sections`) before checking if those tables existed.

When running on a fresh database, the migration would fail because:
1. It checked if the **column** exists (e.g., `weight_variant_id` in `delivery_plan_items`)
2. But didn't check if the **referenced table** exists (e.g., `product_weight_variants`)
3. The foreign key creation would fail because the referenced table didn't exist yet

## Solution Applied

Updated the migration `20260519141900_EnsureAllSchemaColumns.cs` to check for table existence before creating foreign keys:

### Fixed Foreign Key Constraints:

1. **delivery_plan_items → product_weight_variants**
   - Added check: `AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_weight_variants')`

2. **delivery_plans → recipe_plans**
   - Added check: `AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recipe_plans')`

3. **products → label_templates**
   - Added check: `AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'label_templates')`

4. **products → production_sections**
   - Added check: `AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_sections')`

## Verification

After the fix, the application starts successfully in Docker:

```
✅ Container dms-postgres: Up and healthy
✅ Container dms-backend: Up and healthy (HTTP 200)
✅ Container dms-frontend: Up and healthy
✅ Container dms-pos: Up and healthy
```

Backend logs show successful startup:
- Database migrations completed
- WorkflowConfigDataSeeder: inserted 14 workflow operations
- AutoApprovalConfigSeeder: inserted 15 auto-approval configs
- DMS Backend API started successfully

## Testing the Fix

1. Stop and remove all Docker containers and volumes:
   ```bash
   docker compose down -v
   ```

2. Rebuild and start containers:
   ```bash
   docker compose up --build -d
   ```

3. Monitor backend logs:
   ```bash
   docker logs -f dms-backend
   ```

4. Verify all containers are healthy:
   ```bash
   docker ps --filter "name=dms-"
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5126
   - POS: http://localhost:5174

## Environment Configuration

Your `.env` file is now configured for Docker with:
- `POSTGRES_USER=postgres` (matches local development)
- `DEV_SEED_ENABLED=false` (production mode - no demo data)
- All services configured for localhost access

## Files Modified

- `DMS-Backend/Migrations/20260519141900_EnsureAllSchemaColumns.cs` - Added table existence checks
- `.env` - Updated database user and seeding configuration

## Next Steps

The application should now work correctly in Docker. You can:

1. Access the Administrator/Approvals page at: http://localhost:3000/administrator/approvals
2. The database will be empty unless you set `DEV_SEED_ENABLED=true` to create sample data
3. All migrations will run automatically on container startup

---
**Fixed on:** May 28, 2026
**Status:** ✅ RESOLVED
