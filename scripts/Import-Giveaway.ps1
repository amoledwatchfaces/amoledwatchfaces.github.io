<#
.SYNOPSIS
  Upload Google Play Console promo codes CSV to your amoledwatchfaces Giveaway.

.EXAMPLE
  .\scripts\Import-Giveaway.ps1 -CsvPath "promo_codes.csv" -Title "Ultra 2 Watch Face" -PackageName "com.amoledwatchfaces.ultra2"
#>

param (
  [Parameter(Mandatory=$true)]
  [string]$CsvPath,

  [Parameter(Mandatory=$true)]
  [string]$Title,

  [Parameter(Mandatory=$false)]
  [string]$PackageName = "",

  [Parameter(Mandatory=$false)]
  [string]$IconUrl = "assets/logo_notification.webp",

  [Parameter(Mandatory=$false)]
  [string]$AdminSecret = "awf-giveaway-secret-2026",

  [Parameter(Mandatory=$false)]
  [string]$ApiUrl = "https://giveawayapi-66490687416.europe-west1.run.app?action=import"
)

if (-not (Test-Path $CsvPath)) {
  Write-Error "CSV file not found at path: $CsvPath"
  exit 1
}

$csvContent = Get-Content -Path $CsvPath -Raw

$body = @{
  action = "import"
  adminSecret = $AdminSecret
  title = $Title
  packageName = $PackageName
  iconUrl = $IconUrl
  codesCsv = $csvContent
} | ConvertTo-Json

Write-Host "Uploading promo codes for '$Title'..." -ForegroundColor Cyan

try {
  $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
  if ($response.success) {
    Write-Host "`n🎉 Success! $($response.message)" -ForegroundColor Green
    Write-Host "Total Codes in Firestore: $($response.totalCodes)" -ForegroundColor Green
  } else {
    Write-Host "`n❌ Error: $($response.error)" -ForegroundColor Red
  }
} catch {
  Write-Host "`n❌ Request failed: $_" -ForegroundColor Red
}
