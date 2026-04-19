/**
 * Contract Validation Script
 * Validates the parallel plan against constraints and rules
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function loadJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`❌ Error loading ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

function loadMarkdown(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log(`❌ Error loading ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

function validateSchema(schema) {
  log('\n📋 Validating schema.json...', 'cyan');
  const errors = [];

  // Check required fields
  if (!schema.version) errors.push('Missing version field');
  if (!schema.feature) errors.push('Missing feature field');
  if (!schema.contracts) errors.push('Missing contracts object');
  if (!schema.dependency_graph) errors.push('Missing dependency_graph');

  // Validate contracts structure
  const requiredContracts = ['shared', 'shared-services', 'backend', 'frontend-core', 'frontend-pdf'];
  requiredContracts.forEach(ws => {
    if (!schema.contracts || !schema.contracts[ws]) {
      errors.push(`Missing ${ws} contract`);
    }
  });

  // Check freeze phase
  const validPhases = ['hot', 'cool', 'frozen'];
  if (!validPhases.includes(schema.freeze_phase)) {
    errors.push(`Invalid freeze_phase: ${schema.freeze_phase}`);
  }

  if (errors.length === 0) {
    log('✅ Schema validation passed', 'green');
    return true;
  } else {
    errors.forEach(e => log(`  ❌ ${e}`, 'red'));
    return false;
  }
}

function validateTaskCounts(content, workstreamName) {
  const taskRegex = /### Task \d+:/g;
  const tasks = content.match(taskRegex) || [];

  // Count acceptance criteria
  const criteriaRegex = /- \[ \]/g;
  const criteria = content.match(criteriaRegex) || [];

  log(`\n📊 ${workstreamName} Workstream Analysis:`, 'cyan');
  log(`  Tasks: ${tasks.length} (max 3)`, tasks.length > 3 ? 'red' : 'green');
  log(`  Acceptance Criteria: ${criteria.length} (max 15 total)`, criteria.length > 15 ? 'red' : 'green');

  const issues = [];
  if (tasks.length > 3) issues.push(`Too many tasks: ${tasks.length} (max 3)`);
  if (criteria.length > 15) issues.push(`Too many criteria: ${criteria.length} (max 15)`);

  return { valid: issues.length === 0, issues };
}

function validatePromptLength(content, promptName) {
  const lines = content.split('\n');
  const lineCount = lines.length;

  log(`\n📄 ${promptName} Analysis:`, 'cyan');
  log(`  Lines: ${lineCount} (max 60)`, lineCount > 60 ? 'red' : 'green');

  return { valid: lineCount <= 60, issue: lineCount > 60 ? `Too many lines: ${lineCount} (max 60)` : null };
}

function validateNamingCollisions(schema) {
  log('\n🔍 Checking for naming collisions...', 'cyan');

  const allExports = new Map();
  const collisions = [];

  Object.entries(schema.contracts).forEach(([name, contract]) => {
    if (contract.exports) {
      const exports = Array.isArray(contract.exports) ? contract.exports : Object.values(contract.exports).flat();
      exports.forEach(exp => {
        if (allExports.has(exp)) {
          collisions.push(`${exp} exported by both ${allExports.get(exp)} and ${name}`);
        } else {
          allExports.set(exp, name);
        }
      });
    }
  });

  if (collisions.length === 0) {
    log('✅ No naming collisions found', 'green');
    return true;
  } else {
    collisions.forEach(c => log(`  ⚠️  ${c}`, 'yellow'));
    return false;
  }
}

function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'blue');
  log('║       PARALLEL PLAN CONTRACT VALIDATION v3.1                 ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════╝', 'blue');

  const parallelDir = path.join(__dirname, '..');

  // Load schema
  const schemaPath = path.join(parallelDir, 'contracts', 'schema.json');
  const schema = loadJson(schemaPath);
  if (!schema) {
    log('\n❌ Failed to load schema.json - cannot continue', 'red');
    process.exit(1);
  }

  let allValid = true;

  // Validate schema
  allValid = validateSchema(schema) && allValid;

  // Validate task counts
  const workstreams = ['shared', 'shared-services', 'backend', 'frontend-core', 'frontend-pdf'];
  workstreams.forEach(ws => {
    const tasksPath = path.join(parallelDir, 'workstreams', `${ws}-tasks.md`);
    const content = loadMarkdown(tasksPath);
    if (content) {
      const result = validateTaskCounts(content, ws);
      if (!result.valid) {
        result.issues.forEach(i => log(`  ❌ ${i}`, 'red'));
        allValid = false;
      }
    }
  });

  // Validate prompt lengths
  workstreams.forEach(ws => {
    const promptPath = path.join(parallelDir, 'prompts', `${ws}-prompt.md`);
    const content = loadMarkdown(promptPath);
    if (content) {
      const result = validatePromptLength(content, `${ws}-prompt.md`);
      if (!result.valid) {
        log(`  ❌ ${result.issue}`, 'red');
        allValid = false;
      }
    }
  });

  // Check naming collisions
  allValid = validateNamingCollisions(schema) && allValid;

  // Summary
  log('\n' + '═'.repeat(62), 'blue');
  if (allValid) {
    log('✅ ALL VALIDATIONS PASSED - Ready for parallel execution', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Open separate AI windows for each workstream', 'reset');
    log('2. Start with SHARED workstream first', 'reset');
    log('3. After shared completes, run BACKEND and FRONTEND in parallel', 'reset');
    process.exit(0);
  } else {
    log('❌ VALIDATION FAILED - Fix issues before proceeding', 'red');
    log('\nFix required issues above, then re-run validation.', 'yellow');
    process.exit(1);
  }
}

main();
