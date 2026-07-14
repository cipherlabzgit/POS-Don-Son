# PowerShell script to fix the Dockerfile
$dockerfilePath = "DMS-Backend\Dockerfile"

if (Test-Path $dockerfilePath) {
    $content = Get-Content $dockerfilePath -Raw
    $content = $content -replace '/p:PublishReadyToRun=true', '/p:PublishReadyToRun=false'
    Set-Content $dockerfilePath -Value $content
    Write-Host "✓ Dockerfile fixed successfully!" -ForegroundColor Green
    Write-Host "PublishReadyToRun has been set to false" -ForegroundColor Green
} else {
    Write-Host "✗ Error: Dockerfile not found at $dockerfilePath" -ForegroundColor Red
    Write-Host "Make sure you're in the DonandSons-DMS directory" -ForegroundColor Yellow
}
