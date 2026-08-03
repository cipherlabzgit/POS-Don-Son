# Add PostgreSQL Tools to Windows PATH

## Why?

Adding PostgreSQL to your PATH allows you to use `psql`, `pg_dump`, and other PostgreSQL command-line tools from any directory.

---

## Quick Fix (Current Session Only)

Open Command Prompt or PowerShell and run:

```cmd
set PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin
```

Or for PowerShell:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

**Note**: Replace `16` with your PostgreSQL version number (15, 14, 13, etc.)

This works only for the current terminal session.

---

## Permanent Fix (All Sessions)

### Method 1: Using Windows Settings (GUI)

1. **Open System Properties**:
   - Press `Win + X`
   - Click **System**
   - Scroll down and click **Advanced system settings**
   - Click **Environment Variables**

2. **Find PostgreSQL Installation**:
   - Open File Explorer
   - Navigate to: `C:\Program Files\PostgreSQL\`
   - Note your version folder (e.g., `16`, `15`, `14`)

3. **Add to PATH**:
   - In Environment Variables window, under **System variables** (or **User variables**)
   - Find and select **Path**
   - Click **Edit**
   - Click **New**
   - Add: `C:\Program Files\PostgreSQL\16\bin` (replace `16` with your version)
   - Click **OK** on all windows

4. **Verify**:
   - Open a **NEW** Command Prompt
   - Run: `psql --version`
   - Should show: `psql (PostgreSQL) 16.x`

### Method 2: Using Command Line (PowerShell as Administrator)

1. **Open PowerShell as Administrator**:
   - Press `Win + X`
   - Select **Windows PowerShell (Admin)**

2. **Find your PostgreSQL version**:
   ```powershell
   dir "C:\Program Files\PostgreSQL\"
   ```

3. **Add to PATH** (replace `16` with your version):
   ```powershell
   [Environment]::SetEnvironmentVariable(
       "Path",
       [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\PostgreSQL\16\bin",
       "Machine"
   )
   ```

4. **Restart your terminal** and verify:
   ```cmd
   psql --version
   ```

---

## Common PostgreSQL Installation Paths

Check these locations if PostgreSQL isn't at the default path:

- `C:\Program Files\PostgreSQL\16\bin`
- `C:\Program Files\PostgreSQL\15\bin`
- `C:\Program Files\PostgreSQL\14\bin`
- `C:\PostgreSQL\16\bin`
- `C:\Program Files (x86)\PostgreSQL\16\bin`

---

## Verify Installation

After adding to PATH, open a **new** terminal and test:

```cmd
# Check version
psql --version

# Check other tools
pg_dump --version
pg_restore --version
createdb --version
```

---

## Use the Tools

Now you can run the original deployment commands:

```cmd
# Backup
pg_dump -h localhost -U postgres -d dms_db > backup.sql

# Restore (if needed)
psql -h localhost -U postgres -d dms_db < backup.sql

# Run SQL script
psql -h localhost -U postgres -d dms_db -f clear_permissions.sql
```

---

## Still Not Working?

### Alternative 1: Use Full Path

Instead of adding to PATH, use the full path:

```cmd
"C:\Program Files\PostgreSQL\16\bin\pg_dump" -h localhost -U postgres -d dms_db > backup.sql
```

### Alternative 2: Use pgAdmin (Recommended)

See `DEPLOY_USING_PGADMIN.md` for a GUI-based deployment guide.

---

## PostgreSQL Not Installed?

If you don't have PostgreSQL installed at all:

1. **Download**: https://www.postgresql.org/download/windows/
2. **Run installer**
3. **Note the installation path** during setup
4. **Add to PATH** using steps above

---

**Quick Tip**: After adding to PATH, close ALL terminal windows and open a fresh one. The new PATH won't be available in already-open terminals.
