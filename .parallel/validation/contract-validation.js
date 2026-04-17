#!/usr/bin/env node

/**
 * Contract Validation Script
 * Validates schema.json structure and task file references
 */

const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../contracts/schema.json");
const workstreamsPath = path.join(__dirname, "../workstreams");

// Read schema.json
let schema;
try {
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  schema = JSON.parse(schemaContent);
  console.log("✓ schema.json loaded successfully");
} catch (error) {
  console.error("✗ Failed to load schema.json:", error.message);
  process.exit(1);
}

// Validate schema structure
const requiredFields = [
  "version",
  "feature",
  "freeze_phase",
  "contracts",
  "dependency_graph",
];
for (const field of requiredFields) {
  if (!schema[field]) {
    console.error(`✗ Missing required field in schema.json: ${field}`);
    process.exit(1);
  }
}
console.log("✓ schema.json structure validated");

// Validate task count limits (max 4 per workstream)
const taskFiles = {
  "shared-tasks.md": "shared",
  "core-components-tasks.md": "core-components",
  "feature-data-tasks.md": "feature-data",
  "feature-interactive-tasks.md": "feature-interactive",
};

let totalErrors = 0;

for (const [filename, workstreamKey] of Object.entries(taskFiles)) {
  const taskFilePath = path.join(workstreamsPath, filename);

  if (!fs.existsSync(taskFilePath)) {
    console.error(`✗ Task file not found: ${filename}`);
    totalErrors++;
    continue;
  }

  const taskContent = fs.readFileSync(taskFilePath, "utf8");
  const taskMatches = taskContent.match(/### Task \d+:/g);

  if (!taskMatches) {
    console.error(`✗ No tasks found in ${filename}`);
    totalErrors++;
    continue;
  }

  const taskCount = taskMatches.length;

  if (taskCount > 4) {
    console.error(`✗ Too many tasks in ${filename}: ${taskCount} (max 4)`);
    totalErrors++;
  } else {
    console.log(`✓ ${filename}: ${taskCount} tasks (within limit)`);
  }

  // Validate contract references in task file
  const contractRefMatches = taskContent.match(/Contract References:.*#/g);
  if (contractRefMatches) {
    console.log(
      `✓ ${filename}: ${contractRefMatches.length} contract references found`,
    );
  }
}

// Validate imports_from_shared lists
for (const [workstreamKey, workstreamData] of Object.entries(
  schema.contracts,
)) {
  if (workstreamKey === "shared") continue;

  const importsFromShared = workstreamData.imports_from_shared || [];
  const sharedExports = schema.contracts.shared.exports.public;

  // Check if all imports exist in shared exports
  for (const importItem of importsFromShared) {
    if (
      !sharedExports.types?.includes(importItem) &&
      !sharedExports.constants?.includes(importItem) &&
      !sharedExports.functions?.includes(importItem)
    ) {
      console.warn(
        `⚠ ${workstreamKey} imports '${importItem}' from shared but it's not in shared public exports`,
      );
    }
  }
  console.log(`✓ ${workstreamKey} imports_from_shared validated`);
}

// Validate imports_from_core-components for feature-data
if (schema.contracts["feature-data"]?.["imports_from_core-components"]) {
  const importsFromCore =
    schema.contracts["feature-data"]["imports_from_core-components"];
  const coreExports =
    schema.contracts["core-components"]?.exports?.public || {};

  for (const importItem of importsFromCore) {
    const allCoreExports = [
      ...(coreExports.components || []),
      ...(coreExports.types || []),
    ];
    if (!allCoreExports.includes(importItem)) {
      console.warn(
        `⚠ feature-data imports '${importItem}' from core-components but it's not in core-components public exports`,
      );
    }
  }
  console.log("✓ feature-data imports_from_core-components validated");
}

// Validate imports_from_core-components for feature-interactive
if (schema.contracts["feature-interactive"]?.["imports_from_core-components"]) {
  const importsFromCore =
    schema.contracts["feature-interactive"]["imports_from_core-components"];
  const coreExports =
    schema.contracts["core-components"]?.exports?.public || {};

  for (const importItem of importsFromCore) {
    const allCoreExports = [
      ...(coreExports.components || []),
      ...(coreExports.types || []),
    ];
    if (!allCoreExports.includes(importItem)) {
      console.warn(
        `⚠ feature-interactive imports '${importItem}' from core-components but it's not in core-components public exports`,
      );
    }
  }
  console.log("✓ feature-interactive imports_from_core-components validated");
}

// Check for naming collisions across workstreams
const allExports = {};
for (const [workstreamKey, workstreamData] of Object.entries(
  schema.contracts,
)) {
  const exports = workstreamData.exports?.public || {};
  const allItems = [
    ...(exports.types || []),
    ...(exports.constants || []),
    ...(exports.functions || []),
    ...(exports.components || []),
  ];

  for (const item of allItems) {
    if (allExports[item]) {
      console.error(
        `✗ Naming collision: '${item}' exported by both ${allExports[item]} and ${workstreamKey}`,
      );
      totalErrors++;
    } else {
      allExports[item] = workstreamKey;
    }
  }
}

if (totalErrors === 0) {
  console.log("\n✓ All contract validations passed");
  process.exit(0);
} else {
  console.log(`\n✗ Contract validation failed with ${totalErrors} error(s)`);
  process.exit(1);
}
