# Redis Setup Guide

The system can run **without Redis** using in-memory token storage for development, but **Redis is recommended** for production.

## Current Status

✅ The backend will automatically use **in-memory fallback** if Redis is not available.

⚠️ **Warning:** With in-memory storage, all refresh tokens are lost when the server restarts.

## Installing Redis

### Option 1: Docker (Recommended - Easiest)

```bash
# Start Redis in Docker
docker run --name dms-redis -p 6379:6379 -d redis:7-alpine

# Check if running
docker ps | grep dms-redis

# Stop Redis
docker stop dms-redis

# Start again
docker start dms-redis

# Remove
docker rm -f dms-redis
```

### Option 2: Windows (Native Installation)

**Download Memurai (Redis for Windows):**

1. Download from: https://www.memurai.com/get-memurai
2. Install and run as a Windows Service
3. Redis will run on `localhost:6379` automatically

**Or use WSL2 with Linux Redis:**

```bash
# In WSL2 Ubuntu
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Check status
redis-cli ping
# Should return: PONG
```

### Option 3: Linux/Mac

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# macOS (Homebrew)
brew install redis
brew services start redis
```

## Verifying Redis Connection

```bash
# Test connection
redis-cli ping
# Should return: PONG

# Monitor connections
redis-cli monitor

# Check stored keys
redis-cli
> KEYS DMS_ERP_*
```

## Backend Behavior

### Without Redis:
```
⚠ Warning: Redis connection failed. Using in-memory fallback for refresh tokens.
⚠ Using in-memory refresh token storage (tokens lost on restart)
```
- Refresh tokens stored in memory
- Lost on server restart
- **OK for development, NOT for production**

### With Redis:
```
✓ Connected to Redis successfully
✓ Using Redis for refresh token storage
```
- Refresh tokens persist across restarts
- Shared across multiple server instances
- **Production ready**

## Configuration

Update `appsettings.Development.json` if Redis is on a different port:

```json
{
  "Redis": {
    "ConnectionString": "localhost:6379",
    "InstanceName": "DMS_ERP_"
  }
}
```

## Production Recommendations

For production, always use Redis with:

1. **Password protection:**
   ```json
   "ConnectionString": "localhost:6379,password=your_secure_password"
   ```

2. **Persistence enabled** (in `redis.conf`):
   ```
   appendonly yes
   appendfsync everysec
   ```

3. **Max memory policy:**
   ```
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

## Troubleshooting

**Error: "Connection refused"**
- Redis is not running. Start it using one of the methods above.

**Error: "It was not possible to connect to the redis server(s)"**
- Check firewall settings
- Verify Redis is listening on 0.0.0.0 (not just 127.0.0.1)
- Try: `redis-cli -h localhost -p 6379 ping`

**Port already in use:**
```bash
# Check what's using port 6379
# Windows
netstat -ano | findstr :6379

# Linux/Mac
lsof -i :6379
```

## Current System Status

The backend will work perfectly fine **without Redis** for testing and development. Install Redis when you're ready for production deployment or want persistent token storage during development.
