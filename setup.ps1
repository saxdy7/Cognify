<#
    Cognify local setup — Windows / PowerShell

    Usage:
        cd C:\Users\User\Desktop\sandeep\cognify
        powershell -ExecutionPolicy Bypass -File .\setup.ps1

    Checks prerequisites, installs dependencies, scaffolds .env.local,
    and starts the dev server.
#>

$ErrorActionPreference = 'Stop'

function Write-Step { param($m) Write-Host "`n==> $m" -ForegroundColor Cyan }
function Write-Ok   { param($m) Write-Host "    OK  $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "    !   $m" -ForegroundColor Yellow }
function Write-Err  { param($m) Write-Host "    X   $m" -ForegroundColor Red }

# --- 1. Confirm we're in the project root -----------------------------------
Write-Step "Checking project folder"
if (-not (Test-Path './package.json')) {
    Write-Err "No package.json here. cd into the cognify folder first, e.g."
    Write-Host "        cd C:\Users\User\Desktop\sandeep\cognify" -ForegroundColor Gray
    exit 1
}
$pkg = Get-Content './package.json' -Raw | ConvertFrom-Json
if ($pkg.name -ne 'cognify') {
    Write-Err "This is '$($pkg.name)', not the cognify project."
    exit 1
}
Write-Ok "Found cognify v$($pkg.version) in $(Get-Location)"

# --- 2. Prerequisites --------------------------------------------------------
Write-Step "Checking prerequisites"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js not found. Install Node 20+ from https://nodejs.org and re-run."
    exit 1
}
$nodeMajor = ((node -v) -replace '^v','').Split('.')[0] -as [int]
if ($nodeMajor -lt 20) {
    Write-Err "Node $(node -v) is too old. Cognify needs Node 20+ (22 recommended)."
    exit 1
}
Write-Ok "Node $(node -v)"

$useBun = $true
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Warn "Bun not found. Installing it (recommended - npm breaks the CSS build)..."
    try {
        Invoke-RestMethod bun.sh/install.ps1 | Invoke-Expression
        $env:Path = "$env:USERPROFILE\.bun\bin;$env:Path"
    } catch {
        Write-Warn "Bun install failed; falling back to npm."
        $useBun = $false
    }
}
if ($useBun -and (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Ok "Bun $(bun -v)"
} else {
    $useBun = $false
    Write-Warn "Using npm. If the build fails on 'lightningcss', install Bun and re-run."
}

# --- 3. Dependencies ---------------------------------------------------------
Write-Step "Installing dependencies (this takes a minute)"
if ($useBun) {
    bun install
} else {
    # npm drops the platform-specific lightningcss binary Tailwind v4 needs
    # unless optional deps are forced and the lockfile is regenerated.
    if (Test-Path './package-lock.json') { Remove-Item './package-lock.json' }
    npm install --include=optional --no-audit --no-fund
}
if ($LASTEXITCODE -ne 0) { Write-Err "Dependency install failed."; exit 1 }
Write-Ok "Dependencies installed"

# --- 4. Environment ----------------------------------------------------------
Write-Step "Checking environment variables"
if (-not (Test-Path './.env.local')) {
    Copy-Item './.env.example' './.env.local'
    Write-Warn ".env.local created from the template - it has PLACEHOLDER values."
}

$envText     = Get-Content './.env.local' -Raw
$placeholder = $envText -match 'your-project\.supabase\.co' -or $envText -match 'your-anon-key'

if ($placeholder) {
    Write-Host ""
    Write-Warn "Supabase credentials are not filled in yet."
    Write-Host "        The app will START, but login and all data features will fail." -ForegroundColor Gray
    Write-Host ""
    Write-Host "        Get your keys: Supabase Dashboard > Project Settings > API" -ForegroundColor Gray
    Write-Host "        Then edit:     $(Join-Path (Get-Location) '.env.local')" -ForegroundColor Gray
    Write-Host ""
    $answer = Read-Host "        Open .env.local in Notepad now? (y/N)"
    if ($answer -eq 'y') {
        Start-Process notepad '.env.local' -Wait
        Write-Ok "Saved. Restarting check..."
    }
} else {
    Write-Ok "Supabase credentials present"
}

# --- 5. Run ------------------------------------------------------------------
Write-Step "Starting the dev server"
Write-Host "    Once it says 'Ready', open http://localhost:3000" -ForegroundColor Gray
Write-Host "    Press Ctrl+C to stop.`n" -ForegroundColor Gray

if ($useBun) { bun run dev } else { npm run dev }
