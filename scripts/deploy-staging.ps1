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
  Write-Host "[1/10] Fetch staging branch" -ForegroundColor Green
  Run "git" @("-C", $repo, "fetch", "origin", "+refs/heads/agent/btype-v1-complete:refs/remotes/origin/agent/btype-v1-complete")

  Write-Host "[2/10] Create isolated temporary worktree" -ForegroundColor Green
  Run "git" @("-C", $repo, "worktree", "add", "--detach", $worktree, $branch)

  Push-Location $worktree
  try {
    Write-Host "[3/10] Install dependencies" -ForegroundColor Green
    Run "npm.cmd" @("ci")

    Write-Host "[4/10] Re-create staging D1 only (production DB is never modified)" -ForegroundColor Green
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

    Write-Host "[5/10] Apply schema to staging D1" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--file", "migrations/0001_initial_schema.sql", "-y")

    Write-Host "[6/10] Read minako only from production D1" -ForegroundColor Green
    $users = QueryRows $prodDb "SELECT key_id,nickname,created_at,last_seen_at FROM users WHERE lower(trim(nickname))='minako';"
    if ($users.Count -eq 0) { throw "No user named minako was found in production D1" }

    $keyIds = @($users | ForEach-Object { [string]$_.key_id })
    $keyList = ($keyIds | ForEach-Object { SqlQuote $_ }) -join ","
    $preferences = QueryRows $prodDb "SELECT key_id,assist_mode,genres_json,updated_at FROM preferences WHERE key_id IN ($keyList);"
    $progress = QueryRows $prodDb "SELECT key_id,phrase_id,mission_id,accuracy,keystrokes,miss_keys_json,completed_at FROM progress WHERE key_id IN ($keyList) ORDER BY completed_at;"
    $completions = QueryRows $prodDb "SELECT key_id,mission_id,reward_id,completed_at FROM mission_completions WHERE key_id IN ($keyList) ORDER BY completed_at;"

    $sqlLines = New-Object System.Collections.Generic.List[string]
    $sqlLines.Add("PRAGMA foreign_keys = ON;")
    $sqlLines.Add("BEGIN TRANSACTION;")
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
    $sqlLines.Add("COMMIT;")
    Set-Content -LiteralPath $seedFile -Value $sqlLines -Encoding UTF8

    Write-Host "[7/10] Seed minako data into staging D1" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--file", $seedFile, "-y")

    Write-Host "[8/10] Build the B-type candidate" -ForegroundColor Green
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

    Write-Host "[9/10] Deploy to staging Worker only" -ForegroundColor Green
    Run "npx.cmd" @("wrangler", "deploy", "--config", $configPath)

    Write-Host "[10/10] Verify minako data in staging D1" -ForegroundColor Green
    $verifySql = "SELECT u.key_id,u.nickname,COUNT(DISTINCT p.phrase_id) AS phrase_count,COUNT(DISTINCT mc.mission_id) AS mission_count,MAX(u.last_seen_at) AS last_seen_at FROM users u LEFT JOIN progress p ON p.key_id=u.key_id LEFT JOIN mission_completions mc ON mc.key_id=u.key_id WHERE lower(trim(u.nickname))='minako' GROUP BY u.key_id,u.nickname;"
    Run "npx.cmd" @("wrangler", "d1", "execute", $stagingDb, "--remote", "--command", $verifySql)

    $url = "https://$stagingWorker.$workersSubdomain.workers.dev"
    Write-Host ""
    Write-Host "STAGING READY" -ForegroundColor Green
    Write-Host $url -ForegroundColor Yellow
    Write-Host "Only minako data was copied from production." -ForegroundColor Green
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
  if (Test-Path $seedFile) { Remove-Item -LiteralPath $seedFile -Force }
  if (Test-Path $worktree) {
    try { & git -C $repo worktree remove --force $worktree | Out-Null } catch { }
  }
}
