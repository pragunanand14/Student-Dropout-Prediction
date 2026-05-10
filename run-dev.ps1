$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

if (-not (Test-Path (Join-Path $backendPath 'app.py'))) {
  Write-Error "Backend entry file not found at $backendPath\app.py"
  exit 1
}

if (-not (Test-Path (Join-Path $frontendPath 'package.json'))) {
  Write-Error "Frontend package.json not found at $frontendPath"
  exit 1
}

Write-Host "Starting backend on http://localhost:5000 ..."
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$backendPath'; python app.py"
)

Write-Host "Starting frontend on http://localhost:3000 ..."
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$frontendPath'; npm run dev"
)

Write-Host "Both apps are launching in separate PowerShell windows."
Write-Host "Open http://localhost:3000 for the Vite dev app."
