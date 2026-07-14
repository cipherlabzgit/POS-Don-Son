# PowerShell script to check applied migrations and verify database schema
# Usage: .\check-migrations.ps1

$ErrorActionPreference = "Stop"

Write-Host "==============================================`n" -ForegroundColor Cyan
Write-Host "  Database Migration Verification Tool`n" -ForegroundColor Cyan
Write-Host "==============================================`n" -ForegroundColor Cyan

# Change to backend directory
Set-Location "DMS-Backend"

Write-Host "1. Checking EF Migrations Status..." -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

try {
    # List all migrations with their status
    $migrations = dotnet ef migrations list --project DMS-Backend.csproj --no-build 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $migrations
        Write-Host ""
    } else {
        Write-Host "Building project first..." -ForegroundColor Yellow
        $migrations = dotnet ef migrations list --project DMS-Backend.csproj
        Write-Host $migrations
        Write-Host ""
    }
}
catch {
    Write-Host "Error checking migrations: $_" -ForegroundColor Red
}

Write-Host "`n2. Last 10 Applied Migrations (from database):" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

# Create a quick verification program
$verifyCode = @"
using Npgsql;
using System;

var connectionString = "Host=localhost;Port=5432;Database=dms_erp_db;Username=postgres;Password=10158";

try 
{
    using var connection = new NpgsqlConnection(connectionString);
    connection.Open();
    
    var sql = @""
        SELECT migration_id, 
               to_char(applied_at AT TIME ZONE 'Asia/Colombo', 'YYYY-MM-DD HH24:MI:SS') as applied_at
        FROM """"__EFMigrationsHistory""""
        ORDER BY applied_at DESC
        LIMIT 10
    "";
    
    using var command = new NpgsqlCommand(sql, connection);
    using var reader = command.ExecuteReader();
    
    Console.WriteLine(""{0,-60} {1}"", ""Migration ID"", ""Applied At"");
    Console.WriteLine(new string('-', 80));
    
    int count = 0;
    while (reader.Read())
    {
        Console.WriteLine(""{0,-60} {1}"", 
            reader.GetString(0), 
            reader.GetString(1));
        count++;
    }
    
    if (count == 0)
    {
        Console.WriteLine(""No migrations found in database!"");
    }
    else
    {
        Console.WriteLine(""\nTotal recent migrations: "" + count);
    }
}
catch (Exception ex)
{
    Console.WriteLine(""Error: "" + ex.Message);
    Environment.Exit(1);
}
"@

# Save and run the verification
$tempDir = New-Item -ItemType Directory -Force -Path "..\temp_verify"
Set-Content -Path "..\temp_verify\Program.cs" -Value $verifyCode

$csproj = @"
<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include=""Npgsql"" Version=""10.0.2"" />
  </ItemGroup>
</Project>
"@

Set-Content -Path "..\temp_verify\verify.csproj" -Value $csproj

Push-Location "..\temp_verify"
dotnet run --project verify.csproj 2>&1 | Out-String | Write-Host
Pop-Location

Remove-Item -Recurse -Force "..\temp_verify"

Write-Host "`n3. Checking for Pending Migrations..." -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

$pendingCheck = dotnet ef migrations list --project DMS-Backend.csproj --no-build 2>&1 | Select-String "Pending"

if ($pendingCheck) {
    Write-Host "⚠ WARNING: Pending migrations found!" -ForegroundColor Red
    Write-Host $pendingCheck -ForegroundColor Yellow
    Write-Host "`nTo apply pending migrations, run:" -ForegroundColor Cyan
    Write-Host "  dotnet ef database update --project DMS-Backend.csproj" -ForegroundColor White
} else {
    Write-Host "✓ No pending migrations. Database is up to date!" -ForegroundColor Green
}

Write-Host "`n==============================================`n" -ForegroundColor Cyan

Set-Location ..
