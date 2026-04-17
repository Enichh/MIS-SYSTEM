const fs = require('fs');
const path = require('path');

const schemaPath = '.parallel/contracts/schema.json';
const workstreamsDir = '.parallel/workstreams';

console.log('=== Contract Validation ===');

// Load schema
let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  console.log('✓ Schema loaded');
} catch (error) {
  console.error('❌ ERROR: Failed to load schema.json');
  process.exit(1);
}

// Validate schema structure
if (!schema.contracts || !schema.dependency_graph) {
  console.error('❌ ERROR: Invalid schema structure');
  process.exit(1);
}
console.log('✓ Schema structure valid');

// Check task files exist and validate references
const taskFiles = fs.readdirSync(workstreamsDir).filter(f => f.endsWith('-tasks.md'));

let hasErrors = false;

for (const taskFile of taskFiles) {
  const workstreamName = taskFile.replace('-tasks.md', '');
  const taskPath = path.join(workstreamsDir, taskFile);
  const content = fs.readFileSync(taskPath, 'utf8');
  
  console.log(`\nValidating ${workstreamName}...`);
  
  // Check task count (max 3 per workstream)
  const taskMatches = content.match(/### Task \d+:/g);
  const taskCount = taskMatches ? taskMatches.length : 0;
  
  if (taskCount > 3) {
    console.error(`❌ ERROR: ${workstreamName} has ${taskCount} tasks (max 3 allowed)`);
    hasErrors = true;
  } else {
    console.log(`✓ ${workstreamName} has ${taskCount} tasks (within limit)`);
  }
  
  // Check acceptance criteria count (max 7 per task)
  const acceptanceMatches = content.match(/\- \[ \]/g);
  const acceptanceCount = acceptanceMatches ? acceptanceMatches.length : 0;
  
  if (acceptanceCount > 15) {
    console.error(`❌ ERROR: ${workstreamName} has ${acceptanceCount} acceptance criteria (max 15 allowed)`);
    hasErrors = true;
  } else {
    console.log(`✓ ${workstreamName} has ${acceptanceCount} acceptance criteria (within limit)`);
  }
  
  // Verify imports_from_shared references exist in schema
  const workstreamContract = schema.contracts[workstreamName];
  if (workstreamContract && workstreamContract.imports_from_shared) {
    const sharedExports = schema.contracts.shared.exports.public;
    for (const importItem of workstreamContract.imports_from_shared) {
      if (!sharedExports.types.includes(importItem) && 
          !sharedExports.functions.includes(importItem) && 
          !sharedExports.constants.includes(importItem)) {
        console.error(`❌ ERROR: ${importItem} not found in shared exports`);
        hasErrors = true;
      }
    }
  }
}

// Check prompt lengths
const promptsDir = '.parallel/prompts';
const promptFiles = fs.readdirSync(promptsDir).filter(f => f.endsWith('-prompt.md'));

for (const promptFile of promptFiles) {
  const promptPath = path.join(promptsDir, promptFile);
  const content = fs.readFileSync(promptPath, 'utf8');
  const lines = content.split('\n').length;
  
  if (lines > 60) {
    console.error(`❌ ERROR: ${promptFile} has ${lines} lines (max 60 allowed)`);
    hasErrors = true;
  } else {
    console.log(`✓ ${promptFile} has ${lines} lines (within limit)`);
  }
}

if (hasErrors) {
  console.error('\n❌ Contract validation FAILED');
  process.exit(1);
}

console.log('\n✓ Contract validation PASSED');
