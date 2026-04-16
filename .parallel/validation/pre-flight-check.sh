#!/bin/bash
# Pre-flight validation script for dark mode toggle feature

echo "=== Pre-Flight Validation ==="
echo ""

# Check if .parallel directory exists
if [ ! -d ".parallel" ]; then
    echo "❌ ERROR: .parallel directory does not exist"
    exit 1
fi

# Check if schema.json exists
if [ ! -f ".parallel/contracts/schema.json" ]; then
    echo "❌ ERROR: schema.json does not exist"
    exit 1
fi

echo "✓ .parallel directory exists"
echo "✓ schema.json exists"

# Validate JSON syntax
if command -v node &> /dev/null; then
    node -e "JSON.parse(require('fs').readFileSync('.parallel/contracts/schema.json', 'utf8'))" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ schema.json is valid JSON"
    else
        echo "❌ ERROR: schema.json is not valid JSON"
        exit 1
    fi
else
    echo "⚠ WARNING: Node not found, skipping JSON validation"
fi

# Check if task files exist
if [ ! -f ".parallel/workstreams/shared-tasks.md" ]; then
    echo "❌ ERROR: shared-tasks.md does not exist"
    exit 1
fi

if [ ! -f ".parallel/workstreams/frontend-tasks.md" ]; then
    echo "❌ ERROR: frontend-tasks.md does not exist"
    exit 1
fi

echo "✓ shared-tasks.md exists"
echo "✓ frontend-tasks.md exists"

# Check if prompts exist
if [ ! -f ".parallel/prompts/shared-prompt.md" ]; then
    echo "❌ ERROR: shared-prompt.md does not exist"
    exit 1
fi

if [ ! -f ".parallel/prompts/frontend-prompt.md" ]; then
    echo "❌ ERROR: frontend-prompt.md does not exist"
    exit 1
fi

echo "✓ shared-prompt.md exists"
echo "✓ frontend-prompt.md exists"

# Check task count limits
shared_task_count=$(grep -c "^### Task" .parallel/workstreams/shared-tasks.md || echo 0)
frontend_task_count=$(grep -c "^### Task" .parallel/workstreams/frontend-tasks.md || echo 0)

echo "Shared workstream tasks: $shared_task_count"
echo "Frontend workstream tasks: $frontend_task_count"

if [ $shared_task_count -gt 4 ]; then
    echo "⚠ WARNING: shared workstream has more than 4 tasks"
fi

if [ $frontend_task_count -gt 4 ]; then
    echo "⚠ WARNING: frontend workstream has more than 4 tasks"
fi

echo ""
echo "=== Pre-Flight Validation Complete ==="
echo "✓ All checks passed"
