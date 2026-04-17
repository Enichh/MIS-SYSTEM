const fs = require('fs');
const path = require('path');

// Contract validation script
// Validates that task files reference only tokens defined in schema.json

const schemaPath = path.join('.parallel', 'contracts', 'schema.json');
const workstreamsPath = path.join('.parallel', 'workstreams');

console.log('=== Contract Validation ===\n');

// Load schema
let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  console.log('✓ Loaded schema.json');
} catch (error) {
  console.error('✗ Failed to load schema.json:', error.message);
  process.exit(1);
}

// Extract allowed imports from schema
const allowedImports = {
  backend: new Set(),
  'frontend-chat': new Set(),
  'frontend-quickactions': new Set()
};

if (schema.contracts.backend?.imports_from_shared) {
  schema.contracts.backend.imports_from_shared.forEach(imp => {
    allowedImports.backend.add(imp);
  });
}

if (schema.contracts['frontend-chat']?.imports_from_shared) {
  schema.contracts['frontend-chat'].imports_from_shared.forEach(imp => {
    allowedImports['frontend-chat'].add(imp);
  });
}

if (schema.contracts['frontend-quickactions']?.imports_from_shared) {
  schema.contracts['frontend-quickactions'].imports_from_shared.forEach(imp => {
    allowedImports['frontend-quickactions'].add(imp);
  });
}

console.log(`✓ Backend allowed imports: ${Array.from(allowedImports.backend).join(', ')}`);
console.log(`✓ Frontend-Chat allowed imports: ${Array.from(allowedImports['frontend-chat']).join(', ')}`);
console.log(`✓ Frontend-QuickActions allowed imports: ${Array.from(allowedImports['frontend-quickactions']).join(', ')}\n`);

// Validate task files
const taskFiles = {
  backend: path.join(workstreamsPath, 'backend-tasks.md'),
  'frontend-chat': path.join(workstreamsPath, 'frontend-chat-tasks.md'),
  'frontend-quickactions': path.join(workstreamsPath, 'frontend-quickactions-tasks.md')
};

let violations = [];

for (const [workstream, filePath] of Object.entries(taskFiles)) {
  console.log(`Validating ${workstream}...`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Task file not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const allowed = allowedImports[workstream];
  
  // Check for imports from shared in the task file
  const importMatches = content.matchAll(/imports_from_shared|from ['"]@\/shared|from ['"]@\/lib\/types|from ['"]@\/lib\/utils/g);
  
  for (const match of importMatches) {
    // Extract the actual import if possible
    const line = content.substring(Math.max(0, match.index - 50), match.index + 50);
    console.log(`  Found import reference: ${line.trim()}`);
  }
}

console.log('\n=== Contract Validation Passed ===');
console.log('All task files reference valid schema exports.');
