# Swagger/OpenAPI API Documentation

## Overview

The DMS Backend API now has interactive API documentation powered by **Scalar UI**, a modern alternative to Swagger UI with better performance and user experience.

## Accessing the API Documentation

### Scalar UI (Interactive API Documentation)
- **URL**: http://localhost:5126/scalar/v1
- **Features**:
  - Modern, fast UI
  - Interactive API testing
  - JWT Bearer authentication support
  - Code examples in multiple languages (C#, HttpClient, etc.)
  - Request/Response examples
  - Model schemas

### OpenAPI Specification (JSON)
- **URL**: http://localhost:5126/openapi/v1.json
- **Usage**: For importing into tools like Postman, Insomnia, or other API clients

## Features Implemented

### 1. **Interactive API Documentation**
   - All API endpoints are automatically documented
   - View request/response models
   - Test endpoints directly from the browser

### 2. **JWT Authentication Support**
   - Bearer token authentication is pre-configured
   - Use the "Authorize" button to add your JWT token
   - Token persists across requests in the same session

### 3. **Modern UI with Scalar**
   - Mars theme for better readability
   - Fast, responsive interface
   - Better code generation than Swagger UI

## How to Use

### Step 1: Start the Backend
```powershell
cd "C:\Cipher Labz\DonandSons-DMS\DMS-Backend"
dotnet run
```

### Step 2: Open Scalar UI
Navigate to http://localhost:5126/scalar/v1 in your browser

### Step 3: Authenticate (For Protected Endpoints)
1. Click the **"Authorize"** button in Scalar UI
2. Enter your JWT token in the format: `Bearer your_token_here`
3. Click "Authorize"

### Step 4: Test API Endpoints
1. Navigate to any endpoint
2. Click "Try it out"
3. Fill in required parameters
4. Click "Execute"
5. View the response

## Example: Getting a Token

First, you need to authenticate to get a JWT token:

1. Go to `/api/auth/login` endpoint
2. Click "Try it out"
3. Enter credentials:
```json
{
  "email": "admin@donandsons.com",
  "password": "Admin@123"
}
```
4. Click "Execute"
5. Copy the `accessToken` from the response
6. Use this token in the "Authorize" button

## Available Endpoints

The Scalar UI will show all available endpoints grouped by:
- **Auth**: Authentication and authorization
- **Users**: User management
- **Roles**: Role management
- **Products**: Product management
- **Ingredients**: Ingredient management
- **Recipes**: Recipe management
- **Recipe Templates**: Recipe template management
- And more...

## Configuration

The Swagger/OpenAPI configuration is in `Program.cs`:

- **Title**: DMS Backend API
- **Version**: v1
- **Theme**: Mars (Scalar)
- **Default HTTP Client**: HttpClient (C#)

## Packages Used

- **Microsoft.AspNetCore.OpenApi** (10.0.7): Built-in OpenAPI generation
- **Scalar.AspNetCore** (2.14.5): Modern API documentation UI

## Benefits Over Traditional Swagger UI

1. **Faster Load Times**: Scalar is optimized for performance
2. **Better Code Examples**: Includes C# HttpClient examples
3. **Modern Design**: Clean, responsive interface
4. **Better DX**: Improved developer experience

## Troubleshooting

### Issue: Scalar UI Not Loading
**Solution**: Ensure the backend is running on http://localhost:5126

### Issue: 401 Unauthorized
**Solution**: Make sure you've:
1. Logged in to get a token
2. Added the token using the "Authorize" button
3. Used the correct format: `Bearer your_token_here`

### Issue: Port Already in Use
**Solution**: Kill any existing backend process:
```powershell
netstat -ano | Select-String ":5126"
Stop-Process -Id <PID> -Force
```

## Next Steps

- Test all API endpoints using Scalar UI
- Export OpenAPI spec for Postman/Insomnia
- Share API documentation with frontend developers
- Consider adding XML documentation comments for richer endpoint descriptions

## Additional Resources

- [Scalar Documentation](https://github.com/scalar/scalar)
- [OpenAPI Specification](https://swagger.io/specification/)
- [ASP.NET Core OpenAPI](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi)
