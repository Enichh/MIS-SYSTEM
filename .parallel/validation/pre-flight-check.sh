#!/bin/bash

# Pre-Flight Check Script
# Validates plan integrity before parallel execution begins

echo "=== Pre-Flight Validation ==="
echo ""

# Check 1: Schema JSON structure and syntax
echo "1. Validating schema.json structure..."
if [ -f ".parallel/contracts/schema.json" ]; then
    if command -v python &> /dev/null; then
        python -c "import json; json.load(open('.parallel/contracts/schema.json'))" 2>&1
        if [ $? -eq 0 ]; then
            echo "   ✓ schema.json is valid JSON"
        else
            echo "   ✗ schema.json has syntax errors"
            exit 1
        fi
    else
        echo "   ⚠ Python not available, skipping JSON validation"
    fi
else
    echo "   ✗ schema.json not found"
    exit 1
fi

# Check 2: Task files exist
echo "2. Validating task files..."
required_tasks=("shared-tasks.md" "components-tasks.md" "layouts-tasks.md" "integration-tasks.md")
for task in "${required_tasks[@]}"; do
    if [ -f ".parallel/workstreams/$task" ]; then
        echo "   ✓ $task exists"
    else
        echo "   ✗ $task not found"
        exit 1
    fi
done

# Check 3: Prompt files exist
echo "3. Validating prompt files..."
required_prompts=("shared-prompt.md" "components-prompt.md" "layouts-prompt.md" "integration-prompt.md")
for prompt in "${required_prompts[@]}"; do
    if [ -f ".parallel/prompts/$prompt" ]; then
        echo "   ✓ $prompt exists"
    else
        echo "   ✗ $prompt not found"
        exit 1
    fi
done

# Check 4: Task count limits (max 4 per workstream)
echo "4. Validating task count limits..."
for task_file in .parallel/workstreams/*-tasks.md; do
    task_count=$(grep -c "^### Task" "$task_file" || echo "0")
    if [ "$task_count" -le 4 ]; then
        echo "   ✓ $(basename $task_file): $task_count tasks (within limit)"
    else
        echo "   ✗ $(basename $task_file): $task_count tasks (exceeds limit of 4)"
        exit 1
    fi
done

# Check 5: Directory structure
echo "5. Validating directory structure..."
required_dirs=("contracts" "workstreams" "prompts" "validation")
for dir in "${required_dirs[@]}"; do
    if [ -d ".parallel/$dir" ]; then
        echo "   ✓ $dir/ exists"
    else
        echo "   ✗ $dir/ not found"
        exit 1
    fi
done

# Check 6: Original styles.css exists
echo "6. Validating source file..."
if [ -f "styles.css" ]; then
    echo "   ✓ styles.css exists"
else
    echo "   ✗ styles.css not found"
    exit 1
fi

# Check 7: Original index.html exists
echo "7. Validating HTML file..."
if [ -f "index.html" ]; then
    echo "   ✓ index.html exists"
else
    echo "   ✗ index.html not found"
    exit 1
fi

echo ""
echo "=== All Pre-Flight Checks Passed ==="
echo "Ready to proceed with parallel execution."
echo ""
echo "Next steps:"
echo "1. Review contracts/schema.json (source of truth)"
echo "2. Open separate AI window for shared workstream (execute first)"
echo "3. After shared completes, open parallel windows for components and layouts"
echo "4. After both complete, open integration workstream"
echo "5. Run integration validation after completion"