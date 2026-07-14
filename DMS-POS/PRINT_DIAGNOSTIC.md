# POS Print Diagnostic Guide

## Testing Print Functionality with XP-80C Thermal Printer

### Step 1: Install the New Build
```
C:\Cipher Labz\DonandSons-New\DonandSons-DMS\DMS-POS\release\Don & Sons POS Setup 2.0.0.exe
```

### Step 2: Open Developer Tools
Press `F12` or `Ctrl+Shift+I` to open DevTools

### Step 3: Make a Test Sale
1. Add items to cart
2. Click "Pay"
3. Select "Cash"  
4. Enter amount (e.g., 2000)
5. Click "Complete sale"

### Step 4: Check Console Logs

You should see these logs in sequence:

#### ✅ Expected Frontend Logs:
```
[PRINT] Environment check - window.dmsPos: true
[PRINT] window.dmsPos.printSilent: true  
[PRINT] window.dmsPos.mode: electron
[PRINT] Using Electron print...
[PRINT] Receipt data: {total: ..., cash: ..., change: ..., lines: ...}
```

#### ✅ Expected Main Process Logs (now visible in console):
```
[ELECTRON-PRINT] ========================================
[ELECTRON-PRINT] Print request received!
[ELECTRON-PRINT] HTML length: 5432
[ELECTRON-PRINT] Main window exists: true
[ELECTRON-PRINT] ========================================
[ELECTRON-PRINT] Loading HTML into print window...
[ELECTRON-PRINT] Content loaded, waiting 200ms for rendering...
[ELECTRON-PRINT] Opening print dialog...
[ELECTRON-PRINT] Print method called, waiting for callback...
```

#### ✅ After Print Dialog:
```
[ELECTRON-PRINT] Print callback - success: true
[ELECTRON-PRINT] Print completed successfully
[PRINT] Electron print result: {success: true}
```

### Common Issues:

**Issue 1: No [ELECTRON-PRINT] logs**
- IPC communication problem
- Electron main process not responding

**Issue 2: Logs stop at "Opening print dialog..."**
- Print dialog may be hidden behind other windows
- Check taskbar for print dialog window
- Timeout will trigger after 60 seconds

**Issue 3: success: false**
- User cancelled print dialog
- Printer not configured/available
- Check Windows default printer settings

### XP-80C Thermal Printer Setup:

1. **Install XP-80C Driver**
   - Download from manufacturer
   - Install and test print from Notepad

2. **Set as Default Printer**
   - Settings > Devices > Printers & scanners
   - Click XP-80C printer
   - Click "Manage" > "Set as default"

3. **Test Print**
   - Right-click printer > "Print Test Page"
   - Should print successfully

4. **Paper Width**
   - XP-80C uses 80mm thermal paper
   - Receipt is designed for 80mm width

### If Print Dialog Doesn't Appear:

The timeout (60 seconds) will automatically resolve as success.
The dialog may be:
- Hidden behind the POS window
- Minimized to taskbar
- On another monitor

**Solution**: Check all open windows and taskbar!
