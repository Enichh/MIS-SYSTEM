/**
 * Pre-Flight Check Script
 * Run this before starting parallel execution
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

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkDirectoryExists(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

function main() {
  log('╔══════════════════════════════════════════════════════════════╗', 'blue');
  log('║              PRE-FLIGHT CHECK v3.1                           ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════╝', 'blue');

  const parallelDir = path.join(__dirname, '..');
  const projectRoot = path.join(parallelDir, '..');

  let allPassed = true;

  // Check required directories
  log('\n📁 Checking directory structure...', 'cyan');
  const requiredDirs = [
    'contracts',
    'workstreams',
    'prompts',
    'validation'
  ];

  requiredDirs.forEach(dir => {
    const dirPath = path.join(parallelDir, dir);
    if (checkDirectoryExists(dirPath)) {
      log(`  ✅ ${dir}/`, 'green');
    } else {
      log(`  ❌ ${dir}/ - MISSING`, 'red');
      allPassed = false;
    }
  });

  // Check required files
  log('\n📄 Checking required files...', 'cyan');
  const requiredFiles = [
    'contracts/schema.json',
    'workstreams/shared-tasks.md',
    'workstreams/shared-services-tasks.md',
    'workstreams/backend-tasks.md',
    'workstreams/frontend-core-tasks.md',
    'workstreams/frontend-pdf-tasks.md',
    'prompts/shared-prompt.md',
    'prompts/shared-services-prompt.md',
    'prompts/backend-prompt.md',
    'prompts/frontend-core-prompt.md',
    'prompts/frontend-pdf-prompt.md',
    'validation/contract-validation.js'
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(parallelDir, file);
    if (checkFileExists(filePath)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - MISSING`, 'red');
      allPassed = false;
    }
  });

  // Check project structure
  log('\n🔍 Checking project structure...', 'cyan');
  const projectFiles = [
    'package.json',
    'tsconfig.json',
    'app/page.tsx',
    'lib/context/NavigationContext.tsx'
  ];

  projectFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (checkFileExists(filePath)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ⚠️  ${file} - NOT FOUND (may be normal)`, 'yellow');
    }
  });

  // Run contract validation
  log('\n🔎 Running contract validation...', 'cyan');
  try {
    require('./contract-validation.js');
  } catch (error) {
    log(`  ⚠️  Contract validation had issues (see above)`, 'yellow');
  }

  // Summary
  log('\n' + '═'.repeat(62), 'blue');
  if (allPassed) {
    log('✅ PRE-FLIGHT CHECK PASSED', 'green');
    log('\n🚀 Ready to begin parallel execution:', 'cyan');
    log('  1. Open 3 separate AI windows', 'reset');
    log('  2. Run SHARED workstream first with:', 'reset');
    log('     prompt: `.parallel/prompts/shared-prompt.md`', 'reset');
    log('     tasks:  `.parallel/workstreams/shared-tasks.md`', 'reset');
    log('  3. After shared completes, run BACKEND and FRONTEND:', 'reset');
    log('     backend prompt: `.parallel/prompts/backend-prompt.md`', 'reset');
    log('     frontend prompt: `.parallel/prompts/frontend-prompt.md`', 'reset');
    log('\n⚠️  IMPORTANT:', 'yellow');
    log('  - Shared must complete before backend/frontend start', 'reset');
    log('  - Do NOT modify schema.json without approval', 'reset');
    log('  - Each workstream should run in its own AI window', 'reset');
    process.exit(0);
  } else {
    log('❌ PRE-FLIGHT CHECK FAILED', 'red');
    log('\nFix missing files/directories and re-run.', 'yellow');
    process.exit(1);
  }
}

main();
