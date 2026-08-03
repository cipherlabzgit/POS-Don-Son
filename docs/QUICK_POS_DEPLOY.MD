# Quick POS Deployment - Step by Step

## Current Situation
You have the POS files at:
```
D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked
```

**Problem:** Copying just `Don & Sons POS.exe` to another location doesn't work because it needs all the other files in that folder.

---

## Solution 1: Automated Deployment (EASIEST)

### For Current Computer:

1. **Open PowerShell** in the project root:
   ```powershell
   cd "C:\Cipher Labz\DonandSons-New\DonandSons-DMS"
   ```

2. **Edit the script** with your actual path:
   ```powershell
   notepad deploy-pos-portable.ps1
   ```
   
   Change line 9:
   ```powershell
   [string]$SourcePath = "D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked",
   ```

3. **Run the script:**
   ```powershell
   .\deploy-pos-portable.ps1
   ```

4. **Done!** The script will:
   - Copy all files to `C:\Program Files\DonAndSons\DMS-POS`
   - Create Desktop shortcut
   - Create Start Menu entry
   - Verify all files are present

### For Other Computers:

**Option A: USB Drive**
1. Copy entire `win-unpacked` folder to USB drive
2. On target computer, copy folder from USB
3. Run the `deploy-pos-portable.ps1` script

**Option B: Network Share**
1. Share the `win-unpacked` folder on network
2. On target computer, run:
   ```powershell
   .\deploy-pos-portable.ps1 -SourcePath "\\SERVER-NAME\shared-folder\win-unpacked"
   ```

---

## Solution 2: Manual Copy (QUICK)

### Step 1: Copy Entire Folder

**Using File Explorer:**
1. Go to: `D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release`
2. **Right-click** the `win-unpacked` folder
3. Select **Copy**
4. Navigate to where you want to install (e.g., `C:\Program Files\DonAndSons`)
5. **Paste** the folder
6. Rename it to `DMS-POS` (optional)

**Using PowerShell:**
```powershell
Copy-Item -Path "D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked" `
          -Destination "C:\Program Files\DonAndSons\DMS-POS" `
          -Recurse -Force
```

### Step 2: Create Desktop Shortcut

1. Navigate to: `C:\Program Files\DonAndSons\DMS-POS`
2. Find `Don & Sons POS.exe`
3. **Right-click** → **Send to** → **Desktop (create shortcut)**

OR using PowerShell:
```powershell
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Don & Sons POS.lnk")
$Shortcut.TargetPath = "C:\Program Files\DonAndSons\DMS-POS\Don & Sons POS.exe"
$Shortcut.WorkingDirectory = "C:\Program Files\DonAndSons\DMS-POS"
$Shortcut.Save()
```

### Step 3: Test It

Double-click the Desktop shortcut. The POS should launch!

---

## Solution 3: Build Professional Installer

If you need to deploy to many computers, build a proper installer:

1. **Open PowerShell as Administrator**:
   ```powershell
   cd "C:\Cipher Labz\DonandSons-New\DonandSons-DMS"
   ```

2. **Run the build script:**
   ```powershell
   .\build-pos-installer.ps1
   ```

3. **Wait 5-10 minutes** for the build to complete

4. **Find your installer:**
   - Look in: `DMS-POS\release\`
   - File: `Don & Sons POS Setup 2.0.0.exe` (or similar)
   - Size: ~250 MB

5. **Distribute this single file** to other computers
   - Copy to USB drive
   - Share on network
   - Users just double-click to install

---

## What NOT to Do

❌ **DON'T** copy just the `Don & Sons POS.exe` file  
❌ **DON'T** copy only some of the files  
❌ **DON'T** forget to copy the `locales` and `resources` folders  

✅ **DO** copy the entire `win-unpacked` folder  
✅ **DO** keep all files together in the same folder  
✅ **DO** create shortcuts pointing to the .exe inside that folder  

---

## Verification Checklist

After copying/deploying, verify these files exist:

```
C:\Program Files\DonAndSons\DMS-POS\
├── ✓ Don & Sons POS.exe
├── ✓ ffmpeg.dll
├── ✓ d3dcompiler_47.dll
├── ✓ libEGL.dll
├── ✓ libGLESv2.dll
├── ✓ resources.pak
├── ✓ chrome_100_percent.pak
├── ✓ chrome_200_percent.pak
├── ✓ icudtl.dat
├── ✓ snapshot_blob.bin
├── ✓ v8_context_snapshot.bin
├── ✓ locales\ (folder with multiple .pak files)
└── ✓ resources\ (folder with app.asar)
```

**Quick check using PowerShell:**
```powershell
$files = @(
    "Don & Sons POS.exe",
    "ffmpeg.dll",
    "resources.pak",
    "locales\en-US.pak",
    "resources\app.asar"
)

$basePath = "C:\Program Files\DonAndSons\DMS-POS"

foreach ($file in $files) {
    $path = Join-Path $basePath $file
    if (Test-Path $path) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file MISSING!" -ForegroundColor Red
    }
}
```

If all show ✓ green checkmarks, you're good to go!

---

## Troubleshooting

### Issue: Application won't start
**Solution:** You probably didn't copy all files. Delete and copy the entire folder again.

### Issue: "DLL not found" error
**Solution:** Missing DLL files. Copy the entire `win-unpacked` folder, not just the .exe.

### Issue: Blank window or immediate crash
**Solution:** Missing `resources.pak` or `locales` folder. Copy entire folder again.

### Issue: "No products in cache"
**Solution:** This is NOT a deployment issue. Check:
1. Is the backend server running?
2. Can the POS reach the server? (check `.env.production` URL)
3. Do products have `DisplayInPOS = true` in the database?

---

## File Sizes Reference

| Item | Approximate Size |
|------|------------------|
| Entire win-unpacked folder | ~400 MB |
| Don & Sons POS.exe alone | ~205 MB |
| All DLL files combined | ~30 MB |
| resources.pak | ~6 MB |
| locales folder | ~10 MB |

If your copied folder is much smaller than 400 MB, you probably didn't copy everything!

---

## Quick Commands

**Copy to Program Files:**
```powershell
Copy-Item -Path "D:\New Volume (D:)\System\DonandSons-DMS\DMS-POS\release\win-unpacked" -Destination "C:\Program Files\DonAndSons\DMS-POS" -Recurse -Force
```

**Create Desktop Shortcut:**
```powershell
$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Don & Sons POS.lnk"); $Shortcut.TargetPath = "C:\Program Files\DonAndSons\DMS-POS\Don & Sons POS.exe"; $Shortcut.WorkingDirectory = "C:\Program Files\DonAndSons\DMS-POS"; $Shortcut.Save()
```

**Run Automated Deploy:**
```powershell
.\deploy-pos-portable.ps1
```

**Build Installer:**
```powershell
.\build-pos-installer.ps1
```

---

**Need more help?** See `POS_DEPLOYMENT_GUIDE.md` for detailed information.
