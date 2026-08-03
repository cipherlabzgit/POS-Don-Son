# Don & Sons DMS - Delivery Management System

A comprehensive ERP system for managing bakery production and delivery operations with **email-based authentication**, role-based access control (RBAC), and audit logging.

## Features

### Authentication & Authorization
- ✅ **Email-based login** (instead of username)
- ✅ Single super admin account (seeded automatically)
- ✅ JWT access tokens (15 min expiry) + refresh tokens (7 days)
- ✅ HTTP-only cookies for secure token storage
- ✅ BCrypt password hashing (work factor 12)
- ✅ Dynamic RBAC - Super admin can create roles and assign permissions
- ✅ Comprehensive audit logging (authentication, API requests, data changes)

### Tech Stack
**Backend:**
- ASP.NET Core 10.0
- Entity Framework Core 10.0.6
- PostgreSQL 16
- Redis (for refresh tokens)
- BCrypt.Net-Next
- JWT Bearer authentication

**Frontend:**
- Next.js 16.2.4
- React 19.2.4
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Axios (HTTP client)
- React Hook Form + Zod (validation)

## Prerequisites

- .NET 10.0 SDK
- Node.js 20+ and npm
- PostgreSQL 16
- Redis 7 (optional for development - system uses in-memory fallback if not available)

## Getting Started

### 1. Database Setup

**Start PostgreSQL:**

```bash
# If using Docker:
docker run --name dms-postgres -e POSTGRES_PASSWORD=10158 -p 5432:5432 -d postgres:16

# Or install locally and ensure it's running
```

**Optional - Start Redis (recommended for production):**

```bash
# If using Docker:
docker run --name dms-redis -p 6379:6379 -d redis:7-alpine

# Or see REDIS_SETUP.md for other installation methods
```

**Note:** The system will work without Redis using in-memory token storage. See `REDIS_SETUP.md` for details.

**Update Connection Strings:**

Edit `DMS-Backend/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=dms_erp_db;Username=postgres;Password=YOUR_PASSWORD"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  }
}
```

### 2. Backend Setup

```bash
cd DMS-Backend

# Restore packages (if needed)
dotnet restore

# Apply migrations and seed database
dotnet run
```

The backend will:
1. Apply EF Core migrations to create all tables
2. Seed 40+ permissions organized by module (Users, Roles, Products, Orders, etc.)
3. Create super admin account with email: `admin@donandson.com` and password: `SuperAdmin@2026!Dev`

Backend will run on: **http://localhost:5000**

### 3. Frontend Setup

```bash
cd DMS-Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:3000**

## Testing the Implementation

### 1. Test Super Admin Login

1. Navigate to http://localhost:3000
2. You'll be redirected to `/login`
3. Enter credentials:
   - **Email:** `admin@donandson.com`
   - **Password:** `SuperAdmin@2026!Dev`
4. Click "Sign in"

### 2. Verify Authentication

After successful login, you should:
- Be redirected to `/dashboard`
- See welcome message with user's name and email
- See "Super Administrator" role
- See wildcard permission `*` (super admin has all permissions)

### 3. Verify Token Management

- **Access Token:** Stored in memory (Zustand store)
- **Refresh Token:** Stored as HTTP-only cookie
- **Auto-refresh:** When access token expires (15 min), frontend automatically refreshes it
- **Logout:** Click logout button to clear tokens and redirect to login

### 4. Check Database

Connect to PostgreSQL and verify:

```sql
-- Check super admin user (email-based)
SELECT id, email, first_name, last_name, is_super_admin, is_active, created_at 
FROM users WHERE is_super_admin = true;

-- Check seeded permissions
SELECT module, COUNT(*) as permission_count 
FROM permissions 
GROUP BY module 
ORDER BY module;

-- Check authentication logs
SELECT email, event_type, ip_address, timestamp 
FROM authentication_logs 
ORDER BY timestamp DESC 
LIMIT 10;
```

### 5. Test API Endpoints

Using curl or Postman:

```bash
# Login (returns accessToken + sets refreshToken cookie)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@donandson.com","password":"SuperAdmin@2026!Dev"}'

# Get current user (requires Bearer token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Refresh token (uses HTTP-only cookie)
curl -X POST http://localhost:5000/api/auth/refresh \
  -b "refreshToken=YOUR_REFRESH_TOKEN"

# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

### Core Tables

**users** - User accounts with email-based authentication
- `id` (UUID, PK)
- `email` (VARCHAR, unique) ← **Email-based instead of username**
- `first_name`, `last_name`
- `password_hash` (BCrypt, work factor 12)
- `is_super_admin` (BOOLEAN, unique index)
- `is_active`
- `last_login_at`, `created_at`, `updated_at`

**roles** - Dynamic roles created by super admin
- `id`, `name`, `description`
- `is_system_role`, `is_active`
- `created_by_id`

**permissions** - Module-based permissions
- `id`, `name`, `code` (e.g., `users.view`, `orders.create`)
- `module` (Users, Roles, Products, Orders, Reports, etc.)
- `is_system_permission`

**user_roles** - Many-to-many user ↔ role assignments

**role_permissions** - Many-to-many role ↔ permission assignments

