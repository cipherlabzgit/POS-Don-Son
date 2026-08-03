# Backend Process Management Guide

## Common Issue: "File is Locked" Error

### Problem
When building the backend, you might encounter:
```
Could not copy "apphost.exe" to "DMS-Backend.exe". 
The file is locked by: "DMS-Backend (PID)"
```

### Root Cause
The backend executable is still running from a previous session. This happens when:
- Visual Studio is running the project
- A terminal has `dotnet run` active
- The process wasn't stopped properly
- Multiple instances were started

## Solutions

### Solution 1: Use the Kill Script (Recommended)
```powershell
cd DMS-Backend
.\kill-backend.ps1
```

This script automatically finds and stops all DMS-Backend processes.

### Solution 2: Manual Process Kill
```powershell
# Find the process
tasklist /FI "IMAGENAME eq DMS-Backend.exe"

# Kill it (replace PID with actual process ID)
taskkill /F /PID <PID>
```

### Solution 3: Stop All at Once
```powershell
# Kill all DMS-Backend processes
Get-Process -Name "DMS-Backend" -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill dotnet processes running the backend
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*DMS-Backend*"
} | Stop-Process -Force
```

## Best Practices

### 1. Always Stop Before Building
Before running `dotnet build`, ensure no backend processes are running:
```powershell
.\kill-backend.ps1  # or manually check with tasklist
dotnet build
```

### 2. Use Ctrl+C to Stop Gracefully
When running `dotnet run` in a terminal, use `Ctrl+C` to stop it properly instead of closing the terminal window.

### 3. Check Running Processes
Verify no processes are running:
```powershell
tasklist /FI "IMAGENAME eq DMS-Backend.exe"
```

Expected output when nothing is running:
```
INFO: No tasks are running which match the specified criteria.
```

### 4. Close Visual Studio Debug Sessions
If running from Visual Studio:
- Stop debugging (Shift+F5)
- Close the solution
- Wait a few seconds before building from terminal

## Development Workflow

### Starting the Backend
```powershell
cd DMS-Backend

# Option 1: Direct run
dotnet run

# Option 2: Build then run
dotnet build
dotnet run

# Option 3: Watch mode (auto-restart on changes)
dotnet watch run
```

### Stopping the Backend
```powershell
# If running in terminal: Press Ctrl+C

# If running in background or lost terminal:
.\kill-backend.ps1
```

### Building After Changes
```powershell
# 1. Stop any running instances
.\kill-backend.ps1

# 2. Clean build (recommended after structural changes)
dotnet clean
dotnet build

# 3. Regular build
dotnet build

# 4. Build without cache (if having issues)
dotnet build --no-incremental
```

## Troubleshooting

### Issue: Process Won't Die
If `kill-backend.ps1` doesn't work:
```powershell
# Force kill by image name
taskkill /F /IM DMS-Backend.exe
taskkill /F /IM dotnet.exe
```

### Issue: Multiple Instances Keep Starting
Check for:
- Visual Studio auto-run on solution open
- Multiple terminals with watch mode
- Build configurations with auto-run
- Task scheduler or startup programs

### Issue: Port Already in Use
If you get "Address already in use" error:
```powershell
# Find process using port 5000 (or your backend port)
netstat -ano | findstr :5000

# Kill the process using that PID
taskkill /F /PID <PID>
```

### Issue: Can't Find the Process
Sometimes the process name might be different:
```powershell
# List all dotnet-related processes
Get-Process | Where-Object {$_.ProcessName -like "*dotnet*" -or $_.ProcessName -like "*DMS*"}
```

## Quick Reference Commands

```powershell
# Stop all backend processes
.\kill-backend.ps1

# Check if backend is running
tasklist /FI "IMAGENAME eq DMS-Backend.exe"

# Build safely
.\kill-backend.ps1 && dotnet build

# Run backend
dotnet run

# Stop backend (if in terminal)
Ctrl+C

# Clean and rebuild
dotnet clean && dotnet build

# Watch mode (auto-restart)
dotnet watch run
```

## Integration with IDEs

### Visual Studio
- **Stop Debugging**: Shift+F5
- **Restart**: Ctrl+Shift+F5
- **Important**: Always stop debugging before building from terminal

### VS Code
- Use the integrated terminal
- Stop with Ctrl+C
- Or use the "Stop" button in the debug toolbar

### Rider
- Stop debug session before terminal builds
- Use built-in terminal for consistency

## Automated Script Usage

Add to your workflow scripts:
```powershell
# Pre-build hook
.\kill-backend.ps1
dotnet build

# Pre-run hook  
.\kill-backend.ps1
dotnet run
```

## Notes

- The `kill-backend.ps1` script is safe to run anytime
- It won't harm the system if no processes are found
- Always verify processes are stopped before building
- Keep only one instance running during development
- Use `dotnet watch` for auto-restart during development
