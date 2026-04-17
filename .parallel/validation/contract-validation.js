#!/usr/bin/env node

/**
 * Contract Validation Script
 * Validates that all tokens referenced in task files exist in schema.json imports_from_shared lists
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SCHEMA_PATH = path.join(ROOT_DIR, '.parallel', 'contracts', 'schema.json');
const WORKSTREAMS_DIR = path.join(ROOT_DIR, '.parallel', 'workstreams');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log(`Error reading ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

function extractTokensFromTaskFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tokens = new Set();
    
    // Extract imports_from_shared references
    const importMatch = content.match(/imports_from_shared:\s*\[([\s\S]*?)\]/);
    if (importMatch) {
      const imports = importMatch[1].match(/"([^"]+)"/g);
      if (imports) {
        imports.forEach(imp => tokens.add(imp.replace(/"/g, '')));
      }
    }
    
    // Extract Contract References
    const contractRefMatches = content.match(/schema\.json#\/contracts\/[^\/]+\/exports\/[^\/]+\/[^\/]+/g);
    if (contractRefMatches) {
      contractRefMatches.forEach(ref => {
        const parts = ref.split('/');
        const token = parts[parts.length - 1];
        tokens.add(token);
      });
    }
    
    // Extract function/type names from acceptance criteria
    const functionMatches = content.match(/\b(use[A-Z][a-zA-Z]*|validate[A-Z][a-zA-Z]*|[A-Z][a-zA-Z]*Config)\b/g);
    if (functionMatches) {
      functionMatches.forEach(fn => tokens.add(fn));
    }
    
    return Array.from(tokens);
  } catch (error) {
    log(`Error reading task file ${filePath}: ${error.message}`, 'red');
    return [];
  }
}

function validateContract() {
  log('=== Contract Validation ===', 'blue');
  
  // Load schema
  const schema = readJSON(SCHEMA_PATH);
  if (!schema) {
    log('Failed to load schema.json', 'red');
    return false;
  }
  
  log(`✓ Loaded schema for feature: ${schema.feature}`, 'green');
  log(`✓ Contract version: ${schema.version}`, 'green');
  
  // Validate schema structure
  if (!schema.contracts) {
    log('✗ Schema missing contracts section', 'red');
    return false;
  }
  
  const workstreams = Object.keys(schema.contracts).filter(w => w !== 'shared');
  log(`✓ Found ${workstreams.length} workstreams: ${workstreams.join(', ')}`, 'green');
  
  // Check each workstream task file
  let allValid = true;
  const violations = [];
  
  for (const workstream of workstreams) {
    const taskFilePath = path.join(WORKSTREAMS_DIR, `${workstream}-tasks.md`);
    
    if (!fs.existsSync(taskFilePath)) {
      log(`✗ Task file not found: ${taskFilePath}`, 'red');
      allValid = false;
      continue;
    }
    
    log(`\n--- Validating ${workstream} workstream ---`, 'blue');
    
    const taskTokens = extractTokensFromTaskFile(taskFilePath);
    const allowedImports = schema.contracts[workstream]?.imports_from_shared || [];
    
    log(`  Tokens referenced in task file: ${taskTokens.length}`, 'yellow');
    log(`  Allowed imports from schema: ${allowedImports.length}`, 'yellow');
    
    // Check for violations
    for (const token of taskTokens) {
      if (!allowedImports.includes(token) && !isInternalHelper(token, schema)) {
        violations.push({
          workstream,
          token,
          allowed: allowedImports
        });
        log(`  ✗ Token "${token}" not in imports_from_shared`, 'red');
        allValid = false;
      }
    }
    
    if (violations.filter(v => v.workstream === workstream).length === 0) {
      log(`  ✓ All tokens validated for ${workstream}`, 'green');
    }
  }
  
  // Check task count limits
  log('\n--- Task Count Validation ---', 'blue');
  for (const workstream of workstreams) {
    const taskFilePath = path.join(WORKSTREAMS_DIR, `${workstream}-tasks.md`);
    if (fs.existsSync(taskFilePath)) {
      const content = fs.readFileSync(taskFilePath, 'utf-8');
      const taskMatches = content.match(/### Task \d+:/g);
      const taskCount = taskMatches ? taskMatches.length : 0;
      
      if (taskCount > 4) {
        log(`  ✗ ${workstream}: ${taskCount} tasks (exceeds limit of 4)`, 'red');
        allValid = false;
      } else {
        log(`  ✓ ${workstream}: ${taskCount} tasks (within limit of 4)`, 'green');
      }
    }
  }
  
  // Check for naming collisions
  log('\n--- Naming Collision Check ---', 'blue');
  const allExports = {};
  for (const workstream of workstreams) {
    const exports = schema.contracts[workstream]?.exports || [];
    exports.forEach(exp => {
      if (allExports[exp]) {
        log(`  ✗ Naming collision: "${exp}" exported by both ${allExports[exp]} and ${workstream}`, 'red');
        allValid = false;
      } else {
        allExports[exp] = workstream;
      }
    });
  }
  if (Object.keys(allExports).length > 0) {
    log(`  ✓ No naming collisions detected`, 'green');
  }
  
  // Summary
  log('\n=== Validation Summary ===', 'blue');
  if (allValid) {
    log('✓ Contract validation passed', 'green');
    return true;
  } else {
    log('✗ Contract validation failed', 'red');
    log('\nViolations:', 'red');
    violations.forEach(v => {
      log(`  - ${v.workstream}: "${v.token}" not in allowed imports`, 'red');
    });
    return false;
  }
}

function isInternalHelper(token, schema) {
  const sharedInternal = schema.contracts.shared?.exports?.internal || [];
  return sharedInternal.includes(token);
}

// Run validation
const success = validateContract();
process.exit(success ? 0 : 1);
