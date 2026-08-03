# Don & Sons POS - Field Deployment Guide
## For Non-Technical Installation Personnel

**Version**: 1.0  
**Last Updated**: May 18, 2026  
**Difficulty**: Beginner (No technical knowledge required)

---

## 📋 What This Guide Is For

This guide will help you install the Don & Sons POS (Point of Sale) system at a remote outlet/showroom. You don't need to be a computer expert - just follow the steps carefully.

**What you'll do:**
1. Copy the installer to the outlet PC
2. Install the POS software
3. Open the POS application
4. Login
5. Select the outlet/showroom
6. Test that it works

**Time needed**: 30-60 minutes per location

---

## 🎒 What to Bring

Before going to the outlet, make sure you have:

### Required Items
- [ ] **USB drive** with the POS installer (file name: `Don & Sons POS Setup 2.0.0.exe`)
- [ ] **Login credentials** (email and password for the POS)
- [ ] **Outlet information** (outlet name and code)
- [ ] **This printed guide**
- [ ] **Your mobile phone** (to call for help if needed)

### Nice to Have
- [ ] Second USB drive (backup)
- [ ] Network cable (if WiFi is not working)
- [ ] Notebook and pen (to write down any issues)

---

## 🖥️ Outlet PC Requirements

The outlet PC should have:
- **Windows 10 or Windows 11**
- **Internet connection** (WiFi or cable)
- **At least 4GB RAM** (memory)
- **100MB free disk space**
- **Admin access** (you may need the outlet PC's admin password)

**Check this BEFORE starting installation!**

---

## 📖 Step-by-Step Installation

### STEP 1: Prepare the Outlet PC

#### 1.1 Turn on the PC and login
- Press the power button
- Wait for Windows to start
- Login with the outlet PC's username and password
- **Important**: You need "Administrator" access to install software

#### 1.2 Check internet connection
- Look at the bottom-right corner of the screen
- You should see a WiFi icon or network icon
- Click on it to verify you're connected to the internet
- If not connected, connect to WiFi or plug in the network cable

**What success looks like:**
```
✓ You see the Windows desktop
✓ Internet icon shows "Connected"
✓ You can open a web browser and visit google.com
```

**If internet is not working:**
- Ask the outlet manager for WiFi password
- Or plug in a network cable
- Or use mobile hotspot temporarily

---

### STEP 2: Copy the Installer

#### 2.1 Insert your USB drive
- Plug the USB drive into any USB port on the PC
- Wait 5-10 seconds for Windows to recognize it
- A window might pop up - click "Open folder to view files"

#### 2.2 Find the installer
- Open "This PC" or "My Computer"
- Double-click on the USB drive (usually shows as "D:" or "E:")
- You should see a file named: **Don & Sons POS Setup 2.0.0.exe**
- File size should be around 80-150 MB

#### 2.3 Copy to Desktop
- Right-click on the installer file
- Select "Copy"
- Go to the Desktop (minimize all windows or press Windows key + D)
- Right-click on an empty area of the Desktop
- Select "Paste"
- Wait for the file to copy (might take 10-30 seconds)

**What success looks like:**
```
✓ You see "Don & Sons POS Setup 2.0.0.exe" on the Desktop
✓ File size shows as approximately 100 MB
```

---

### STEP 3: Install the POS Software

#### 3.1 Run the installer
- Double-click on "Don & Sons POS Setup 2.0.0.exe" on the Desktop
- A security warning might appear: "Do you want to allow this app to make changes?"
- Click **"Yes"**

**Important**: If you see "Windows protected your PC", click "More info" then "Run anyway"

#### 3.2 Installation wizard
The installer will open. Follow these steps:

**Screen 1: Welcome**
- You'll see "Welcome to Don & Sons POS Setup"
- Click **"Next"**

**Screen 2: Choose Install Location**
- Default location is fine (usually C:\Users\...\AppData\Local\Programs\don-and-sons-pos)
- Check the box "Create a desktop shortcut"
- Click **"Next"**

**Screen 3: Installing**
- A progress bar will appear
- Wait patiently (this takes 1-2 minutes)
- **Do not close or cancel!**

**Screen 4: Finish**
- You'll see "Don & Sons POS has been successfully installed"
- Make sure "Launch Don & Sons POS" is checked
- Click **"Finish"**

**What success looks like:**
```
✓ Installation completed without errors
✓ You see a "Don & Sons POS" icon on the Desktop
✓ The POS application opens automatically
```

**If installation fails:**
- Check if you have admin rights
- Try running as Administrator: Right-click installer → "Run as administrator"
- Make sure antivirus is not blocking it
- Call technical support (number at the end of this guide)

---

### STEP 4: First Launch and Login

#### 4.1 The POS application opens
- You should see a login screen with:
  - Don & Sons logo at the top
  - Email address field
  - Password field
  - "Sign in" button

**What it looks like:**
```
┌─────────────────────────────┐
│         Don & Sons          │
│   Point of Sale Terminal    │
│                             │
│  Email address              │
│  ┌─────────────────────┐   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  Password                   │
│  ┌─────────────────────┐   │
│  │ ••••••••••••••••    │   │
│  └─────────────────────┘   │
│                             │
│     [ Sign in ]             │
└─────────────────────────────┘
```

#### 4.2 Enter login credentials
- Click in the "Email address" box
- Type the email address given to you (e.g., cashier@donandson.com)
- Click in the "Password" box
- Type the password given to you
- **Important**: Type carefully! Passwords are case-sensitive

#### 4.3 Sign in
- Click the **"Sign in"** button
- Wait 3-5 seconds while it connects to the server

**What success looks like:**
```
✓ The login screen disappears
✓ You see the main POS screen with products
```

**If login fails:**

**Error: "Cannot reach server"**
- Internet is not working
- Check WiFi/network connection
- Try again after fixing internet

**Error: "Login failed"**
- Username or password is wrong
- Check if Caps Lock is ON (turn it OFF)
- Try typing the password again carefully
- Contact your supervisor for correct credentials

**Error: "Network Error"**
- Server might be down
- Check if you can visit the website: http://123.231.10.22:5126/health in a browser
- If that doesn't work, call technical support

---

### STEP 5: Select the Outlet/Showroom

This is a **CRITICAL STEP**! You must select the correct outlet for this location.

#### 5.1 Find the outlet selector
- Look at the **top-right corner** of the screen
- You'll see a small button/pill that says "Select showroom" or shows an outlet name
- It looks like a rounded button with a dropdown arrow (▼)

**What it looks like:**
```
Top-right corner:
┌─────────────────────────┐
│ Select showroom ▼       │
└─────────────────────────┘
```

#### 5.2 Click the outlet button
- Click on the "Select showroom" button
- A dropdown menu will appear showing all available outlets

**Example dropdown:**
```
┌─────────────────────────┐
│ Main Showroom (SR01)    │
│ Branch 1 (BR01)         │
│ Branch 2 (BR02)         │ ← Click the correct one
│ Branch 3 (BR03)         │
│ Warehouse (WH01)        │
└─────────────────────────┘
```

#### 5.3 Select the CORRECT outlet
- **VERY IMPORTANT**: Find the outlet name for THIS location
- Look at your deployment sheet - it should say which outlet this is
- Click on the CORRECT outlet name

**Example:**
- If you're at "Branch 2", click on "Branch 2 (BR02)"
- If you're at "Main Showroom", click on "Main Showroom (SR01)"

#### 5.4 Verify the selection
- After clicking, the button should now show the outlet name
- **Double-check**: Is the name correct for this location?

**What success looks like:**
```
✓ Top-right corner shows the correct outlet name
✓ Example: "Branch 2 (BR02)" if you're at Branch 2
```

**CRITICAL**: If you select the wrong outlet, all sales from this location will be recorded under the wrong showroom! This will mess up inventory and reports!

**If you're not sure which outlet to select:**
- Check your deployment sheet
- Ask the outlet manager
- Call your supervisor
- **Do NOT guess!**

---

### STEP 6: Wait for Initial Product Download

After selecting the outlet, the POS needs to download product information.

#### 6.1 Automatic download starts
- The POS will automatically connect to the server
- It will download all products and categories
- You'll see a loading indicator or progress bar
- **This takes 1-2 minutes - be patient!**

**What you'll see:**
```
┌─────────────────────────────┐
│  Syncing catalog...         │
│  ████████░░░░░░░░ 60%       │
│  Downloading products...    │
└─────────────────────────────┘
```

#### 6.2 Products appear
- Once download is complete, you'll see product tiles/cards
- Products will be organized by categories (tabs at the top)
- The screen will look like a product catalog

**What success looks like:**
```
✓ You see product names and prices
✓ You can scroll through products
✓ Categories appear at the top (e.g., "All", "Cakes", "Pastries")
✓ No error messages
```

**If products don't load:**
- Check internet connection again
- Wait a bit longer (might take up to 3 minutes)
- If still not working after 5 minutes, there's a problem
- Try logging out and logging in again
- Call technical support if it still doesn't work

---

### STEP 7: Test the POS (VERY IMPORTANT!)

You MUST test the POS before leaving the outlet!

#### 7.1 Online Test - Create a test sale

**Step-by-step:**

1. **Add products to cart:**
   - Click on 2-3 products to add them to the cart
   - You'll see them appear on the right side
   - Total amount will be calculated automatically

2. **Proceed to payment:**
   - Click the **"Pay"** or **"Payment"** button (usually big, at the bottom-right)
   - A payment screen will appear

3. **Select payment method:**
   - Choose "Cash" (or whichever method the outlet uses)
   - If it's cash, enter the amount received
   - It will calculate change automatically

4. **Complete the sale:**
   - Click **"Complete Sale"** or **"Confirm"**
   - Wait 2-3 seconds

5. **Check for success:**
   - You should see "Sale completed successfully" or similar message
   - A receipt preview might appear
   - The cart should be cleared (empty)

6. **Verify sync status:**
   - Look for a sync indicator (usually top-right corner)
   - It should show that the sale was synced to the server
   - Look for words like "Synced" or a checkmark (✓)

**What success looks like:**
```
✓ Sale completed without errors
✓ Receipt shows (if enabled)
✓ Cart is cleared
✓ Sync indicator shows "Synced" or "✓"
✓ No error messages
```

#### 7.2 Offline Test - Simulate network failure

This is important because outlets might lose internet sometimes!

**Step-by-step:**

1. **Disconnect internet:**
   - Click the WiFi icon in bottom-right corner of Windows
   - Click **"Disconnect"**
   - Or unplug the network cable

2. **Check offline indicator:**
   - POS should show "Offline" somewhere on screen (usually top-right)
   - Icon might change to show no internet

3. **Create another test sale:**
   - Add 1-2 products to cart
   - Click "Pay"
   - Complete the sale with Cash
   - Click "Complete Sale"

4. **Check sale status:**
   - Sale should complete successfully even without internet!
   - It will be marked as "Pending Sync" or similar
   - No error should occur

5. **Reconnect internet:**
   - Click WiFi icon again
   - Select the WiFi network
   - Connect (enter password if needed)

6. **Wait for auto-sync:**
   - Wait about 10-20 seconds
   - The POS should automatically sync the pending sale
   - Status should change from "Pending" to "Synced"
   - You might see a sync progress indicator

**What success looks like:**
```
✓ Sale works even when offline
✓ Sale is marked "Pending Sync" when offline
✓ After reconnecting, sale automatically syncs
✓ Status changes to "Synced"
✓ No errors during the process
```

**If offline mode doesn't work:**
- This is a CRITICAL problem - call technical support immediately
- Do not leave the outlet until this is fixed
- The POS MUST work offline for remote locations

#### 7.3 Delete test sales (Optional)

If you created test sales, ask your supervisor if they should be deleted or voided. Usually test sales are kept for audit purposes but marked as "test" or "void".

---

### STEP 8: Configure Receipt Settings (Optional)

If the outlet wants printed receipts:

#### 8.1 Open settings
- Look for a "Settings" button or gear icon (⚙️)
- Usually in the top-right or in a menu

#### 8.2 Set receipt details
- Enter the outlet's phone number
- Enter the outlet's address
- Enable "Auto-print" if they want automatic receipt printing

#### 8.3 Test print
- Create a test sale
- After completing, check if receipt prints automatically
- Or click "Print Receipt" button

**Note**: Receipt printer must be connected and configured in Windows first!

---

### STEP 9: Train the Staff

Before you leave, spend 10-15 minutes training the staff:

#### 9.1 Basic operations
Show them how to:
- [ ] Add products to cart (click on product)
- [ ] Remove products from cart (click X or remove button)
- [ ] Change quantity (+ and - buttons)
- [ ] Complete a sale (Pay button)
- [ ] Select payment method (Cash/Card)
- [ ] Calculate change (automatic)
- [ ] Clear cart (if they made a mistake)

#### 9.2 Important things to know
Tell them:
- [ ] **The POS works offline** - sales will be saved and synced later
- [ ] **Check sync status** - look for the sync indicator
- [ ] If they see "Offline" - sales still work, will sync when online
- [ ] If they see "Pending Sync" - sales are waiting to upload
- [ ] **Don't close the POS during a sale**
- [ ] **Don't change the outlet selection** unless authorized

#### 9.3 What to do if something goes wrong
- [ ] If POS freezes: Close and reopen the app
- [ ] If internet is down: POS still works offline
- [ ] If sales not syncing: Check internet connection
- [ ] If they're stuck: Call the manager or technical support

---

### STEP 10: Final Checks

Before leaving the outlet, verify:

#### Checklist
- [ ] POS is installed and opens without errors
- [ ] Login works with the provided credentials
- [ ] **Correct outlet/showroom is selected** (CRITICAL!)
- [ ] Products are loaded and visible
- [ ] Test sale completed successfully (online)
- [ ] Offline mode test completed successfully
- [ ] Sale synced after reconnecting
- [ ] Desktop shortcut is visible
- [ ] Staff has been trained (basic operations)
- [ ] Contact number given to outlet manager

#### Document the installation
Write down:
- **Date and time** of installation: ________________
- **Outlet name**: ________________
- **Outlet selected in POS**: ________________
- **Windows PC name**: ________________
- **Internet type**: WiFi / Cable / Mobile hotspot
- **Any issues encountered**: ________________
- **Your name**: ________________
- **Outlet manager's name**: ________________
- **Outlet manager's phone**: ________________

---

## ✅ Installation Complete!

Congratulations! The POS is now installed and working at this outlet.

**What the outlet staff should do now:**
- Use the POS for all sales
- Check sync status regularly
- If internet goes down, continue working (POS works offline)
- Call for help if any issues

**What you should do:**
- Move to the next outlet (if any)
- Report completion to your supervisor
- Submit the documentation form

---

## 🚨 Troubleshooting Common Issues

### Issue 1: Installation fails with error

**Symptoms:**
- Installer shows error message
- Installation stops halfway

**Solutions:**
1. Make sure you have admin rights
2. Right-click installer → "Run as administrator"
3. Disable antivirus temporarily
4. Check if enough disk space (need 100MB)
5. Try restarting the PC and installing again

---

### Issue 2: Login fails with "Cannot reach server"

**Symptoms:**
- Error message: "Cannot reach server" or "Network Error"

**Solutions:**
1. Check internet connection:
   - Open a browser
   - Visit www.google.com
   - If it doesn't work, internet is down
2. Connect to WiFi or plug in network cable
3. Try logging in again
4. If still doesn't work, call technical support

---

### Issue 3: Wrong password or email

**Symptoms:**
- Error: "Login failed" or "Invalid credentials"

**Solutions:**
1. Check if Caps Lock is ON (turn it OFF)
2. Type the password slowly and carefully
3. Ask supervisor for correct credentials
4. Make sure email is typed correctly (no spaces)

---

### Issue 4: Products not loading

**Symptoms:**
- After login, product screen is empty
- Message: "No products in cache"

**Solutions:**
1. Check internet connection
2. Wait 2-3 minutes (might still be downloading)
3. Try logout and login again
4. Click "Sync Catalog" or "Refresh" button if available
5. If still empty after 5 minutes, call technical support

---

### Issue 5: Can't find outlet/showroom in dropdown

**Symptoms:**
- Dropdown is empty
- The outlet you need is not listed

**Solutions:**
1. Make sure internet was working during login
2. Try logout and login again
3. Contact supervisor - outlet might not be created in system yet
4. **Do NOT proceed without selecting the correct outlet!**

---

### Issue 6: POS crashes or freezes

**Symptoms:**
- POS stops responding
- Screen is frozen
- Buttons don't work

**Solutions:**
1. Wait 30 seconds first
2. If still frozen:
   - Press Ctrl+Alt+Delete
   - Select "Task Manager"
   - Find "Don & Sons POS"
   - Click "End Task"
3. Close and reopen the POS from desktop shortcut
4. Login again
5. If it keeps crashing, call technical support

---

### Issue 7: Test sale doesn't sync

**Symptoms:**
- Sale completed but stays "Pending"
- No sync after reconnecting internet

**Solutions:**
1. Wait 1-2 minutes (auto-sync might be in progress)
2. Check internet connection is stable
3. Try creating another small sale
4. If nothing syncs after 5 minutes, call technical support
5. **Do not leave until sync is working!** This is critical.

---

### Issue 8: Offline mode not working

**Symptoms:**
- Error when trying to create sale offline
- POS says "Internet required"

**Solutions:**
1. This is a CRITICAL issue
2. **Do NOT leave the outlet**
3. Call technical support immediately
4. POS MUST work offline for remote locations

---

## 📞 Who to Call for Help

### During Installation
**Technical Support Hotline**
- Phone: [INSERT PHONE NUMBER]
- Available: [INSERT HOURS]
- WhatsApp: [INSERT NUMBER]

### After Installation
**Outlet Manager should call:**
- Support Line: [INSERT PHONE NUMBER]
- Email: support@donandson.com
- Hours: [INSERT BUSINESS HOURS]

### Emergency Issues
**If POS is completely broken:**
- Call: [INSERT EMERGENCY NUMBER]
- Or escalate to: [INSERT SUPERVISOR NAME & NUMBER]

---

## 📝 Installation Report Form

Fill this out for each outlet and submit to your supervisor:

```
═══════════════════════════════════════════════════════
DON & SONS POS - INSTALLATION REPORT
═══════════════════════════════════════════════════════

OUTLET INFORMATION:
  Outlet Name: _______________________________________
  Outlet Code: _______________________________________
  Outlet Selected in POS: ____________________________
  
INSTALLATION DETAILS:
  Date: ________________  Time: _____________________
  Installed by: _______________________________________
  
PC INFORMATION:
  PC Name/Model: ______________________________________
  Windows Version: Win 10 / Win 11 (circle one)
  RAM: _____ GB
  Internet Type: WiFi / Cable / Mobile (circle one)
  
TESTING RESULTS:
  □ Online test sale: PASS / FAIL
  □ Offline test sale: PASS / FAIL
  □ Auto-sync after reconnect: PASS / FAIL
  □ Products loaded: YES / NO
  □ Staff trained: YES / NO
  
ISSUES ENCOUNTERED (if any):
  _____________________________________________________
  _____________________________________________________
  _____________________________________________________
  
STAFF INFORMATION:
  Outlet Manager Name: ________________________________
  Outlet Manager Phone: _______________________________
  Staff trained: _______ people
  
SIGN-OFF:
  Installation completed: YES / NO
  Ready for use: YES / NO
  
  Installer Signature: ________________  Date: ________
  Manager Signature: _________________  Date: ________
  
═══════════════════════════════════════════════════════
```

---

## 🎯 Quick Reference Card

**Print this and give to outlet staff:**

```
╔══════════════════════════════════════════════════════╗
║       DON & SONS POS - QUICK REFERENCE               ║
╚══════════════════════════════════════════════════════╝

HOW TO START:
1. Double-click "Don & Sons POS" icon on desktop
2. Enter your email and password
3. Click "Sign in"

HOW TO MAKE A SALE:
1. Click on products to add to cart
2. Click "Pay" button
3. Select payment method (Cash/Card)
4. Enter amount received (if cash)
5. Click "Complete Sale"

IMPORTANT:
• POS works WITHOUT internet (offline mode)
• Sales will sync automatically when online
• Check sync status at top-right corner
• DON'T change outlet/showroom selection

IF SOMETHING GOES WRONG:
• Close and reopen POS
• Check internet connection
• Call support: [INSERT NUMBER]

WHAT EACH ICON MEANS:
• ✓ = Synced (sale uploaded to server)
• ⏳ = Pending (waiting to sync)
• 🔴 = Offline (no internet, but POS still works)
• 🟢 = Online (connected to server)

═══════════════════════════════════════════════════════
Support: [PHONE] | [EMAIL] | Available: [HOURS]
═══════════════════════════════════════════════════════
```

---

## ✨ Tips for Successful Deployment

### Before You Leave Home
- [ ] Charge your laptop/phone fully
- [ ] Download and test the USB installer yourself first
- [ ] Have supervisor's phone number saved
- [ ] Print this guide
- [ ] Bring a backup USB drive
- [ ] Know the outlet location and manager's name

### At the Outlet
- [ ] Be polite and professional
- [ ] Explain what you're doing to the manager
- [ ] Test EVERYTHING before leaving
- [ ] Take photos of the installed POS (as proof)
- [ ] Get manager's signature on installation report
- [ ] Leave contact information with manager

### After Installation
- [ ] Submit installation report to supervisor
- [ ] Report any issues encountered
- [ ] Update deployment tracking sheet
- [ ] Be available for follow-up questions

---

## 📱 Screenshots & Visual Guides

### Login Screen
```
┌───────────────────────────────────┐
│                                   │
│           🏢 D&S                  │
│       Don & Sons                  │
│   Point of Sale Terminal          │
│                                   │
│   Email address                   │
│   ┌─────────────────────────┐    │
│   │ cashier@donandson.com   │    │
│   └─────────────────────────┘    │
│                                   │
│   Password                        │
│   ┌─────────────────────────┐    │
│   │ ••••••••••••            │ 👁 │
│   └─────────────────────────┘    │
│                                   │
│      [    Sign in    ]            │
│                                   │
└───────────────────────────────────┘
```

### Main POS Screen
```
┌─────────────────────────────────────────────────────┐
│ Don & Sons         👤 User     Branch 2 (BR02) ▼ 🟢│ ← Top bar
├─────────────────────────────────────────────────────┤
│ [All] [⭐ Fav] [Cakes] [Pastries] [Breads] ...      │ ← Categories
├──────────────────────────────┬──────────────────────┤
│ PRODUCTS (Left side)         │ CART (Right side)    │
│                              │                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ │ Chocolate Cake  x2   │
│ │Choco │ │Vanilla│ │Straw│ │ Rs. 500 each         │
│ │Cake  │ │Cake  │ │Cake │ │                      │
│ │Rs500 │ │Rs450 │ │Rs480│ │ Vanilla Bread   x1   │
│ └──────┘ └──────┘ └──────┘ │ Rs. 120              │
│                              │                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ │ ─────────────────    │
│ │...   │ │...   │ │...  │ │ TOTAL: Rs. 1,120     │
│ └──────┘ └──────┘ └──────┘ │                      │
│                              │   [    PAY    ]      │
└──────────────────────────────┴──────────────────────┘
```

### Payment Screen
```
┌─────────────────────────────────┐
│    Complete Payment              │
├─────────────────────────────────┤
│  Total Amount: Rs. 1,120         │
│                                  │
│  Payment Method:                 │
│  ⚫ Cash   ○ Card   ○ Other      │
│                                  │
│  Amount Received:                │
│  ┌─────────────────────────┐    │
│  │ 1500                    │    │
│  └─────────────────────────┘    │
│                                  │
│  Change: Rs. 380                 │
│                                  │
│   [Cancel]  [Complete Sale]      │
└─────────────────────────────────┘
```

---

## 🎓 Training Script for Outlet Staff

**Use this script when training staff (5-10 minutes):**

### Introduction (1 min)
"Hello! I'm here to install the new Don & Sons POS system. This will make it easier and faster to process sales. The best part is - it works even when the internet is down!"

### Basic Demo (3 min)
1. "To make a sale, just click on the products - see?" [DEMO]
2. "They appear here on the right with the price" [SHOW]
3. "When done, click this big PAY button" [DEMO]
4. "Choose Cash or Card" [SHOW]
5. "Enter the amount received, and it calculates change automatically" [DEMO]
6. "Click Complete Sale and you're done!" [DEMO]

### Offline Mode (2 min)
"Now the important part - if internet goes down, DON'T PANIC! The POS still works!"
1. "You'll see this red dot or 'Offline' here" [POINT]
2. "Just continue making sales normally"
3. "Sales get saved locally on this computer"
4. "When internet comes back, everything syncs automatically"
5. "You might see 'Pending Sync' - that's normal, they'll upload soon"

### Important Warnings (1 min)
"Three important things:"
1. "DON'T change this" [POINT TO OUTLET SELECTOR]
2. "DON'T close POS during a sale"
3. "If something's wrong, close and reopen the POS, or call this number" [SHOW NUMBER]

### Questions (2 min)
"Any questions? Want to try it yourself?"
[Let them do a practice sale]

---

## ✅ Final Checklist Before Leaving

### Must-Do Items
- [ ] POS installed successfully
- [ ] Login tested and working
- [ ] **CORRECT outlet selected** (double-checked!)
- [ ] Products downloaded and visible
- [ ] Online test sale completed and synced
- [ ] Offline test sale completed
- [ ] Auto-sync verified after reconnecting
- [ ] Staff trained (at least 1 person)
- [ ] Desktop shortcut visible and working
- [ ] Installation report filled out
- [ ] Manager signature obtained
- [ ] Contact number left with manager
- [ ] Photos taken (for proof of installation)

### Optional Items
- [ ] Receipt printer tested (if applicable)
- [ ] Receipt settings configured
- [ ] Multiple staff members trained
- [ ] Manager's contact saved in your phone

### Do NOT Leave If:
- ❌ Offline mode is not working
- ❌ Sales are not syncing
- ❌ Wrong outlet is selected
- ❌ No products are showing
- ❌ Login is not working

**If any of the above, call technical support and DO NOT LEAVE until resolved!**

---

## 🎯 Success Criteria

The installation is successful when:

✅ POS opens without errors  
✅ User can login  
✅ Correct outlet is selected  
✅ Products are visible  
✅ Can create a sale (online)  
✅ Sale syncs to server  
✅ Can create a sale (offline)  
✅ Offline sale syncs after reconnecting  
✅ Staff knows basic operations  
✅ Manager is satisfied  

---

**You've completed the installation! Great job! 🎉**

**Move to next outlet or report completion to supervisor.**

---

*Version 1.0 - May 18, 2026*  
*For questions or issues, contact: [INSERT CONTACT]*
