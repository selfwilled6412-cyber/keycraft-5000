param()

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$repoUrl = "https://github.com/selfwilled6412-cyber/keycraft-5000.git"
$branch = "agent/premium-game-ui-v2"
$stagingWorker = "keycraft-5000-staging"
$prodDb = "keycraft-5000-db"
$stagingDb = "keycraft-5000-staging-db"
$stagingBucket = "keycraft-5000-staging-deliverables"
$workersSubdomain = "selfwilled6412"
$cloneDir = Join-Path $env:TEMP ("keycraft-premium-clone-" + [Guid]::NewGuid().ToString("N"))
$seedFile = Join-Path $env:TEMP ("keycraft-minako-seed-" + [Guid]::NewGuid().ToString("N") + ".sql")

function Run([string]$command, [string[]]$arguments) {
  Write-Host ("> " + $command + " " + ($arguments -join " ")) -ForegroundColor Cyan
  & $command @arguments
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $command $($arguments -join ' ')" }
}

function SqlQuote([object]$value) {
  if ($null -eq $value) { return "NULL" }
  return "'" + ([string]$value).Replace("'", "''") + "'"
}

function QueryRows([string]$database, [string]$sql) {
  $raw = (& npx.cmd wrangler d1 execute $database --remote --command $sql --json | Out-String)
  if ($LASTEXITCODE -ne 0) { throw "D1 query failed on $database" }
  $parsed = $raw | ConvertFrom-Json
  $items = @($parsed)
  $rows = @()
  foreach ($item in $items) {
    if ($item.results) { $rows += @($item.results) }
  }
  return @($rows)
}

