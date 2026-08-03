# Don & Sons POS - Deployment Guide

## Table of Contents
- [Why You Can't Copy Just the .exe File](#why-you-cant-copy-just-the-exe-file)
- [Deployment Methods](#deployment-methods)
  - [Method 1: Build Proper Installer (Recommended)](#method-1-build-proper-installer-recommended)
  - [Method 2: Deploy Portable Version](#method-2-deploy-portable-version)
  - [Method 3: Manual Deployment](#method-3-manual-deployment)
- [Troubleshooting](#troubleshooting)

---

## Why You Can't Copy Just the .exe File

The **Don & Sons POS.exe** is built with Electron, which is essentially a web browser running your application. Like a browser, it requires many supporting files to function:

### Required Files and Folders:

```
Don & Sons POS.exe         ← Main executable (205 MB)
├── DLL Files              ← System libraries
│   ├── d3dcompiler_47.dll
│   ├── ffmpeg.dll
│   ├── libEGL.dll
│   └── libGLESv2.dll
├── Resource Files         ← UI assets and data
│   ├── resources.pak
│   ├── chrome_100_percent.pak
│   └── chrome_200_percent.pak
├── locales/               ← Language files
│   └── en-US.pak
├── resources/             ← Application resources
│   └── app.asar
└── Other Files
    ├── icudtl.dat
    ├── snapshot_blob.bin
    └── v8_context_snapshot.bin
```

**Without these files, the .exe will:**
- Fail to start
- Show "DLL not found" errors
- Display blank windows
- Crash immediately

---

## Deployment Methods

### Method 1: Build Proper Installer (Recommended)

Creates a professional Windows installer that:
- ✓ Installs all files correctly
- ✓ Creates shortcuts automatically
- ✓ Adds uninstaller to Control Panel
- ✓ Easy to distribute to multiple computers

#### Steps:

1. **Open PowerShell as Administrator** in the project root

2. **Run the build script:**
   ```powershell
   .\build-pos-installer.ps1
   ```

3. **Wait for build to complete** (5-10 minutes)

4. **Find your installer:**
   - Location: `DMS-POS\release\Don & Sons POS Setup <version>.exe`
   - Size: ~250 MB
   - This single file contains everything

5. **Distribute the installer:**
   - Copy to USB drive
   - Share via network
   - Email (if size permits)
   - Users just double-click to install

#### Installer Features:
- Allows users to choose installation directory
- Creates Desktop shortcut
- Creates Start Menu entry
- Can be uninstalled from Control Panel
- Supports upgrade installations

---

### Method 2: Deploy Portable Version

Uses the existing `win-unpacked` folder to create a portable installation.

#### Quick Deploy:

1. **Update the source path** in `deploy-pos-portable.ps1`:
   ```powershell
   # Edit line 9 with your actual path:
   [string]$SourcePath = "D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked"
   ```

2. **Run the deployment script:**
   ```powershell
   .\deploy-pos-portable.ps1
   ```

   Or with custom destination:
   ```powershell
   .\deploy-pos-portable.ps1 -DestinationPath "C:\MyCustomLocation\POS"
   ```

3. **Script will:**
   - Copy all files to destination
   - Verify critical files are present
   - Create Desktop shortcut
   - Create Start Menu shortcut
   - Offer to launch the application

#### Deploy to Multiple Computers:

**Using USB Drive:**
```powershell
# Copy to USB
Copy-Item -Path "D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked" `
          -Destination "E:\DonAndSons-POS" `
          -Recurse

# On target computer, run:
.\deploy-pos-portable.ps1 -SourcePath "E:\DonAndSons-POS"
```

**Using Network Share:**
```powershell
# Share the folder
New-SmbShare -Name "POS-Install" -Path "D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked" -FullAccess "Everyone"

# On target computer:
.\deploy-pos-portable.ps1 -SourcePath "\\SERVER\POS-Install"
```

---

### Method 3: Manual Deployment

If you prefer manual control:

#### Step 1: Copy Entire Folder

```powershell
# Copy the ENTIRE win-unpacked folder
Copy-Item -Path "D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked" `
          -Destination "C:\Program Files\DonAndSons\DMS-POS" `
          -Recurse -Force
```

**⚠️ IMPORTANT: Copy the ENTIRE folder, not just the .exe!**

#### Step 2: Create Desktop Shortcut

**Option A: Using PowerShell**
```powershell
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Don & Sons POS.lnk")
$Shortcut.TargetPath = "C:\Program Files\DonAndSons\DMS-POS\Don & Sons POS.exe"
$Shortcut.WorkingDirectory = "C:\Program Files\DonAndSons\DMS-POS"
$Shortcut.Description = "Don & Sons Point of Sale"
$Shortcut.Save()
```

**Option B: Using Windows GUI**
1. Navigate to `C:\Program Files\DonAndSons\DMS-POS`
2. Right-click `Don & Sons POS.exe`
3. Select "Create shortcut"
4. Move shortcut to Desktop

#### Step 3: Test Installation

1. Double-click the shortcut
2. Application should launch without errors
3. Check if you can see the login screen

---

## Troubleshooting

### Issue 1: "DLL not found" Error

**Cause:** You copied only the .exe file, not the entire folder

**Solution:**
- Delete the copied .exe
- Copy the **entire** `win-unpacked` folder
- Run the .exe from inside that folder

### Issue 2: Application Won't Start (No Error)

**Possible Causes:**
1. Missing `resources.pak` file
2. Missing `locales` folder
3. Corrupted files during copy

**Solution:**
```powershell
# Verify all critical files are present
$installPath = "C:\Program Files\DonAndSons\DMS-POS"
$criticalFiles = @(
    "Don & Sons POS.exe",
    "ffmpeg.dll",
    "resources.pak",
    "locales\en-US.pak",
    "resources\app.asar"
)

foreach ($file in $criticalFiles) {
    $path = Join-Path $installPath $file
    if (Test-Path $path) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file MISSING!" -ForegroundColor Red
    }
}
```

If files are missing, re-copy the entire folder.

### Issue 3: "Cannot find module" Error

**Cause:** The `resources` folder or `app.asar` file is missing

**Solution:**
- Ensure `resources\app.asar` exists
- Re-copy the entire folder from source

### Issue 4: Application Launches but Shows "Catalogue: No products"

**This is NOT a deployment issue.** This is a server configuration issue.

**Solution:** See the main README section on "Product Configuration"

Quick fix:
```sql
-- Enable products for POS display
UPDATE "Products"
SET "DisplayInPOS" = true
WHERE "IsActive" = true;
```

### Issue 5: Installer Build Fails

**Error:** `electron-builder` fails during build

**Solutions:**

1. **Clean build:**
   ```powershell
   cd DMS-POS
   Remove-Item -Recurse -Force node_modules, dist, release
   npm install
   npm run build
   ```

2. **Check Node.js version:**
   ```powershell
   node --version  # Should be v18 or higher
   ```

3. **Install Windows Build Tools:**
   ```powershell
   npm install --global windows-build-tools
   ```

4. **Check for missing dependencies:**
   ```powershell
   npm audit fix
   ```

---

## Deployment Checklist

### Before Deployment:
- [ ] Backend server is running and accessible
- [ ] Products have `DisplayInPOS = true` in database
- [ ] Network connectivity between POS and server
- [ ] `.env.production` has correct `VITE_API_URL`

### During Deployment:
- [ ] Copy **entire** `win-unpacked` folder OR use installer
- [ ] Verify all critical files are present
- [ ] Create shortcuts for user convenience
- [ ] Test application launches

### After Deployment:
- [ ] Test login with valid credentials
- [ ] Verify products load in catalog
- [ ] Test a sample sale
- [ ] Verify printer connectivity (if applicable)
- [ ] Test offline mode functionality

---

## Quick Reference

| Task | Command |
|------|---------|
| Build installer | `.\build-pos-installer.ps1` |
| Deploy portable | `.\deploy-pos-portable.ps1` |
| Manual copy | Copy entire `win-unpacked` folder |
| Create shortcut | Right-click .exe → Create shortcut |
| Verify files | Run verification script above |

---

## File Sizes

| Item | Size |
|------|------|
| win-unpacked folder | ~400 MB |
| Don & Sons POS.exe | ~205 MB |
| Setup installer | ~250 MB |
| Compressed (ZIP) | ~150 MB |

---

## Additional Notes

### Portable Installation
The `win-unpacked` folder is **fully portable**. You can:
- Copy it to a USB drive
- Run it from any location
- Move it between computers
- No registry entries required
- No admin rights needed (unless copying to Program Files)

### Network Deployment
For multiple POS terminals:
1. Build installer once
2. Copy to network share
3. Run installer on each terminal
4. All terminals connect to same backend server

### Updating POS
To update existing installations:
1. Build new installer with updated version
2. Run installer on target machines
3. Installer will upgrade in-place
4. User settings and data are preserved

---

## Support

If you encounter issues not covered here:
1. Check Windows Event Viewer for crash details
2. Look for log files in `%APPDATA%\dms-pos\logs`
3. Test on a different computer to isolate hardware issues
4. Verify antivirus isn't blocking the application

---

**Last Updated:** May 18, 2026
