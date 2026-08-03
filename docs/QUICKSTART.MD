# Remote POS - 5-Minute Quick Start

**Want to deploy to your first remote location RIGHT NOW? Follow these steps.**

---

## Prerequisites (Check These First)

- [ ] Backend running at `http://123.231.10.22:5126`
- [ ] You have an outlet created in the database (note the GUID)
- [ ] Remote PC has Windows 10+ with internet connection
- [ ] You have admin credentials for the remote PC

---

## Step 1: Build Installer (5 minutes)

```bash
cd DMS-POS
npm install
npm run build
```

**Output**: `DMS-POS/release/Don & Sons POS Setup 2.0.0.exe`

---

## Step 2: Copy to Remote Location

Choose ONE method:

**A. USB Drive** (Best for remote areas)
```bash
# Copy installer to USB
copy "DMS-POS\release\Don & Sons POS Setup 2.0.0.exe" "E:\"
```

**B. Network Share** (Best for LAN)
```bash
# Copy to shared folder
copy "DMS-POS\release\Don & Sons POS Setup 2.0.0.exe" "\\fileserver\deployments\"
```

**C. Remote Desktop** (Best for remote access)
- Connect via TeamViewer/AnyDesk
- Download installer directly on remote PC

---

## Step 3: Install on Remote PC (2 minutes)

1. Right-click installer → **Run as Administrator**
2. Click through installation wizard
3. Desktop shortcut "Don & Sons POS" will be created

---

## Step 4: First Launch & Configuration (5 minutes)

1. **Launch** "Don & Sons POS" from desktop
2. **Login** with your backend credentials
3. **Select Outlet** from dropdown (this is critical!)
4. **Wait** for initial sync (products download)
   - Progress bar will show
   - Takes 1-2 minutes depending on product count
5. **Done!** POS is ready to use

---

## Step 5: Test Sync (5 minutes)

### Test Online Mode
1. Create a test sale with 2-3 products
2. Complete payment (Cash)
3. Check transaction history - should show "Synced"
4. Verify on backend - sale should appear

### Test Offline Mode
1. Disconnect internet (disable WiFi)
2. Create another test sale
3. Status shows "Pending Sync"
4. Reconnect internet
5. Wait 5-10 seconds
6. Sale syncs automatically!

---

## Done! 🎉

Your remote POS is now operational. It will:

- ✅ Work completely offline
- ✅ Queue sales locally
- ✅ Auto-sync every 60 seconds when online
- ✅ Retry failed syncs automatically
- ✅ Handle network interruptions gracefully

---

## Troubleshooting

### Problem: "Cannot connect to server"

**Solution**: Check API URL in settings
1. Open DevTools: `Ctrl+Shift+I`
2. Console tab
3. Type: `localStorage.getItem('dms-pos-settings')`
4. Check `apiBaseUrl` is correct: `http://123.231.10.22:5126`

### Problem: "No products loading"

**Solution**: Manual sync
1. Logout
2. Login again
3. Products will re-sync

### Problem: "Sales not syncing"

**Solution**: Check network
1. Verify internet connection
2. Ping server: `ping 123.231.10.22`
3. Check if backend is running
4. Sales will sync automatically once online

---

## Advanced: Use PowerShell Script

For faster deployment:

```powershell
.\deploy-pos-remote.ps1 `
  -LocationId "LOCATION-001" `
  -OutletId "your-outlet-guid-here" `
  -OutletName "Branch Office"
```

This automates the entire process.

---

## What's Next?

- **Read full guide**: `DEPLOYMENT_GUIDE_REMOTE_POS.md`
- **Use checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Deploy to remaining 12 locations**: Same process!

---

## Need Help?

1. Check diagnostics: `Ctrl+Shift+D` in POS
2. Check logs: DevTools Console (`Ctrl+Shift+I`)
3. Review troubleshooting: `DEPLOYMENT_GUIDE_REMOTE_POS.md`
4. Contact: info@cipherlabz.com

---

**That's it! Your remote POS is live. Repeat for locations 2-13.**
