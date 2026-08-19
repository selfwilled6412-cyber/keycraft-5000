param(
  [string]$RepoPath = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$repo = (Resolve-Path $RepoPath).Path
$branch = "origin/agent/btype-v1-complete"
$stagingWorker = "keycraft-5000-staging"
$prodDb = "keycraft-5000-db"
$stagingDb = "keycraft-5000-staging-db"
$workersSubdomain = "selfwilled6412"
$worktree = Join-Path $env:TEMP ("keycraft-5000-staging-" + [Guid]::NewGuid().ToString("N"))
$exportFile = Join-Path $env:TEMP ("keycraft-prod-copy-" + [Guid]::NewGuid().ToString("N") + ".sql")

function Run([string]$command, [string[]]$arguments) {
  Write-Host ("> " + $command + " " + ($arguments -join " ")) -ForegroundColor Cyan
  & $command @arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $command $($arguments -join ' ')" }
}

try {
  Write-Host "[1/9] Fetch staging branch" -ForegroundColor Green
  Run "git" @("-C", $repo, "fetch", "origin", "agent/btype-v1-complete")

  Write-Host "[2/9] Create isolated temporary worktree" -ForegroundColor Green
  Run "git" @("-C", $repo, "worktree", "add", "--detach", $worktree, $branch)

  Push-Location $worktree
  try {
    Write-Host "[3/9] Install dependencies" -ForegroundColor Green
    Run "npm.cmd" @("ci")

    Write-Host "[4/9] Re-create staging D1 only (production DB is never modified)" -ForegroundColor Green
    $listRaw = (& npx.cmd wrangler d1 list --json | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "Could not list D1 databases" }
    $dbs = $listRaw | ConvertFrom-Json
    if ($dbs | Where-Object { $_.name -eq $stagingDb }) {
      Run "npx.cmd" @("wrangler", "d1", "delete", $stagingDb, "-y")
    }
    Run "npx.cmd" @("wrangler", "d1", "create", $stagingDb, "--location", "apac")

    $listRaw = (& npx.cmd wrangler d1 list --json | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "Could not re-list D1 databases" }
    $dbs = $listRaw | ConvertFrom-Json
    $db = $dbs | Where-Object { $_.name -eq $stagingDb } | Select-Object -First 1
    if (-not $db) { throw "Staging D1 database was not found after creation" }
    $dbId = if ($db.uuid) { $db.uuid } elseif ($db.id) { $db.id } else { $null }
    if (-not $dbId) { throw "Could not determine staging D1 database id" }

    Write-Host "[5/9] Export production D1 to a temporary local file (read-only operation)" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "d1", "export", $prodDb, "--remote", "--output", $exportFile, "-y")

    Write-Host "[6/9] Import the copy into staging D1" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--file", $exportFile, "-y")

    Write-Host "[7/9] Build the B-type candidate" -ForegroundColor Green
    Run "npm.cmd" @("run", "build")

    $configPath = Join-Path $worktree "wrangler.staging.generated.jsonc"
    $config = @"
{
  "`$schema": "./node_modules/wrangler/config-schema.json",
  "name": "$stagingWorker",
  "main": "worker/index.ts",
  "compatibility_date": "2026-08-17",
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": true,
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "$stagingDb",
      "database_id": "$dbId",
      "migrations_dir": "./migrations"
    }
  ],
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
}
"@
    Set-Content -LiteralPath $configPath -Value $config -Encoding UTF8

    Write-Host "[8/9] Deploy to staging Worker only" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "deploy", "--config", $configPath)

    Write-Host "[9/9] Verify minako data in copied staging D1" -ForegroundColor Green
    $sql = "SELECT u.key_id,u.nickname,COUNT(DISTINCT p.phrase_id) AS phrase_count,COUNT(DISTINCT mc.mission_id) AS mission_count,MAX(u.last_seen_at) AS last_seen_at FROM users u LEFT JOIN progress p ON p.key_id=u.key_id LEFT JOIN mission_completions mc ON mc.key_id=u.key_id WHERE lower(trim(u.nickname))='minako' GROUP BY u.key_id,u.nickname;"
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--command", $sql)

    $url = "https://$stagingWorker.$workersSubdomain.workers.dev"
    Write-Host ""
    Write-Host "STAGING READY" -ForegroundColor Green
    Write-Host $url -ForegroundColor Yellow
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
      Write-Host ("HTTP " + [int]$response.StatusCode + " confirmed") -ForegroundColor Green
    } catch {
      Write-Warning "Deployment completed, but automatic HTTP check failed. Open the URL manually."
    }
  }
  finally {
    Pop-Location
  }
}
finally {
  if (Test-Path $exportFile) { Remove-Item -LiteralPath $exportFile -Force }
  if (Test-Path $worktree) {
    try { & git -C $repo worktree remove --force $worktree | Out-Null } catch { }
  }
}
