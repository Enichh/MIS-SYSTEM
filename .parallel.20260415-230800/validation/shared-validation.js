#!/usr/bin/env node
/**
 * Shared workstream validation script
 * Validates the shared workstream exports for completeness and consistency
 */

const fs = require('fs');
const path = require('path');

function loadSchema() {
  try {
    const schemaPath = path.join(process.cwd(), '.parallel/contracts/schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    return JSON.parse(schemaContent);
  } catch (error) {
    console.error('❌ Failed to load schema.json:', error.message);
    process.exit(1);
  }
}

function validateSharedExports(schema) {
  const shared = schema.contracts.shared;
  if (!shared) {
    console.error('❌ Shared workstream not found in schema.json');
    return false;
  }

  const exports = shared.exports;
  const issues = [];

  // Check that exports have the expected structure
  if (!exports.css_variables || !Array.isArray(exports.css_variables)) {
    issues.push('Missing or invalid css_variables array in shared exports');
  }

  if (!exports.spacing_scale || !Array.isArray(exports.spacing_scale)) {
    issues.push('Missing or invalid spacing_scale array in shared exports');
  }

  if (!exports.typography_scale || !Array.isArray(exports.typography_scale)) {
    issues.push('Missing or invalid typography_scale array in shared exports');
  }

  // Check naming conventions (kebab-case)
  const checkNaming = (tokens, category) => {
    const invalid = tokens.filter(token => !/^[a-z][a-z0-9-]*$/.test(token));
    if (invalid.length > 0) {
      issues.push(`${category} has invalid naming: ${invalid.join(', ')}`);
    }
  };

  if (exports.css_variables) checkNaming(exports.css_variables, 'css_variables');
  if (exports.spacing_scale) checkNaming(exports.spacing_scale, 'spacing_scale');
  if (exports.typography_scale) checkNaming(exports.typography_scale, 'typography_scale');

  // Check for required color tokens
  if (exports.css_variables) {
    const requiredColors = ['color-primary', 'color-background', 'color-text', 'color-border'];
    const missingColors = requiredColors.filter(color => !exports.css_variables.includes(color));
    if (missingColors.length > 0) {
      issues.push(`Missing required color tokens: ${missingColors.join(', ')}`);
    }
  }

  // Check for required spacing tokens
  if (exports.spacing_scale) {
    const requiredSpacing = ['spacing-xs', 'spacing-sm', 'spacing-md', 'spacing-lg'];
    const missingSpacing = requiredSpacing.filter(spacing => !exports.spacing_scale.includes(spacing));
    if (missingSpacing.length > 0) {
      issues.push(`Missing required spacing tokens: ${missingSpacing.join(', ')}`);
    }
  }

  // Check for required typography tokens
  if (exports.typography_scale) {
    const requiredTypography = ['text-sm', 'text-base', 'text-lg', 'text-xl'];
    const missingTypography = requiredTypography.filter(text => !exports.typography_scale.includes(text));
    if (missingTypography.length > 0) {
      issues.push(`Missing required typography tokens: ${missingTypography.join(', ')}`);
    }
  }

  return issues;
}

function validateSharedTaskFile(schema) {
  const taskFilePath = path.join(process.cwd(), '.parallel/workstreams/shared-tasks.md');
  
  if (!fs.existsSync(taskFilePath)) {
    console.error('❌ shared-tasks.md not found');
    return false;
  }

  const content = fs.readFileSync(taskFilePath, 'utf-8');
  const issues = [];

  // Check that task file references only valid shared exports
  const sharedExports = schema.contracts.shared.exports;
  const allSharedTokens = [
    ...(sharedExports.css_variables || []),
    ...(sharedExports.spacing_scale || []),
    ...(sharedExports.typography_scale || [])
  ];

  // Extract token references from task file
  const varMatches = content.match(/var\(--[a-z0-9-]+\)/gi) || [];
  const tokens = varMatches.map(match => match.replace(/var\(--/, '').replace(/\)/, ''));

  const invalidTokens = tokens.filter(token => !allSharedTokens.includes(token));
  if (invalidTokens.length > 0) {
    issues.push(`Task file references invalid shared tokens: ${invalidTokens.join(', ')}`);
  }

  return issues;
}

function main() {
  console.log('🔍 Running shared workstream validation...\n');

  const schema = loadSchema();

  // Validate shared exports structure
  const exportIssues = validateSharedExports(schema);
  if (exportIssues.length > 0) {
    console.error('❌ Shared exports validation failed:');
    exportIssues.forEach(issue => console.error(`   - ${issue}`));
    process.exit(1);
  }

  console.log('✅ Shared exports structure valid');

  // Validate shared task file
  const taskIssues = validateSharedTaskFile(schema);
  if (taskIssues.length > 0) {
    console.error('❌ Shared task file validation failed:');
    taskIssues.forEach(issue => console.error(`   - ${issue}`));
    process.exit(1);
  }

  console.log('✅ Shared task file references valid');

  const shared = schema.contracts.shared;
  console.log(`\n📊 Shared exports summary:`);
  console.log(`   - CSS variables: ${(shared.exports.css_variables || []).length}`);
  console.log(`   - Spacing scale: ${(shared.exports.spacing_scale || []).length}`);
  console.log(`   - Typography scale: ${(shared.exports.typography_scale || []).length}`);

  console.log('\n🚀 Shared workstream validation passed - foundation is solid');
  process.exit(0);
}

main();