try {
  Write-Host "[1/12] Fresh-clone Premium UI v2 branch" -ForegroundColor Green
  Run "git" @("clone", "--depth", "1", "--single-branch", "--branch", $branch, $repoUrl, $cloneDir)

  Push-Location $cloneDir
  try {
    Write-Host "[2/12] Install dependencies" -ForegroundColor Green
    Run "npm.cmd" @("ci")

    Write-Host "[3/12] Re-create staging D1 only (production DB is never modified)" -ForegroundColor Green
    $listRaw = (& npx.cmd wrangler d1 list --json | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "Could not list D1 databases" }
    $dbs = $listRaw | ConvertFrom-Json
    if ($dbs | Where-Object { $_.name -eq $stagingDb }) {
      Run "npx.cmd" @("wrangler", "d1", "delete", $stagingDb, "-y")
    }
    Run "npx.cmd" @("wrangler", "d1", "create", $stagingDb, "--location", "apac", "--binding", "DB", "--update-config", "false")

    $listRaw = (& npx.cmd wrangler d1 list --json | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "Could not re-list D1 databases" }
    $dbs = $listRaw | ConvertFrom-Json
    $db = $dbs | Where-Object { $_.name -eq $stagingDb } | Select-Object -First 1
    if (-not $db) { throw "Staging D1 database was not found after creation" }
    $dbId = if ($db.uuid) { $db.uuid } elseif ($db.id) { $db.id } else { $null }
    if (-not $dbId) { throw "Could not determine staging D1 database id" }

    Write-Host "[4/12] Apply schema and deliverables registry to staging D1" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--file", "migrations/0001_initial_schema.sql", "-y")
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--file", "migrations/0002_deliverables.sql", "-y")

    Write-Host "[5/12] Ensure private staging R2 deliverables bucket exists" -ForegroundColor Green
    $r2List = (& npx.cmd wrangler r2 bucket list | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "Could not list R2 buckets" }
    if ($r2List -notmatch [regex]::Escape($stagingBucket)) {
      Run "npx.cmd" @("wrangler", "r2", "bucket", "create", $stagingBucket, "--location", "apac")
    } else {
      Write-Host "R2 bucket already exists: $stagingBucket" -ForegroundColor DarkGreen
    }

    Write-Host "[6/12] Read minako only from production D1 (read-only queries)" -ForegroundColor Green
    $users = QueryRows $prodDb "SELECT key_id,nickname,created_at,last_seen_at FROM users WHERE lower(trim(nickname))='minako';"
    if ($users.Count -eq 0) { throw "No user named minako was found in production D1" }

    $keyIds = @($users | ForEach-Object { [string]$_.key_id })
    $keyList = ($keyIds | ForEach-Object { SqlQuote $_ }) -join ","
    $preferences = QueryRows $prodDb "SELECT key_id,assist_mode,genres_json,updated_at FROM preferences WHERE key_id IN ($keyList);"
    $progress = QueryRows $prodDb "SELECT key_id,phrase_id,mission_id,accuracy,keystrokes,miss_keys_json,completed_at FROM progress WHERE key_id IN ($keyList) ORDER BY completed_at;"
    $completions = QueryRows $prodDb "SELECT key_id,mission_id,reward_id,completed_at FROM mission_completions WHERE key_id IN ($keyList) ORDER BY completed_at;"

    $sqlLines = New-Object System.Collections.Generic.List[string]
    foreach ($row in $users) {
      $sqlLines.Add("INSERT INTO users (key_id,nickname,created_at,last_seen_at) VALUES ($(SqlQuote $row.key_id),$(SqlQuote $row.nickname),$(SqlQuote $row.created_at),$(SqlQuote $row.last_seen_at));")
    }
    foreach ($row in $preferences) {
      $sqlLines.Add("INSERT INTO preferences (key_id,assist_mode,genres_json,updated_at) VALUES ($(SqlQuote $row.key_id),$(SqlQuote $row.assist_mode),$(SqlQuote $row.genres_json),$(SqlQuote $row.updated_at));")
    }
    foreach ($row in $progress) {
      $accuracy = [Convert]::ToString($row.accuracy, [Globalization.CultureInfo]::InvariantCulture)
      $keystrokes = [int]$row.keystrokes
      $sqlLines.Add("INSERT INTO progress (key_id,phrase_id,mission_id,accuracy,keystrokes,miss_keys_json,completed_at) VALUES ($(SqlQuote $row.key_id),$(SqlQuote $row.phrase_id),$(SqlQuote $row.mission_id),$accuracy,$keystrokes,$(SqlQuote $row.miss_keys_json),$(SqlQuote $row.completed_at));")
    }
    foreach ($row in $completions) {
      $sqlLines.Add("INSERT INTO mission_completions (key_id,mission_id,reward_id,completed_at) VALUES ($(SqlQuote $row.key_id),$(SqlQuote $row.mission_id),$(SqlQuote $row.reward_id),$(SqlQuote $row.completed_at));")
    }
    Set-Content -LiteralPath $seedFile -Value $sqlLines -Encoding UTF8

    Write-Host "[7/12] Seed minako data into staging D1" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--file", $seedFile, "-y")

    Write-Host "[8/12] Build Premium UI v2 + automatic deliverables" -ForegroundColor Green
    Run "npm.cmd" @("run", "build")

    $configPath = Join-Path $cloneDir "wrangler.staging.generated.jsonc"
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
  "r2_buckets": [
    {
      "binding": "DELIVERABLES",
      "bucket_name": "$stagingBucket"
    }
  ],
  "observability": { "enabled": true, "head_sampling_rate": 1 }
}
"@
    Set-Content -LiteralPath $configPath -Value $config -Encoding UTF8

    Write-Host "[9/12] Deploy Premium UI v2 to staging Worker only" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "deploy", "--config", $configPath)

    Write-Host "[10/12] Verify minako data in staging D1" -ForegroundColor Green
    $verifySql = "SELECT u.key_id,u.nickname,COUNT(DISTINCT p.phrase_id) AS phrase_count,COUNT(DISTINCT mc.mission_id) AS mission_count,MAX(u.last_seen_at) AS last_seen_at FROM users u LEFT JOIN progress p ON p.key_id=u.key_id LEFT JOIN mission_completions mc ON mc.key_id=u.key_id WHERE lower(trim(u.nickname))='minako' GROUP BY u.key_id,u.nickname;"
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--command", $verifySql)

    Write-Host "[11/12] Verify deliverables registry" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--command", "SELECT name FROM sqlite_master WHERE type='table' AND name='deliverables';")

    Write-Host "[12/12] HTTP check" -ForegroundColor Green
    $url = "https://$stagingWorker.$workersSubdomain.workers.dev"
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
      Write-Host ("HTTP " + [int]$response.StatusCode + " confirmed") -ForegroundColor Green
    } catch {
      Write-Warning "Deployment completed, but automatic HTTP check failed. Open the URL manually."
    }

    Write-Host ""
    Write-Host "PREMIUM UI V2 + AUTO DELIVERABLES STAGING READY" -ForegroundColor Green
    Write-Host $url -ForegroundColor Yellow
    Write-Host "Automatic PNG flow: MISSION CLEAR + CURRENT SETTLEMENT + DISTRICT COMPLETE + HERO UNLOCK -> private R2." -ForegroundColor Green
    Write-Host "Only minako data was copied from production. Production Worker, D1 and R2 were not modified." -ForegroundColor Green
  }
  finally { Pop-Location }
}
finally {
  if (Test-Path $seedFile) { try { Remove-Item -LiteralPath $seedFile -Force -ErrorAction SilentlyContinue } catch { } }
  if (Test-Path $cloneDir) { try { Remove-Item -LiteralPath $cloneDir -Recurse -Force -ErrorAction SilentlyContinue } catch { } }
}
