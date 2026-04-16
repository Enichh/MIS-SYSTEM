#!/bin/bash

# Pre-Flight Validation Script
# Validates plan integrity before parallel execution begins

echo "=== Pre-Flight Validation ==="
echo ""

# Check 1: Verify .parallel directory structure
echo "Check 1: Verifying .parallel directory structure..."
required_dirs=("contracts" "workstreams" "prompts" "validation")
all_dirs_exist=true

for dir in "${required_dirs[@]}"; do
    if [ -d ".parallel/$dir" ]; then
        echo "  ✓ .parallel/$dir exists"
    else
        echo "  ✗ .parallel/$dir missing"
        all_dirs_exist=false
    fi
done

if [ "$all_dirs_exist" = false ]; then
    echo "FAIL: Required directories missing"
    exit 1
fi

echo ""

# Check 2: Verify schema.json exists and is valid JSON
echo "Check 2: Verifying schema.json..."
if [ -f ".parallel/contracts/schema.json" ]; then
    if command -v jq &> /dev/null; then
        if jq empty .parallel/contracts/schema.json 2>/dev/null; then
            echo "  ✓ schema.json is valid JSON"
        else
            echo "  ✗ schema.json is invalid JSON"
            exit 1
        fi
    else
        echo "  ⚠ jq not installed, skipping JSON validation"
    fi
else
    echo "  ✗ schema.json missing"
    exit 1
fi

echo ""

# Check 3: Verify all workstream task files exist
echo "Check 3: Verifying workstream task files..."
required_task_files=(
    "shared-foundation-tasks.md"
    "employees-projects-tasks.md"
    "tasks-chat-tasks.md"
    "entry-point-tasks.md"
)

all_task_files_exist=true
for file in "${required_task_files[@]}"; do
    if [ -f ".parallel/workstreams/$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
        all_task_files_exist=false
    fi
done

if [ "$all_task_files_exist" = false ]; then
    echo "FAIL: Required task files missing"
    exit 1
fi

echo ""

# Check 4: Verify all prompt files exist
echo "Check 4: Verifying prompt files..."
required_prompt_files=(
    "shared-foundation-prompt.md"
    "employees-projects-prompt.md"
    "tasks-chat-prompt.md"
    "entry-point-prompt.md"
)

all_prompt_files_exist=true
for file in "${required_prompt_files[@]}"; do
    if [ -f ".parallel/prompts/$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
        all_prompt_files_exist=false
    fi
done

if [ "$all_prompt_files_exist" = false ]; then
    echo "FAIL: Required prompt files missing"
    exit 1
fi

echo ""

# Check 5: Verify task count limits (max 4 tasks per workstream)
echo "Check 5: Verifying task count limits..."
task_count_valid=true

for file in "${required_task_files[@]}"; do
    task_count=$(grep -c "^### Task " ".parallel/workstreams/$file" || echo "0")
    if [ "$task_count" -le 4 ]; then
        echo "  ✓ $file has $task_count tasks (within limit)"
    else
        echo "  ✗ $file has $task_count tasks (exceeds limit of 4)"
        task_count_valid=false
    fi
done

if [ "$task_count_valid" = false ]; then
    echo "FAIL: Task count limits exceeded"
    exit 1
fi

echo ""

# Check 6: Verify schema.json contract consistency
echo "Check 6: Verifying schema.json contract consistency..."
if command -v node &> /dev/null; then
    if [ -f ".parallel/validation/contract-validation.js" ]; then
        node .parallel/validation/contract-validation.js
        if [ $? -eq 0 ]; then
            echo "  ✓ Contract validation passed"
        else
            echo "  ✗ Contract validation failed"
            exit 1
        fi
    else
        echo "  ⚠ contract-validation.js not found, skipping"
    fi
else
    echo "  ⚠ Node.js not installed, skipping contract validation"
fi

echo ""

# Check 7: Verify freeze_phase is set
echo "Check 7: Verifying freeze_phase..."
if command -v jq &> /dev/null; then
    freeze_phase=$(jq -r '.freeze_phase' .parallel/contracts/schema.json)
    if [ "$freeze_phase" = "hot" ] || [ "$freeze_phase" = "cool" ] || [ "$freeze_phase" = "frozen" ]; then
        echo "  ✓ freeze_phase is set to: $freeze_phase"
    else
        echo "  ✗ freeze_phase has invalid value: $freeze_phase"
        exit 1
    fi
else
    echo "  ⚠ jq not installed, skipping freeze_phase validation"
fi

echo ""

# Check 8: Verify dependency graph is valid
echo "Check 8: Verifying dependency graph..."
if command -v jq &> /dev/null; then
    # Check that shared-foundation has no dependencies
    shared_deps=$(jq -r '.dependency_graph["shared-foundation"].depends_on | length' .parallel/contracts/schema.json)
    if [ "$shared_deps" -eq 0 ]; then
        echo "  ✓ shared-foundation has no dependencies (correct)"
    else
        echo "  ✗ shared-foundation has dependencies (should be 0)"
        exit 1
    fi
    
    # Check that entry-point depends on all other workstreams
    entry_deps=$(jq -r '.dependency_graph["entry-point"].depends_on | length' .parallel/contracts/schema.json)
    if [ "$entry_deps" -eq 3 ]; then
        echo "  ✓ entry-point depends on 3 workstreams (correct)"
    else
        echo "  ✗ entry-point has $entry_deps dependencies (should be 3)"
        exit 1
    fi
else
    echo "  ⚠ jq not installed, skipping dependency graph validation"
fi

echo ""
echo "=== Pre-Flight Validation Complete ==="
echo "All checks passed ✓"
