@echo off
echo 🔍 Validating parallel work configuration...

REM 1. Schema validation
python -c "import json; json.load(open('.parallel/contracts/schema.json'))" 2>nul
if errorlevel 1 (
    echo ❌ schema.json is invalid JSON
    exit /b 1
)
echo ✅ schema.json is valid JSON

REM 2. Check for naming collisions across workstreams
node .parallel/validation/cross-reference.js
if errorlevel 1 (
    echo ❌ Naming collisions detected
    exit /b 1
)

REM 3. Verify task files don't exceed 3 tasks
for %%f in (.parallel/workstreams/*-tasks.md) do (
    find /c "### Task" %%f > temp.txt
    set /p count=<temp.txt
    del temp.txt
    if !count! GTR 3 (
        echo ❌ %%f has !count! tasks (max 3 allowed)
        exit /b 1
    )
    echo ✅ %%f: !count! tasks
)

echo ✅ Pre-flight checks passed. Safe to start parallel work.
