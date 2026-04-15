#!/bin/bash
# Pre-flight validation script for parallel work
# Run this BEFORE starting parallel workstreams

echo "Validating parallel work configuration..."

# 1. Schema validation
if ! node -e "JSON.parse(require('fs').readFileSync('.parallel/contracts/schema.json', 'utf8'))" 2>/dev/null; then
    echo "❌ schema.json is invalid JSON"
    exit 1
fi
echo "✅ schema.json is valid JSON"

# 2. Check for naming collisions across workstreams
if [ -f ".parallel/validation/cross-reference.js" ]; then
    node .parallel/validation/cross-reference.js
    if [ $? -ne 0 ]; then
        echo "❌ Naming collisions detected"
        exit 1
    fi
else
    echo "⚠️  cross-reference.js not found, skipping collision check"
fi

# 3. Verify task files don't exceed 3 tasks
for file in .parallel/workstreams/*-tasks.md; do
    if [ -f "$file" ]; then
        count=$(grep -c "^### Task" "$file" || echo 0)
        if [ "$count" -gt 3 ]; then
            echo "❌ $file has $count tasks (max 3 allowed)"
            exit 1
        fi
        echo "✅ $file: $count tasks"
    fi
done

# 4. Run contract validation
if [ -f ".parallel/validation/contract-validation.js" ]; then
    node .parallel/validation/contract-validation.js
    if [ $? -ne 0 ]; then
        echo "❌ Contract validation failed"
        exit 1
    fi
else
    echo "⚠️  contract-validation.js not found, skipping contract validation"
fi

# 5. Run shared workstream validation
if [ -f ".parallel/validation/shared-validation.js" ]; then
    node .parallel/validation/shared-validation.js
    if [ $? -ne 0 ]; then
        echo "❌ Shared workstream validation failed"
        exit 1
    fi
else
    echo "⚠️  shared-validation.js not found, skipping shared validation"
fi

echo ""
echo "✅ Pre-flight checks passed. Safe to start parallel work."
