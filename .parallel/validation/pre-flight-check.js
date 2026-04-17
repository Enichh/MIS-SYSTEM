const fs = require('fs');
const path = require('path');

const schemaPath = '.parallel/contracts/schema.json';
const workstreamsDir = '.parallel/workstreams';
const promptsDir = '.parallel/prompts';
const validationDir = '.parallel/validation';

console.log('=== Pre-Flight Validation ===');

// Check schema.json exists
if (!fs.existsSync(schemaPath)) {
  console.error('❌ ERROR: schema.json not found');
  process.exit(1);
}
console.log('✓ schema.json found');

// Check task files exist
const workstreams = ['shared', 'frontend'];
for (const ws of workstreams) {
  const taskPath = path.join(workstreamsDir, `${ws}-tasks.md`);
  if (!fs.existsSync(taskPath)) {
    console.error(`❌ ERROR: ${ws}-tasks.md not found`);
    process.exit(1);
  }
  console.log(`✓ ${ws}-tasks.md found`);
}

// Check prompts exist
for (const ws of workstreams) {
  const promptPath = path.join(promptsDir, `${ws}-prompt.md`);
  if (!fs.existsSync(promptPath)) {
    console.error(`❌ ERROR: ${ws}-prompt.md not found`);
    process.exit(1);
  }
  console.log(`✓ ${ws}-prompt.md found`);
}

// Run contract validation
const contractValidationPath = path.join(validationDir, 'contract-validation.js');
if (fs.existsSync(contractValidationPath)) {
  const { execSync } = require('child_process');
  try {
    execSync('node .parallel/validation/contract-validation.js', { stdio: 'inherit' });
    console.log('✓ Contract validation passed');
  } catch (error) {
    console.error('❌ ERROR: Contract validation failed');
    process.exit(1);
  }
} else {
  console.log('⚠ WARNING: contract-validation.js not found');
}

console.log('=== Pre-Flight Validation Complete ===');
