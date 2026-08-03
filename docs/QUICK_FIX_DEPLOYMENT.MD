# QUICK FIX - Deploy POS Today

**If you need to deploy RIGHT NOW without extensive code changes**

---

## 🚨 CRITICAL: Do This FIRST (5 minutes)

### Step 1: Verify Production Environment File

Check if `.env.production` exists in `DMS-POS` folder:

```bash
cd DMS-POS
ls .env.production
```

✅ **If it exists**: Good! It should contain:
```
VITE_API_URL=http://123.231.10.22:5126
```

❌ **If it doesn't exist**: I just created it for you! It's there now.

### Step 2: Build the Installer

```bash
cd DMS-POS
npm install  # If not already done
npm run build
```

**This takes 2-5 minutes**

Output will be in: `DMS-POS/release/Don & Sons POS Setup 2.0.0.exe`

### Step 3: Verify API URL in Build

**CRITICAL CHECK before deploying!**

Open the built app to verify:

```bash
# Run the installer OR
# Open: DMS-POS\dist\index.html in a text editor
# Search for: "123.231.10.22"
# You should find it in the JavaScript code
```

If you see `localhost:5126` instead → **STOP! Build failed to use production config**

---

## 🛠️ If Build Uses Wrong URL

If the built app still has `localhost:5126`:

### Option A: Force Environment Variable

```bash
# Windows PowerShell
$env:VITE_API_URL="http://123.231.10.22:5126"
npm run build
```

### Option B: Create .env File

```bash
# Create DMS-POS/.env file
echo VITE_API_URL=http://123.231.10.22:5126 > .env
npm run build
```

### Option C: Hardcode (Last Resort)

Edit `DMS-POS/src/lib/settings-store.ts`:

```typescript
// Change this line:
export const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5126'

// To this:
export const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://123.231.10.22:5126'
```

Then rebuild.

---

## ✅ Verification Checklist

Before deploying to locations:

- [ ] Installer built successfully
- [ ] Installer size is ~80-150 MB
- [ ] Test install on a clean Windows PC (not your dev machine)
- [ ] After install, open POS
- [ ] Check if it connects to `http://123.231.10.22:5126` (not localhost)
- [ ] Try logging in - should work
- [ ] Try selecting outlet - outlets should load
- [ ] Create test sale - should work

---

## 🚀 Deploy Now

Once verified:

1. Copy installer to USB drive
2. Follow [FIELD_DEPLOYMENT_GUIDE.md](FIELD_DEPLOYMENT_GUIDE.md)
3. Use [QUICK_REFERENCE_CARD.md](QUICK_REFERENCE_CARD.md)
4. Deploy to Location #1

---

## 🆘 Emergency: Manual Fix After Installation

If you already deployed with wrong API URL:

### Fix on Each PC:

1. Open POS
2. Press `F12` to open DevTools
3. Go to **Application** tab
4. Expand **Local Storage**
5. Click on the domain
6. Find key: `dms-pos-settings`
7. Click on the value
8. Find `"apiBaseUrl":"http://localhost:5126"`
9. Change to `"apiBaseUrl":"http://123.231.10.22:5126"`
10. Press `Enter`
11. Refresh the page (`F5`)
12. Try logging in - should work now!

**Add this as "Manual Configuration" step in deployment guide if needed**

---

## 📞 Still Having Issues?

1. Check `INSTALLATION_IMPROVEMENTS_ANALYSIS.md` for detailed analysis
2. Verify backend is running: `curl http://123.231.10.22:5126/health`
3. Check if outlets exist in database: `.\get-outlet-guids.ps1`
4. Review build output for errors
5. Test on non-development PC

---

**Once this is working, consider implementing the other improvements in INSTALLATION_IMPROVEMENTS_ANALYSIS.md for better deployment experience.**
