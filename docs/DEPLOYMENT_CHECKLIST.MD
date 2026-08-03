# Remote POS Deployment Checklist

## Pre-Deployment (Do Once)

### Backend Preparation
- [ ] Verify backend is accessible from remote location
  - [ ] Test: `curl http://123.231.10.22:5126/health` from remote PC
- [ ] Configure CORS to allow remote origin
- [ ] Create Outlet in database for Location #1
  - [ ] Note down Outlet ID (GUID)
  - [ ] Note down Outlet Name
- [ ] Ensure JWT configuration is correct in `.env`
- [ ] Backend is running and healthy

### Build POS Installer
- [ ] `cd DMS-POS`
- [ ] `npm install` (if needed)
- [ ] `npm run build`
- [ ] Locate installer: `DMS-POS/release/Don & Sons POS Setup 2.0.0.exe`
- [ ] Test installer on a test PC first

---

## For Each Location

### Location Information
```
Location ID: _______________________
Outlet ID (GUID): __________________
Outlet Name: _______________________
Network: Static IP / DHCP
Remote PC Name: ____________________
Windows User: ______________________
```

### 1. Copy Installer to Remote Location
- [ ] Method used: □ USB Drive  □ Network Share  □ Remote Desktop  □ TeamViewer
- [ ] Installer copied successfully
- [ ] File size verified (approx. 80-150 MB)

### 2. Installation
- [ ] Run installer as Administrator
- [ ] Installation completed successfully
- [ ] Desktop shortcut created
- [ ] No installation errors

### 3. First Launch
- [ ] Application opens
- [ ] Login screen appears
- [ ] Internet connection is active

### 4. Configuration
- [ ] Login with valid credentials
  - Username: _______________________
  - Password: (secure)
- [ ] Select outlet from dropdown
  - Outlet: _______________________
- [ ] Verify API URL (if needed)
  - API URL: http://123.231.10.22:5126

### 5. Initial Sync
- [ ] Product sync started automatically
- [ ] Categories downloaded
- [ ] Sync completed successfully
- [ ] Product count matches backend: _______ products

### 6. Testing - Online Mode
- [ ] Create test sale with 2-3 products
- [ ] Payment method: Cash
- [ ] Total calculated correctly
- [ ] Sale saved and synced
- [ ] Verify on backend: Sale appears in web dashboard
- [ ] Transaction ID: _______________________

### 7. Testing - Offline Mode
- [ ] Disconnect internet (disable WiFi/unplug ethernet)
- [ ] Offline indicator appears
- [ ] Create test sale #1
  - [ ] Sale created locally
  - [ ] Status shows "Pending Sync"
- [ ] Create test sale #2
  - [ ] Sale created locally
- [ ] Create test sale #3
  - [ ] Sale created locally

### 8. Testing - Reconnect & Sync
- [ ] Reconnect internet
- [ ] Wait 5 seconds
- [ ] Sync progress indicator appears
- [ ] All 3 pending sales synced successfully
- [ ] Status changed to "Synced"
- [ ] Verify on backend: All 3 sales present
  - Sale 1 ID: _______________________
  - Sale 2 ID: _______________________
  - Sale 3 ID: _______________________

### 9. Receipt Printing (If Applicable)
- [ ] Printer connected
- [ ] Test print receipt
- [ ] Receipt prints correctly
- [ ] Configure auto-print if needed

### 10. Settings Configuration
- [ ] Receipt phone number: _______________________
- [ ] Receipt address: _______________________
- [ ] Auto-print: □ Enabled  □ Disabled
- [ ] Zoom level: _______% (default 100%)

### 11. User Training
- [ ] Staff trained on POS operation
- [ ] Staff knows how to handle offline scenarios
- [ ] Staff knows how to check sync status
- [ ] Emergency contact provided: _______________________

### 12. Documentation
- [ ] Outlet ID recorded in central register
- [ ] PC details documented
- [ ] Network configuration documented
- [ ] Installation date: _______________________
- [ ] Installed by: _______________________

---

## Post-Deployment Monitoring (First Week)

### Day 1
- [ ] Check sync status at end of day
- [ ] Verify all sales synced
- [ ] No errors in dropped_mutations table

### Day 3
- [ ] Monitor for any connectivity issues
- [ ] Check pending queue is empty
- [ ] Verify product catalog is up to date

### Day 7
- [ ] Review transaction volume
- [ ] Check database size
- [ ] Collect user feedback
- [ ] Address any issues

---

## Troubleshooting Reference

### Cannot Connect to Server
1. Check internet: `ping 123.231.10.22`
2. Check backend: `curl http://123.231.10.22:5126/health`
3. Check firewall settings
4. Verify API URL in POS settings

### Sales Not Syncing
1. Open DevTools (Ctrl+Shift+I)
2. Check Console for errors
3. Verify authentication token is valid
4. Check pending queue count

### Products Not Loading
1. Check if initial sync completed
2. Manually refresh catalog
3. Check local database has products
4. Re-login if needed

### App Crashes
1. Check Windows Event Viewer
2. Clear local storage and restart
3. Re-install if needed
4. Contact support

---

## Rollback Plan (If Deployment Fails)

1. Uninstall POS application
2. Delete local database: `%APPDATA%\dms-pos\`
3. Document failure reason
4. Try on different PC if hardware issue
5. Contact support: info@cipherlabz.com

---

## Sign-Off

**Deployment Completed By**: _______________________  
**Date**: _______________________  
**Time**: _______________________  
**Status**: □ Success  □ Failed  □ Partial  

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Verified By**: _______________________  
**Date**: _______________________  
