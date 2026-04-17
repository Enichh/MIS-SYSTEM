#!/usr/bin/env node

/**
 * Contract Validation Script
 * Validates schema.json structure and consistency with task files
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../contracts/schema.json');
const workstreamsPath = path.join(__dirname, '../workstreams');

// Read schema.json
let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  console.log('✓ schema.json loaded successfully');
} catch (error) {
  console.error('✗ Failed to load schema.json:', error.message);
  process.exit(1);
}

// Validate schema structure
const requiredFields = ['version', 'feature', 'freeze_phase', 'contracts', 'dependency_graph'];
const missingFields = requiredFields.filter(field => !schema[field]);

if (missingFields.length > 0) {
  console.error('✗ Schema missing required fields:', missingFields);
  process.exit(1);
}

console.log('✓ Schema structure valid');

// Validate workstream task files exist
const workstreams = ['shared', 'components', 'integration'];
const missingTaskFiles = [];

workstreams.forEach(workstream => {
  const taskFile = path.join(workstreamsPath, `${workstream}-tasks.md`);
  if (!fs.existsSync(taskFile)) {
    missingTaskFiles.push(`${workstream}-tasks.md`);
  }
});

if (missingTaskFiles.length > 0) {
  console.error('✗ Missing task files:', missingTaskFiles);
  process.exit(1);
}

console.log('✓ All task files present');

// Validate prompt files exist
const promptsPath = path.join(__dirname, '../prompts');
const missingPromptFiles = [];

workstreams.forEach(workstream => {
  const promptFile = path.join(promptsPath, `${workstream}-prompt.md`);
  if (!fs.existsSync(promptFile)) {
    missingPromptFiles.push(`${workstream}-prompt.md`);
  }
});

if (missingPromptFiles.length > 0) {
  console.error('✗ Missing prompt files:', missingPromptFiles);
  process.exit(1);
}

console.log('✓ All prompt files present');

// Validate task count limits (max 4 per workstream)
workstreams.forEach(workstream => {
  const taskFile = path.join(workstreamsPath, `${workstream}-tasks.md`);
  const content = fs.readFileSync(taskFile, 'utf8');
  const taskMatches = content.match(/### Task \d+:/g);
  
  if (taskMatches && taskMatches.length > 4) {
    console.error(`✗ ${workstream}-tasks.md has ${taskMatches.length} tasks (max 4 allowed)`);
    process.exit(1);
  }
});

console.log('✓ Task count limits respected (max 4 per workstream)');

// Validate naming collisions across workstreams
const allExports = new Set();
const namingCollisions = [];

Object.keys(schema.contracts).forEach(workstream => {
  const contract = schema.contracts[workstream];
  if (contract.exports && contract.exports.public) {
    Object.keys(contract.exports.public).forEach(category => {
      contract.exports.public[category].forEach(item => {
        if (allExports.has(item)) {
          namingCollisions.push(item);
        }
        allExports.add(item);
      });
    });
  }
});

if (namingCollisions.length > 0) {
  console.error('✗ Naming collisions detected:', namingCollisions);
  process.exit(1);
}

console.log('✓ No naming collisions across workstreams');

// Validate contract consistency: tokens referenced in task files must be in schema.json
console.log('\nValidating contract consistency...');

workstreams.forEach(workstream => {
  const taskFile = path.join(workstreamsPath, `${workstream}-tasks.md`);
  const content = fs.readFileSync(taskFile, 'utf8');
  
  // Extract imports_from_shared references
  const importsFromShared = schema.contracts[workstream]?.imports_from_shared || [];
  
  // Check if task file references any shared exports
  if (importsFromShared.length > 0) {
    const sharedExports = schema.contracts.shared?.exports?.public || {};
    const allSharedExports = [];
    
    Object.keys(sharedExports).forEach(category => {
      if (Array.isArray(sharedExports[category])) {
        allSharedExports.push(...sharedExports[category]);
      }
    });
    
    const missingImports = importsFromShared.filter(imp => !allSharedExports.includes(imp));
    
    if (missingImports.length > 0) {
      console.error(`✗ ${workstream} imports_from_shared references missing from shared exports:`, missingImports);
      process.exit(1);
    }
  }
});

console.log('✓ Contract consistency validated');

console.log('\n✅ All validation checks passed!');
console.log(`Feature: ${schema.feature}`);
console.log(`Version: ${schema.version}`);
console.log(`Freeze Phase: ${schema.freeze_phase}`);
