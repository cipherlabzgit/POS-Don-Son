# PowerShell script to apply database schema fix
$ErrorActionPreference = "Stop"

Write-Host "Applying database schema fix..." -ForegroundColor Cyan

$connectionString = "Host=localhost;Port=5432;Database=dms_erp_db;Username=postgres;Password=10158"

$sql = @"
-- Add client_mutation_id to stock_bf if it doesn't exist
DO `$`$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_bf' AND column_name = 'client_mutation_id'
    ) THEN
        ALTER TABLE stock_bf ADD COLUMN client_mutation_id character varying(80);
        CREATE INDEX IF NOT EXISTS ""IX_stock_bf_client_mutation_id"" ON stock_bf(client_mutation_id);
        RAISE NOTICE 'Added client_mutation_id column to stock_bf';
    ELSE
        RAISE NOTICE 'client_mutation_id column already exists in stock_bf';
    END IF;
END `$`$;

-- Create pos_theme_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS pos_theme_configs (
    ""Id"" uuid NOT NULL,
    theme_name character varying(100) NOT NULL,
    description character varying(500),
    primary_color character varying(7) NOT NULL,
    primary_light character varying(7),
    primary_dark character varying(7),
    accent_color character varying(7) NOT NULL,
    accent_light character varying(7),
    accent_dark character varying(7),
    is_active boolean NOT NULL DEFAULT false,
    is_system boolean NOT NULL DEFAULT false,
    display_order integer NOT NULL DEFAULT 0,
    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
    ""CreatedById"" uuid,
    ""UpdatedById"" uuid,
    CONSTRAINT ""PK_pos_theme_configs"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_pos_theme_configs_users_CreatedById"" FOREIGN KEY (""CreatedById"") REFERENCES users(""Id""),
    CONSTRAINT ""FK_pos_theme_configs_users_UpdatedById"" FOREIGN KEY (""UpdatedById"") REFERENCES users(""Id"")
);

-- Create indexes for pos_theme_configs
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_pos_theme_configs_CreatedById') THEN
        CREATE INDEX ""IX_pos_theme_configs_CreatedById"" ON pos_theme_configs(""CreatedById"");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_pos_theme_configs_UpdatedById') THEN
        CREATE INDEX ""IX_pos_theme_configs_UpdatedById"" ON pos_theme_configs(""UpdatedById"");
    END IF;
END `$`$;

-- Insert default Don & Sons theme if no themes exist
INSERT INTO pos_theme_configs (
    ""Id"", theme_name, description,
    primary_color, primary_light, primary_dark,
    accent_color, accent_light, accent_dark,
    is_system, display_order, is_active,
    ""CreatedAt"", ""UpdatedAt""
)
SELECT 
    gen_random_uuid(),
    'Don & Sons Default',
    'Classic Don & Sons red and gold theme',
    '#C8102E', '#E31837', '#A00D26',
    '#FFD100', '#FFDC33', '#CCAA00',
    true, 0, true,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM pos_theme_configs);
"@

try {
    # Find Npgsql DLL in NuGet packages
    $npgsqlDll = Get-ChildItem -Path "$env:USERPROFILE\.nuget\packages\npgsql" -Filter "Npgsql.dll" -Recurse -ErrorAction SilentlyContinue | 
                 Where-Object { $_.FullName -like "*net8.0*" -or $_.FullName -like "*net9.0*" -or $_.FullName -like "*net10.0*" -or $_.FullName -like "*netstandard2.1*" } | 
                 Select-Object -First 1

    if (-not $npgsqlDll) {
        Write-Host "ERROR: Npgsql DLL not found in NuGet cache. Installing Npgsql..." -ForegroundColor Yellow
        dotnet add package Npgsql --version 8.0.5
        $npgsqlDll = Get-ChildItem -Path "$env:USERPROFILE\.nuget\packages\npgsql" -Filter "Npgsql.dll" -Recurse | Select-Object -First 1
    }

    Write-Host "Loading Npgsql from: $($npgsqlDll.FullName)" -ForegroundColor Gray
    Add-Type -Path $npgsqlDll.FullName

    # Execute SQL
    $conn = New-Object Npgsql.NpgsqlConnection($connectionString)
    $conn.Open()
    
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $sql
    $cmd.ExecuteNonQuery() | Out-Null
    
    $conn.Close()

    Write-Host "`nSUCCESS: Database schema updated successfully!" -ForegroundColor Green
    Write-Host "   - client_mutation_id column added/verified in stock_bf" -ForegroundColor Gray
    Write-Host "   - pos_theme_configs table created/verified" -ForegroundColor Gray
    Write-Host "   - Default theme inserted" -ForegroundColor Gray
}
catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
