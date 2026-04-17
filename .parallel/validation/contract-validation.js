const fs = require('fs');
const path = require('path');

// Read schema.json
const schemaPath = path.join(__dirname, '../contracts/schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Read workstream task files
const sharedTasks = fs.readFileSync(path.join(__dirname, '../workstreams/shared-tasks.md'), 'utf8');
const backendTasks = fs.readFileSync(path.join(__dirname, '../workstreams/backend-tasks.md'), 'utf8');
const frontendTasks = fs.readFileSync(path.join(__dirname, '../workstreams/frontend-tasks.md'), 'utf8');

let errors = [];
let warnings = [];

// Extract tokens referenced in task files
function extractTokens(taskContent) {
  const tokens = [];
  
  // Extract function names
  const functionMatches = taskContent.match(/\b[a-zA-Z][a-zA-Z0-9]*\b/g);
  if (functionMatches) {
    tokens.push(...functionMatches);
  }
  
  return [...new Set(tokens)]; // Remove duplicates
}

// Validate shared workstream
const sharedTokens = extractTokens(sharedTasks);
const sharedExports = [
  ...Object.keys(schema.contracts.shared.exports.public.types || {}),
  ...Object.keys(schema.contracts.shared.exports.public.functions || {}),
  ...Object.keys(schema.contracts.shared.exports.public.constants || {}),
  ...(schema.contracts.shared.exports.internal || [])
];

// Check if task file references are in schema
sharedTokens.forEach(token => {
  if (!sharedExports.includes(token) && 
      ['SearchQuery', 'SearchFilters', 'SearchResult', 'debounceSearch', 'filterByName', 'buildSearchFilters', 'normalizeSearchQuery', 'matchesSearchTerm', 'SEARCH_DEBOUNCE_MS', 'MIN_SEARCH_LENGTH'].includes(token)) {
    if (!sharedExports.includes(token)) {
      errors.push(`Shared workstream references '${token}' but it's not in schema.json shared exports`);
    }
  }
});

// Validate backend workstream
const backendImports = schema.contracts.backend.imports_from_shared || [];
backendImports.forEach(imp => {
  if (!sharedExports.includes(imp)) {
    errors.push(`Backend imports '${imp}' from shared but it's not in schema.json shared exports`);
  }
});

// Validate frontend workstream
const frontendImports = schema.contracts.frontend.imports_from_shared || [];
frontendImports.forEach(imp => {
  if (!sharedExports.includes(imp)) {
    errors.push(`Frontend imports '${imp}' from shared but it's not in schema.json shared exports`);
  }
});

// Check task count limits
const sharedTaskCount = (sharedTasks.match(/### Task \d+:/g) || []).length;
const backendTaskCount = (backendTasks.match(/### Task \d+:/g) || []).length;
const frontendTaskCount = (frontendTasks.match(/### Task \d+:/g) || []).length;

if (sharedTaskCount > 3) {
  warnings.push(`Shared workstream has ${sharedTaskCount} tasks (max 3 recommended)`);
}
if (backendTaskCount > 3) {
  warnings.push(`Backend workstream has ${backendTaskCount} tasks (max 3 recommended)`);
}
if (frontendTaskCount > 3) {
  warnings.push(`Frontend workstream has ${frontendTaskCount} tasks (max 3 recommended)`);
}

// Check for naming collisions
const allExports = [
  ...Object.keys(schema.contracts.shared.exports.public.types || {}),
  ...Object.keys(schema.contracts.shared.exports.public.functions || {}),
  ...Object.keys(schema.contracts.shared.exports.public.constants || {}),
  ...(schema.contracts.shared.exports.internal || []),
  ...(schema.contracts.backend.exports.public.components || []),
  ...(schema.contracts.backend.exports.public.api_routes || []),
  ...(schema.contracts.frontend.exports.public.components || [])
];

const duplicates = allExports.filter((item, index) => allExports.indexOf(item) !== index);
if (duplicates.length > 0) {
  errors.push(`Naming collisions detected: ${[...new Set(duplicates)].join(', ')}`);
}

// Validate schema structure
if (!schema.version) {
  errors.push('Schema missing version');
}
if (!schema.feature) {
  errors.push('Schema missing feature name');
}
if (!schema.freeze_phase) {
  errors.push('Schema missing freeze_phase');
}
if (!schema.contracts) {
  errors.push('Schema missing contracts');
}
if (!schema.dependency_graph) {
  errors.push('Schema missing dependency_graph');
}

// Output results
console.log('=== Contract Validation Results ===');
console.log(`Version: ${schema.version}`);
console.log(`Feature: ${schema.feature}`);
console.log(`Freeze Phase: ${schema.freeze_phase}`);
console.log('');

if (errors.length > 0) {
  console.log('❌ ERRORS:');
  errors.forEach(err => console.log(`  - ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(warn => console.log(`  - ${warn}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All validations passed!');
  process.exit(0);
} else if (errors.length > 0) {
  console.log('❌ Validation failed with errors');
  process.exit(1);
} else {
  console.log('⚠️  Validation passed with warnings');
  process.exit(0);
}
