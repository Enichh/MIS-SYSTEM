#!/bin/bash

# Pre-Flight Check Script
# Validates the parallel plan before execution

set -e

echo "=== Pre-Flight Validation ==="
echo ""

# Check if schema.json exists
if [ ! -f ".parallel/contracts/schema.json" ]; then
  echo "✗ schema.json not found"
  exit 1
fi
echo "✓ schema.json exists"

# Check if task files exist
for workstream in shared forms confirmation; do
  if [ ! -f ".parallel/workstreams/${workstream}-tasks.md" ]; then
    echo "✗ ${workstream}-tasks.md not found"
    exit 1
  fi
  echo "✓ ${workstream}-tasks.md exists"
done

# Check if prompt files exist
for workstream in shared forms confirmation; do
  if [ ! -f ".parallel/prompts/${workstream}-prompt.md" ]; then
    echo "✗ ${workstream}-prompt.md not found"
    exit 1
  fi
  echo "✓ ${workstream}-prompt.md exists"
done

echo ""
echo "=== Running Contract Validation ==="
node .parallel/validation/contract-validation.js

echo ""
echo "=== Pre-Flight Check Complete ==="
echo "✓ All checks passed"
echo ""
echo "Next steps:"
echo "1. Review .parallel/contracts/schema.json (source of truth)"
echo "2. Open separate AI windows for each workstream"
echo "3. Execute shared workstream first"
echo "4. Execute forms and confirmation workstreams in parallel after shared completes"
echo "5. Run integration validation after all workstreams complete"