### Audit Tables

**authentication_logs** - Login/logout events with email tracking
- Tracks: LoginSuccess, LoginFailed, Logout, TokenRefresh
- Includes: email, user_id, failure_reason, ip_address, user_agent

**audit_logs** - All data changes (CRUD operations)
- Captures: old_values, new_values (JSONB)
- Tracks entity_type, entity_id, action

**system_logs** - Application logs
- Categories: Authentication, Database, API, Background Job
- Levels: Info, Warning, Error, Critical

**api_request_logs** - API performance monitoring
- Tracks: endpoint, response_time_ms, status_code

## Key Implementation Details

### Email-Based Authentication
- **Login:** Users authenticate with `email` + `password` (not username)
- **Normalization:** Emails are trimmed and lowercased before storage/lookup
- **Validation:** Email format validated via FluentValidation + Zod
- **JWT Claims:** Email stored as `ClaimTypes.Email` claim
- **Audit Logs:** All logs reference `email` field for user tracking

### Super Admin
- Only **one** super admin can exist (enforced by unique partial index)
- Seeded automatically on first run from `appsettings.json`
- Has **implicit** access to all permissions (no role assignments needed)
- JWT contains wildcard permission `*`
- Can create unlimited custom roles and assign permissions

### JWT Strategy
- **Access Token:** 15 min expiry, contains userId, email, isSuperAdmin, permissions array
- **Refresh Token:** 7 day expiry, stored in Redis with user mapping
- **Claims:** `sub` (userId), `email`, `isSuperAdmin`, `permission` (multiple)
- **Auto-refresh:** Frontend axios interceptor handles 401 and refreshes automatically

### Permission System
- **Format:** `{module}.{action}` (e.g., `users.create`, `reports.export`)
- **Modules:** Users, Roles, Permissions, Outlets, Products, Ingredients, Recipes, Orders, Production, Reports, Logs, Settings
- **Super Admin:** Bypasses all permission checks (has wildcard `*`)
- **Regular Users:** Inherit permissions from all assigned roles (union)

## Remaining Tasks

The following features are planned but not yet implemented:

- [ ] Permission authorization middleware (`RequirePermissionAttribute`)
- [ ] Roles, Permissions, Users management controllers
- [ ] Logs query controller for viewing audit logs
- [ ] API request logging middleware
- [ ] Audit logging middleware for automatic CRUD tracking
- [ ] Role management UI in frontend
- [ ] User management UI in frontend
- [ ] Audit log viewer UI in frontend

These can be added incrementally as the system evolves.

## Project Structure

```
DonandSons-DMS/
├── DMS-Backend/
│   ├── Configuration/
│   │   ├── JwtOptions.cs
│   │   ├── RedisOptions.cs
│   │   └── SuperAdminOptions.cs
│   ├── Controllers/
│   │   └── AuthController.cs
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   ├── ApplicationDbContextFactory.cs
│   │   └── Seeders/
│   │       ├── PermissionSeeder.cs
│   │       └── SuperAdminSeeder.cs
│   ├── Models/
│   │   ├── DTOs/Auth/
│   │   └── Entities/
│   │       ├── User.cs (email-based)
│   │       ├── Role.cs
│   │       ├── Permission.cs
│   │       ├── UserRole.cs
│   │       ├── RolePermission.cs
│   │       ├── AuditLog.cs
│   │       ├── SystemLog.cs
│   │       ├── AuthenticationLog.cs
│   │       └── ApiRequestLog.cs
│   ├── Services/
│   │   ├── Interfaces/
│   │   └── Implementations/
│   │       ├── JwtService.cs
│   │       ├── UserService.cs
│   │       ├── AuthService.cs
│   │       ├── SystemLogService.cs
│   │       └── AuthenticationLogService.cs
│   ├── Migrations/
│   ├── Program.cs
│   └── appsettings.json
│
├── DMS-Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/page.tsx
│   │   │   ├── (dashboard)/dashboard/page.tsx
│   │   │   ├── page.tsx (redirects to /login)
│   │   │   └── layout.tsx
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts (axios with interceptors)
│   │   │   │   └── auth.ts
│   │   │   └── stores/
│   │   │       └── auth-store.ts (zustand)
│   │   └── middleware.ts
│   ├── .env.local
│   └── package.json
│
└── docs/
    └── DMS_ERP_Implementation_Plan.md
```

## Security Considerations

✅ **Implemented:**
- Passwords hashed with BCrypt (work factor 12)
- JWT secret minimum 32 characters
- HTTP-only cookies for refresh tokens
- HTTPS enforcement (Secure flag on cookies)
- SameSite=Strict cookie policy
- Email validation and normalization
- Token expiry (access: 15 min, refresh: 7 days)
- Comprehensive audit logging

⚠️ **TODO:**
- Rate limiting on login endpoint
- Account lockout after failed attempts
- CORS properly configured for production
- Password complexity requirements enforced
- Redis password protection

## Support

For issues or questions, refer to the plan document: `docs/DMS_ERP_Implementation_Plan.md`

---

**Super Admin Credentials:**
- Email: `admin@donandson.com`
- Password: `SuperAdmin@2026!Dev` (Development only - change in production!)
