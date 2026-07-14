# PowerShell Script to Fix Dark Mode Colors
# Run this in PowerShell: .\scripts\Fix-DarkMode.ps1

Write-Host "🌓 Dark Mode Bulk Fix Script" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

$srcPath = Join-Path $PSScriptRoot "..\src\app\(dashboard)"

# Color replacements - Light text in dark mode, dark text in light mode
$replacements = @(
    # Text colors - Primary (dark in light mode → light in dark mode)
    @{ Pattern = "color: '#111827'"; Replace = "color: 'var(--foreground)'" },
    @{ Pattern = "color: '#171717'"; Replace = "color: 'var(--foreground)'" },
    @{ Pattern = "color: '#000000'"; Replace = "color: 'var(--foreground)'" },
    @{ Pattern = "color: '#1F2937'"; Replace = "color: 'var(--foreground)'" },
    
    # Text colors - Secondary (grey in light mode → lighter in dark mode)
    @{ Pattern = "color: '#6B7280'"; Replace = "color: 'var(--muted-foreground)'" },
    @{ Pattern = "color: '#9CA3AF'"; Replace = "color: 'var(--muted-foreground)'" },
    @{ Pattern = "color: '#374151'"; Replace = "color: 'var(--foreground)'" },
    @{ Pattern = "color: '#4B5563'"; Replace = "color: 'var(--foreground)'" },
    @{ Pattern = "color: '#64748b'"; Replace = "color: 'var(--muted-foreground)'" },
    
    # Background colors - Cards and surfaces
    @{ Pattern = "backgroundColor: '#ffffff'"; Replace = "backgroundColor: 'var(--card)'" },
    @{ Pattern = "backgroundColor: '#FFFFFF'"; Replace = "backgroundColor: 'var(--card)'" },
    @{ Pattern = "backgroundColor: 'white'"; Replace = "backgroundColor: 'var(--card)'" },
    @{ Pattern = "backgroundColor: '#F9FAFB'"; Replace = "backgroundColor: 'var(--muted)'" },
    @{ Pattern = "backgroundColor: '#F3F4F6'"; Replace = "backgroundColor: 'var(--muted)'" },
    @{ Pattern = "backgroundColor: '#f9fafb'"; Replace = "backgroundColor: 'var(--muted)'" },
    
    # Borders
    @{ Pattern = "border: '1px solid #E5E7EB'"; Replace = "border: '1px solid var(--border)'" },
    @{ Pattern = "border: '1px solid #e5e7eb'"; Replace = "border: '1px solid var(--border)'" },
    @{ Pattern = "borderColor: '#E5E7EB'"; Replace = "borderColor: 'var(--border)'" },
    @{ Pattern = "borderColor: '#e5e7eb'"; Replace = "borderColor: 'var(--border)'" },
    @{ Pattern = "borderBottom: '1px solid #E5E7EB'"; Replace = "borderBottom: '1px solid var(--border)'" },
    @{ Pattern = "borderTop: '1px solid #E5E7EB'"; Replace = "borderTop: '1px solid var(--border)'" },
    @{ Pattern = "borderLeft: '1px solid #E5E7EB'"; Replace = "borderLeft: '1px solid var(--border)'" },
    @{ Pattern = "borderRight: '1px solid #E5E7EB'"; Replace = "borderRight: '1px solid var(--border)'" },
    @{ Pattern = "borderColor: '#D1D5DB'"; Replace = "borderColor: 'var(--input)'" },
    @{ Pattern = "borderColor: '#d1d5db'"; Replace = "borderColor: 'var(--input)'" },
    
    # Inline border strings
    @{ Pattern = "'1px solid #E5E7EB'"; Replace = "'1px solid var(--border)'" },
    @{ Pattern = "'1px solid #e5e7eb'"; Replace = "'1px solid var(--border)'" },
    @{ Pattern = "`"1px solid #E5E7EB`""; Replace = "'1px solid var(--border)'" },
    @{ Pattern = "`"1px solid #e5e7eb`""; Replace = "'1px solid var(--border)'" },
    @{ Pattern = "'1px solid #D1D5DB'"; Replace = "'1px solid var(--input)'" },
    @{ Pattern = "'1px solid #d1d5db'"; Replace = "'1px solid var(--input)'" }
)

Write-Host "📁 Scanning: $srcPath" -ForegroundColor Yellow
Write-Host ""

$files = Get-ChildItem -Path $srcPath -Filter "*.tsx" -Recurse -File
$totalFiles = $files.Count
$fixedFiles = 0

Write-Host "📝 Found $totalFiles files to process" -ForegroundColor Green
Write-Host ""

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    foreach ($replacement in $replacements) {
        if ($content -match [regex]::Escape($replacement.Pattern)) {
            $content = $content -replace [regex]::Escape($replacement.Pattern), $replacement.Replace
            $changed = $true
        }
    }
    
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Green
        $fixedFiles++
    } else {
        Write-Host "⏭️  Skipped: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "✨ Complete!" -ForegroundColor Green
Write-Host "Fixed $fixedFiles out of $totalFiles files" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎨 Test your app now - dark mode should work!" -ForegroundColor Magenta
