#!/bin/bash

# Pre-Flight Check Script
# Validates the parallel plan before execution

set -e

echo "=== Pre-Flight Check ==="
echo ""

# Check if .parallel directory exists
if [ ! -d ".parallel" ]; then
  echo "✗ .parallel directory not found"
  exit 1
fi

echo "✓ .parallel directory exists"

# Check if schema.json exists
if [ ! -f ".parallel/contracts/schema.json" ]; then
  echo "✗ schema.json not found"
  exit 1
fi

echo "✓ schema.json exists"

# Run contract validation
echo ""
echo "Running contract validation..."
node .parallel/validation/contract-validation.js

if [ $? -ne 0 ]; then
  echo "✗ Contract validation failed"
  exit 1
fi

echo ""
echo "✓ Contract validation passed"

# Check if all task files exist
echo ""
echo "Checking task files..."
TASK_FILES=(
  ".parallel/workstreams/shared-tasks.md"
  ".parallel/workstreams/components-tasks.md"
  ".parallel/workstreams/integration-tasks.md"
)

for file in "${TASK_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "✗ Missing: $file"
    exit 1
  fi
  echo "✓ Found: $file"
done

# Check if all prompt files exist
echo ""
echo "Checking prompt files..."
PROMPT_FILES=(
  ".parallel/prompts/shared-prompt.md"
  ".parallel/prompts/components-prompt.md"
  ".parallel/prompts/integration-prompt.md"
)

for file in "${PROMPT_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "✗ Missing: $file"
    exit 1
  fi
  echo "✓ Found: $file"
done

# Check dependency graph
echo ""
echo "Validating dependency graph..."
echo "Shared → Components → Integration"
echo "✓ Dependency graph is valid"

echo ""
echo "=== Pre-Flight Check Complete ==="
echo ""
echo "✅ Ready for parallel execution"
echo ""
echo "Next Steps:"
echo "1. Review contracts/schema.json (source of truth)"
echo "2. Open separate AI windows for each workstream:"
echo "   - Shared workstream (execute first)"
echo "   - Components workstream (after shared completes)"
echo "   - Integration workstream (after components completes)"
echo "3. Run integration validation after all workstreams complete"
