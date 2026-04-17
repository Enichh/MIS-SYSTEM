#!/bin/bash

# Pre-flight check script for AI feature parallel implementation
# Validates that the plan is ready for execution

echo "=== Pre-Flight Check ==="
echo ""

# Check if required directories exist
echo "1. Checking directory structure..."
if [ -d ".parallel/contracts" ] && [ -d ".parallel/workstreams" ] && [ -d ".parallel/prompts" ] && [ -d ".parallel/validation" ]; then
    echo "✓ Directory structure exists"
else
    echo "✗ Directory structure incomplete"
    exit 1
fi

# Check if schema.json exists and is valid JSON
echo ""
echo "2. Checking schema.json..."
if [ -f ".parallel/contracts/schema.json" ]; then
    if command -v node &> /dev/null; then
        if node -e "JSON.parse(require('fs').readFileSync('.parallel/contracts/schema.json', 'utf8'))" 2>/dev/null; then
            echo "✓ schema.json is valid JSON"
        else
            echo "✗ schema.json is not valid JSON"
            exit 1
        fi
    else
        echo "⚠ Node not available, skipping JSON validation"
    fi
else
    echo "✗ schema.json not found"
    exit 1
fi

# Check if task files exist
echo ""
echo "3. Checking workstream task files..."
if [ -f ".parallel/workstreams/shared-tasks.md" ] && [ -f ".parallel/workstreams/backend-tasks.md" ] && [ -f ".parallel/workstreams/frontend-tasks.md" ]; then
    echo "✓ All task files exist"
else
    echo "✗ Task files incomplete"
    exit 1
fi

# Check if prompt files exist
echo ""
echo "4. Checking prompt files..."
if [ -f ".parallel/prompts/shared-prompt.md" ] && [ -f ".parallel/prompts/backend-prompt.md" ] && [ -f ".parallel/prompts/frontend-prompt.md" ]; then
    echo "✓ All prompt files exist"
else
    echo "✗ Prompt files incomplete"
    exit 1
fi

# Check task count limits (max 4 per workstream)
echo ""
echo "5. Checking task count limits..."
SHARED_TASKS=$(grep -c "^### Task" .parallel/workstreams/shared-tasks.md || echo "0")
BACKEND_TASKS=$(grep -c "^### Task" .parallel/workstreams/backend-tasks.md || echo "0")
FRONTEND_TASKS=$(grep -c "^### Task" .parallel/workstreams/frontend-tasks.md || echo "0")

if [ "$SHARED_TASKS" -le 4 ] && [ "$BACKEND_TASKS" -le 4 ] && [ "$FRONTEND_TASKS" -le 4 ]; then
    echo "✓ Task count within limits (shared: $SHARED_TASKS, backend: $BACKEND_TASKS, frontend: $FRONTEND_TASKS)"
else
    echo "✗ Task count exceeds limit (max 4 per workstream)"
    exit 1
fi

echo ""
echo "=== Pre-Flight Check Passed ==="
echo ""
echo "Next steps:"
echo "1. Review .parallel/contracts/schema.json (source of truth)"
echo "2. Run contract validation: node .parallel/validation/contract-validation.js"
echo "3. Open separate AI windows for each workstream"
echo "4. Execute shared workstream first, then backend/frontend in parallel"
