# Pre-flight check for AI Chat Drawer Integration (PowerShell)
# Validates contract structure, task files, and dependencies

$ErrorActionPreference = "Stop"

Write-Host "=== Pre-Flight Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if schema.json exists
if (-not (Test-Path ".parallel\contracts\schema.json")) {
  Write-Host "❌ ERROR: schema.json not found" -ForegroundColor Red
  exit 1
}
Write-Host "✅ schema.json exists" -ForegroundColor Green

# Check if task files exist
if (-not (Test-Path ".parallel\workstreams\frontend-tasks.md")) {
  Write-Host "❌ ERROR: frontend-tasks.md not found" -ForegroundColor Red
  exit 1
}
Write-Host "✅ frontend-tasks.md exists" -ForegroundColor Green

# Check if prompt files exist
if (-not (Test-Path ".parallel\prompts\frontend-prompt.md")) {
  Write-Host "❌ ERROR: frontend-prompt.md not found" -ForegroundColor Red
  exit 1
}
Write-Host "✅ frontend-prompt.md exists" -ForegroundColor Green

# Validate schema.json structure
Write-Host ""
Write-Host "Validating schema.json structure..." -ForegroundColor Cyan
node .parallel\validation\contract-validation.js

# Validate task count (max 3-4 per workstream)
$taskContent = Get-Content ".parallel\workstreams\frontend-tasks.md" -Raw
$taskCount = ([regex]::Matches($taskContent, "^### Task")).Count
if ($taskCount -gt 4) {
  Write-Host "❌ ERROR: Too many tasks ($taskCount). Maximum is 4." -ForegroundColor Red
  exit 1
}
Write-Host "✅ Task count within limits ($taskCount tasks)" -ForegroundColor Green

Write-Host ""
Write-Host "=== Pre-Flight Check Complete ===" -ForegroundColor Cyan
Write-Host "✅ All checks passed. Ready to proceed with execution." -ForegroundColor Green
