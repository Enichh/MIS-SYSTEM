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

# Check required directories
required_dirs=("contracts" "workstreams" "prompts" "validation")
for dir in "${required_dirs[@]}"; do
  if [ ! -d ".parallel/$dir" ]; then
    echo "✗ Required directory missing: .parallel/$dir"
    exit 1
  fi
  echo "✓ .parallel/$dir exists"
done

# Check schema.json exists
if [ ! -f ".parallel/contracts/schema.json" ]; then
  echo "✗ schema.json not found"
  exit 1
fi
echo "✓ schema.json exists"

# Check task files exist
task_files=("shared-tasks.md" "core-components-tasks.md" "feature-data-tasks.md" "feature-interactive-tasks.md")
for file in "${task_files[@]}"; do
  if [ ! -f ".parallel/workstreams/$file" ]; then
    echo "✗ Task file not found: $file"
    exit 1
  fi
  echo "✓ .parallel/workstreams/$file exists"
done

# Check prompt files exist
prompt_files=("shared-prompt.md" "core-components-prompt.md" "feature-data-prompt.md" "feature-interactive-prompt.md")
for file in "${prompt_files[@]}"; do
  if [ ! -f ".parallel/prompts/$file" ]; then
    echo "✗ Prompt file not found: $file"
    exit 1
  fi
  echo "✓ .parallel/prompts/$file exists"
done

# Check validation script exists
if [ ! -f ".parallel/validation/contract-validation.js" ]; then
  echo "✗ contract-validation.js not found"
  exit 1
fi
echo "✓ contract-validation.js exists"

# Run contract validation
echo ""
echo "=== Running Contract Validation ==="
node .parallel/validation/contract-validation.js

if [ $? -ne 0 ]; then
  echo "✗ Contract validation failed"
  exit 1
fi

echo ""
echo "=== Pre-Flight Check Passed ==="
echo ""
echo "Next Steps:"
echo "1. Review .parallel/contracts/schema.json (source of truth)"
echo "2. Open separate AI windows for each workstream:"
echo "   - Shared/Foundation (execute first)"
echo "   - Core Components (execute after shared completes)"
echo "   - Feature Data AND Feature Interactive (execute in parallel after core-components completes)"
echo "3. Each AI should use the corresponding prompt from .parallel/prompts/"
echo "4. Run integration validation after all workstreams complete"
