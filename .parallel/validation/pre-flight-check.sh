#!/bin/bash

echo "=== Pre-Flight Check ==="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ Node.js and npm are available"
echo ""

# Run contract validation
echo "=== Running Contract Validation ==="
node .parallel/validation/contract-validation.js
VALIDATION_RESULT=$?

if [ $VALIDATION_RESULT -ne 0 ]; then
    echo "❌ Contract validation failed"
    exit 1
fi

echo ""

# Check if all required directories exist
echo "=== Checking Directory Structure ==="
REQUIRED_DIRS=(
    ".parallel/contracts"
    ".parallel/workstreams"
    ".parallel/prompts"
    ".parallel/validation"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir exists"
    else
        echo "❌ $dir does not exist"
        exit 1
    fi
done

echo ""

# Check if all required files exist
echo "=== Checking Required Files ==="
REQUIRED_FILES=(
    ".parallel/contracts/schema.json"
    ".parallel/workstreams/shared-tasks.md"
    ".parallel/workstreams/backend-tasks.md"
    ".parallel/workstreams/frontend-tasks.md"
    ".parallel/prompts/shared-prompt.md"
    ".parallel/prompts/backend-prompt.md"
    ".parallel/prompts/frontend-prompt.md"
    ".parallel/validation/contract-validation.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file does not exist"
        exit 1
    fi
done

echo ""

# Check schema.json syntax
echo "=== Checking schema.json Syntax ==="
if node -e "JSON.parse(require('fs').readFileSync('.parallel/contracts/schema.json', 'utf8'))" 2>/dev/null; then
    echo "✅ schema.json is valid JSON"
else
    echo "❌ schema.json is not valid JSON"
    exit 1
fi

echo ""

# Check workstream task files for required sections
echo "=== Checking Workstream Task Files ==="
WORKSTREAMS=("shared" "backend" "frontend")

for ws in "${WORKSTREAMS[@]}"; do
    file=".parallel/workstreams/${ws}-tasks.md"
    if grep -q "SCOPE BOUNDARIES" "$file"; then
        echo "✅ $file has SCOPE BOUNDARIES section"
    else
        echo "❌ $file missing SCOPE BOUNDARIES section"
        exit 1
    fi
    
    if grep -q "Pre-Completion Checklist" "$file"; then
        echo "✅ $file has Pre-Completion Checklist section"
    else
        echo "❌ $file missing Pre-Completion Checklist section"
        exit 1
    fi
done

echo ""

# Check prompt files for required phases
echo "=== Checking Prompt Files ==="
PROMPTS=("shared" "backend" "frontend")

for prompt in "${PROMPTS[@]}"; do
    file=".parallel/prompts/${prompt}-prompt.md"
    if grep -q "PHASE 1: BOOT" "$file"; then
        echo "✅ $file has PHASE 1: BOOT section"
    else
        echo "❌ $file missing PHASE 1: BOOT section"
        exit 1
    fi
    
    if grep -q "PHASE 2: TASK" "$file"; then
        echo "✅ $file has PHASE 2: TASK section"
    else
        echo "❌ $file missing PHASE 2: TASK section"
        exit 1
    fi
    
    if grep -q "PHASE 3: GUARDRAILS" "$file"; then
        echo "✅ $file has PHASE 3: GUARDRAILS section"
    else
        echo "❌ $file missing PHASE 3: GUARDRAILS section"
        exit 1
    fi
    
    if grep -q "PHASE 4: REPORT" "$file"; then
        echo "✅ $file has PHASE 4: REPORT section"
    else
        echo "❌ $file missing PHASE 4: REPORT section"
        exit 1
    fi
done

echo ""
echo "=== Pre-Flight Check Complete ==="
echo "✅ All checks passed!"
echo ""
echo "Next Steps:"
echo "1. Review .parallel/contracts/schema.json (source of truth)"
echo "2. Open separate AI windows for each workstream"
echo "3. Execute shared workstream first, then backend/frontend in parallel"
echo "4. Run integration validation after completion"
