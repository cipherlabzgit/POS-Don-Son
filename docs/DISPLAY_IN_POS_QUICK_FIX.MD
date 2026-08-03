# Quick Fix for Products Not Showing in POS

## The Problem
Even though your CSV shows `DisplayInPOS=true`, products aren't appearing in the POS system.

## The Root Cause
The products in the **database** have `DisplayInPOS` set to `false` or `NULL`, not `true`. This prevents them from being sent to the POS terminals.

## The Solution (Choose One)

### ⚡ Option 1: PowerShell Script (Recommended)

1. Open PowerShell **as Administrator**
2. Navigate to your project folder:
   ```powershell
   cd "C:\Cipher Labz\DonandSons-New\DonandSons-DMS"
   ```

3. **First**, run the diagnostic to see the issue:
   ```powershell
   .\diagnose-display-in-pos.ps1
   ```

4. **Then**, run the fix script:
   ```powershell
   .\fix-display-in-pos.ps1
   ```

5. **Restart the backend:**
   - If running locally: Stop with Ctrl+C and run `dotnet run` again
   - If using Docker: `docker-compose restart dms-backend`

6. **Refresh POS cache:**
   - Open POS → Click your name (top right) → Click "Refresh cache"
   - Or press F5

### 🗄️ Option 2: Direct Database Fix

If the PowerShell scripts don't work, connect to your database and run:

```sql
UPDATE "Products"
SET "DisplayInPOS" = true
WHERE "DisplayInPOS" = false OR "DisplayInPOS" IS NULL;
```

Then restart backend and refresh POS cache.

### 🐳 Option 3: Docker Command

If using Docker:

```bash
docker exec -it dms-backend-db psql -U dms_user -d dms_erp_db -c "UPDATE \"Products\" SET \"DisplayInPOS\" = true"
```

Then restart and refresh as above.

## Verification

After applying the fix, verify it worked:

1. **Check database:**
   ```sql
   SELECT COUNT(*) AS visible_in_pos
   FROM "Products"
   WHERE "DisplayInPOS" = true;
   ```
   Should return the total number of products.

2. **Check POS:** All your products should now appear in the catalog.

## Files Created

- `diagnose-display-in-pos.ps1` - Diagnostic tool to check the issue
- `fix-display-in-pos.ps1` - Fix script to update all products
- `fix_display_in_pos_products.sql` - SQL script if you prefer manual execution
- `DISPLAY_IN_POS_FIX.md` - Detailed diagnostic guide
- `DISPLAY_IN_POS_QUICK_FIX.md` - This quick reference (you are here)

## Why Did This Happen?

The CSV upload code is correct and sets `displayInPOS: true`. However, there might be:
- A database migration that didn't run
- A default value issue in the database schema
- Old data from before the DisplayInPOS column was added

The fix updates **all** products in the database to have `DisplayInPOS = true`, which is the correct state for a POS system.

## Need More Help?

See `DISPLAY_IN_POS_FIX.md` for detailed troubleshooting steps and explanations.
