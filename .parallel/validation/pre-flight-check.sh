#!/bin/bash

# Pre-flight check script for Next.js migration parallel execution
# This script validates that the parallel plan is ready for execution

set -e

echo "=== Pre-Flight Check for Next.js Migration ==="
echo ""

# Check if .parallel directory exists
if [ ! -d ".parallel" ]; then
  echo "❌ FAIL: .parallel directory does not exist"
  exit 1
fi
echo "✅ .parallel directory exists"

# Check if schema.json exists
if [ ! -f ".parallel/contracts/schema.json" ]; then
  echo "❌ FAIL: schema.json does not exist"
  exit 1
fi
echo "✅ schema.json exists"

# Validate schema.json syntax
if ! command -v node &> /dev/null; then
  echo "⚠️  WARNING: Node.js not found, skipping schema validation"
else
  node -e "JSON.parse(require('fs').readFileSync('.parallel/contracts/schema.json', 'utf8'))" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ schema.json is valid JSON"
  else
    echo "❌ FAIL: schema.json is not valid JSON"
    exit 1
  fi
fi

# Check if workstream task files exist
for workstream in shared backend frontend; do
  if [ ! -f ".parallel/workstreams/${workstream}-tasks.md" ]; then
    echo "❌ FAIL: ${workstream}-tasks.md does not exist"
    exit 1
  fi
  echo "✅ ${workstream}-tasks.md exists"
done

# Check if prompt files exist
for workstream in shared backend frontend; do
  if [ ! -f ".parallel/prompts/${workstream}-prompt.md" ]; then
    echo "❌ FAIL: ${workstream}-prompt.md does not exist"
    exit 1
  fi
  echo "✅ ${workstream}-prompt.md exists"
done

# Check validation directory
if [ ! -d ".parallel/validation" ]; then
  echo "❌ FAIL: validation directory does not exist"
  exit 1
fi
echo "✅ validation directory exists"

# Run contract validation if Node.js is available
if command -v node &> /dev/null; then
  if [ -f ".parallel/validation/contract-validation.js" ]; then
    echo "Running contract validation..."
    node .parallel/validation/contract-validation.js
    if [ $? -eq 0 ]; then
      echo "✅ Contract validation passed"
    else
      echo "❌ FAIL: Contract validation failed"
      exit 1
    fi
  else
    echo "⚠️  WARNING: contract-validation.js not found, skipping contract validation"
  fi
else
  echo "⚠️  WARNING: Node.js not found, skipping contract validation"
fi

echo ""
echo "=== Pre-Flight Check Complete ==="
echo "✅ All checks passed. Ready for parallel execution."
echo ""
echo "Next steps:"
echo "1. Review .parallel/contracts/schema.json (source of truth)"
echo "2. Open separate AI windows for each workstream:"
echo "   - Shared: Use .parallel/prompts/shared-prompt.md"
echo "   - Backend: Use .parallel/prompts/backend-prompt.md"
echo "   - Frontend: Use .parallel/prompts/frontend-prompt.md"
echo "3. Execute shared workstream first (foundational)"
echo "4. Execute backend and frontend in parallel after shared completes"
echo "5. Run integration validation after all workstreams complete"
