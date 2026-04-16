#!/bin/bash

# Pre-flight check script for parallel plan validation
# This script validates the plan structure before execution

set -e

echo "=== Pre-flight Check ==="

# Check if .parallel directory exists
if [ ! -d ".parallel" ]; then
  echo "ERROR: .parallel directory does not exist"
  exit 1
fi

echo "✓ .parallel directory exists"

# Check schema.json
if [ ! -f ".parallel/contracts/schema.json" ]; then
  echo "ERROR: schema.json does not exist"
  exit 1
fi

echo "✓ schema.json exists"

# Validate schema.json syntax
if command -v node &> /dev/null; then
  node -e "JSON.parse(require('fs').readFileSync('.parallel/contracts/schema.json', 'utf8'))" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✓ schema.json is valid JSON"
  else
    echo "ERROR: schema.json is not valid JSON"
    exit 1
  fi
else
  echo "⚠ Node.js not available, skipping JSON validation"
fi

# Check workstream task files
for workstream in shared frontend; do
  if [ ! -f ".parallel/workstreams/${workstream}-tasks.md" ]; then
    echo "ERROR: ${workstream}-tasks.md does not exist"
    exit 1
  fi
  echo "✓ ${workstream}-tasks.md exists"
done

# Check prompt files
for workstream in shared frontend; do
  if [ ! -f ".parallel/prompts/${workstream}-prompt.md" ]; then
    echo "ERROR: ${workstream}-prompt.md does not exist"
    exit 1
  fi
  echo "✓ ${workstream}-prompt.md exists"
done

# Check validation directory
if [ ! -d ".parallel/validation" ]; then
  echo "ERROR: validation directory does not exist"
  exit 1
fi

echo "✓ validation directory exists"

echo ""
echo "=== Pre-flight Check Complete ==="
echo "All checks passed. Ready to execute parallel plan."
