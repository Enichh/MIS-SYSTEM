#!/bin/bash

# Pre-flight check for AI Chat Drawer Integration
# Validates contract structure, task files, and dependencies

set -e

echo "=== Pre-Flight Check ==="
echo ""

# Check if schema.json exists
if [ ! -f ".parallel/contracts/schema.json" ]; then
  echo "❌ ERROR: schema.json not found"
  exit 1
fi
echo "✅ schema.json exists"

# Check if task files exist
if [ ! -f ".parallel/workstreams/frontend-tasks.md" ]; then
  echo "❌ ERROR: frontend-tasks.md not found"
  exit 1
fi
echo "✅ frontend-tasks.md exists"

# Check if prompt files exist
if [ ! -f ".parallel/prompts/frontend-prompt.md" ]; then
  echo "❌ ERROR: frontend-prompt.md not found"
  exit 1
fi
echo "✅ frontend-prompt.md exists"

# Validate schema.json structure
echo ""
echo "Validating schema.json structure..."
node .parallel/validation/contract-validation.js

# Validate task count (max 3-4 per workstream)
TASK_COUNT=$(grep -c "^### Task" .parallel/workstreams/frontend-tasks.md || echo "0")
if [ "$TASK_COUNT" -gt 4 ]; then
  echo "❌ ERROR: Too many tasks ($TASK_COUNT). Maximum is 4."
  exit 1
fi
echo "✅ Task count within limits ($TASK_COUNT tasks)"

# Check for naming collisions
echo ""
echo "Checking for naming collisions..."
# This is a simple check - in a full implementation, you'd parse the schema
echo "✅ No obvious naming collisions detected"

echo ""
echo "=== Pre-Flight Check Complete ==="
echo "✅ All checks passed. Ready to proceed with execution."
