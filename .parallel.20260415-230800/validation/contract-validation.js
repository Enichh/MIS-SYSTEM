#!/usr/bin/env node
/**
 * Contract validation script
 * Validates that task file references match schema.json imports_from_shared lists
 */

const fs = require("fs");
const path = require("path");

function loadSchema() {
  try {
    const schemaPath = path.join(
      process.cwd(),
      ".parallel/contracts/schema.json",
    );
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    return JSON.parse(schemaContent);
  } catch (error) {
    console.error("❌ Failed to load schema.json:", error.message);
    process.exit(1);
  }
}

function extractTokenReferences(content) {
  // Match CSS variable references like var(--color-primary), var(--spacing-md)
  const varMatches = content.match(/var\(--[a-z0-9-]+\)/gi) || [];
  const tokens = varMatches.map((match) =>
    match.replace(/var\(--/, "").replace(/\)/, ""),
  );

  // Match explicit design token references in task descriptions
  // Only match patterns like "color-primary", "spacing-md", "text-base" (not component names)
  // Exclude patterns like "font-weight 700" (CSS property with numeric value)
  const tokenPattern =
    /\b(color-|spacing-|text-|shadow-|transition-|focus-)[a-z0-9-]+\b/gi;
  const plainMatches = content.match(tokenPattern) || [];

  // Filter out CSS property descriptions (e.g., "font-weight 700" where it's followed by a number)
  const filteredPlainMatches = plainMatches.filter((match) => {
    // Check if this token is followed by a space and a number in the original content
    const regex = new RegExp(
      `\\b${match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+\\d`,
      "gi",
    );
    return !regex.test(content);
  });

  // Combine and deduplicate
  const allTokens = [...new Set([...tokens, ...filteredPlainMatches])];

  // Filter out invalid/incomplete tokens (e.g., "font-weight" alone is not a valid token)
  const validTokens = allTokens.filter((token) => {
    // Valid patterns: must have at least two parts after the prefix
    const parts = token.split("-");
    if (parts.length < 2) return false;

    // Specific validation for font-weight tokens
    if (token.startsWith("font-weight")) {
      return [
        "font-weight-regular",
        "font-weight-medium",
        "font-weight-semibold",
        "font-weight-bold",
      ].includes(token);
    }

    return true;
  });

  return validTokens;
}

function validateWorkstream(schema, workstreamName, taskFilePath) {
  const content = fs.readFileSync(taskFilePath, "utf-8");
  const workstreamConfig = schema.contracts[workstreamName];

  if (!workstreamConfig) {
    console.error(`❌ Workstream '${workstreamName}' not found in schema.json`);
    return false;
  }

  const allowedImports = workstreamConfig.imports_from_shared || [];
  const referencedTokens = extractTokenReferences(content);

  const violations = [];

  for (const token of referencedTokens) {
    // Check if token is in allowed imports
    if (!allowedImports.includes(token)) {
      violations.push(token);
    }
  }

  if (violations.length > 0) {
    console.error(
      `❌ ${workstreamName}-tasks.md references ${violations.length} tokens NOT in imports_from_shared:`,
    );
    violations.forEach((token) => console.error(`   - ${token}`));
    console.error(`   Allowed imports: ${allowedImports.join(", ")}`);
    return false;
  }

  console.log(
    `✅ ${workstreamName}-tasks.md: All ${referencedTokens.length} token references valid`,
  );
  return true;
}

function main() {
  console.log("🔍 Running contract validation...\n");

  const schema = loadSchema();
  const workstreamsDir = path.join(process.cwd(), ".parallel/workstreams");

  if (!fs.existsSync(workstreamsDir)) {
    console.error("❌ workstreams directory not found");
    process.exit(1);
  }

  let allValid = true;

  for (const workstreamName of Object.keys(schema.contracts)) {
    if (workstreamName === "shared") continue; // Shared doesn't have imports_from_shared

    const taskFile = path.join(workstreamsDir, `${workstreamName}-tasks.md`);

    if (fs.existsSync(taskFile)) {
      const isValid = validateWorkstream(schema, workstreamName, taskFile);
      if (!isValid) allValid = false;
    }
  }

  if (allValid) {
    console.log(
      "\n🚀 Contract validation passed - all task file references match schema.json",
    );
    process.exit(0);
  } else {
    console.log(
      "\n⛔ Contract validation failed - task files reference tokens not in imports_from_shared",
    );
    console.log(
      "Fix: Update schema.json to include missing tokens in imports_from_shared lists",
    );
    process.exit(1);
  }
}

main();
