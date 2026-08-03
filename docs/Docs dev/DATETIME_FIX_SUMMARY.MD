# DateTime Fix Summary

## Problem

The backend was throwing the following error during startup:

```
[17:39:53 ERR] An exception occurred in the database while saving changes
System.ArgumentException: Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone', only UTC is supported.
```

This error occurred when seeding the `ShowroomOpenStock` table with development data.

## Root Cause

PostgreSQL's `timestamp with time zone` type requires DateTime values to explicitly have `DateTimeKind.Utc`. When DateTime values are created without specifying the Kind (resulting in `DateTimeKind.Unspecified`), Npgsql rejects them.

The specific issue was in `DevDataSeeder.cs` line 192:

```csharp
var defaultStockDate = new DateTime(2026, 1, 10);  // Creates DateTime with Kind=Unspecified
```

## Solution

### 1. Fixed the Seeder DateTime Creation

**File:** `DMS-Backend/Data/Seeders/DevDataSeeder.cs`

**Changed line 192 from:**
```csharp
var defaultStockDate = new DateTime(2026, 1, 10);
```

**To:**
```csharp
var defaultStockDate = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
```

### 2. Configured Npgsql to Enforce UTC

**File:** `DMS-Backend/Program.cs`

**Added at the top of the file (before `var builder = WebApplication.CreateBuilder(args);`):**

```csharp
// Configure Npgsql to use UTC timestamps
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false);
```

This setting ensures:
- DateTime values without explicit `DateTimeKind.Utc` are rejected at the Npgsql level
- All DateTime values read from the database are returned with `DateTimeKind.Utc`
- No implicit local time conversions occur

### 3. Added System.Text.Json Import

**File:** `DMS-Backend/Program.cs`

Added `using System.Text.Json;` to the imports (for future JSON serialization configuration if needed).

## Verification

After the fix, the backend starts successfully with the following logs:

```
[17:45:03 INF] Showroom open stock seeded for 1 outlets with date 2026-01-10
[17:45:03 INF] Dev data seed completed successfully
[17:45:03 INF] Database seeded successfully
[17:45:03 INF] DMS Backend API started successfully
```

**No DateTime errors!**

## Best Practices Going Forward

1. **Always use `DateTime.UtcNow`** for current timestamps
2. **Always specify `DateTimeKind.Utc`** when creating DateTime literals:
   ```csharp
   var date = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
   ```
3. **Never use `DateTime.Now`** - always use `DateTime.UtcNow`
4. **Never use `DateTime.Today`** - use `DateTime.UtcNow.Date` or wrap with `DateTime.SpecifyKind(..., DateTimeKind.Utc)`

## Files Modified

1. `DMS-Backend/Data/Seeders/DevDataSeeder.cs` - Fixed DateTime creation
2. `DMS-Backend/Program.cs` - Added Npgsql UTC enforcement and import

## Status

✅ **FIXED** - Backend starts successfully without DateTime errors
