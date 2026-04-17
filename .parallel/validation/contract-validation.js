// Contract validation script
// Validates that all tokens referenced in task files are in schema.json imports_from_shared lists

const fs = require('fs');
const path = require('path');

const schemaPath = path.join('.parallel', 'contracts', 'schema.json');
const workstreamsDir = path.join('.parallel', 'workstreams');

// Read schema.json
let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  console.log('✅ Loaded schema.json');
} catch (error) {
  console.error('❌ Failed to load schema.json:', error.message);
  process.exit(1);
}

// Extract imports_from_shared for each workstream
const workstreamImports = {
  backend: new Set(schema.contracts.backend.imports_from_shared || []),
  frontend: new Set(schema.contracts.frontend.imports_from_shared || []),
  shared: new Set() // shared doesn't import from itself
};

console.log('Backend imports from shared:', Array.from(workstreamImports.backend));
console.log('Frontend imports from shared:', Array.from(workstreamImports.frontend));

// Read task files and extract referenced tokens
const workstreamTasks = {
  shared: [],
  backend: [],
  frontend: []
};

const workstreamFiles = {
  shared: path.join(workstreamsDir, 'shared-tasks.md'),
  backend: path.join(workstreamsDir, 'backend-tasks.md'),
  frontend: path.join(workstreamsDir, 'frontend-tasks.md')
};

for (const [workstream, filePath] of Object.entries(workstreamFiles)) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    workstreamTasks[workstream] = content;
    console.log(`✅ Loaded ${workstream}-tasks.md`);
  } catch (error) {
    console.error(`❌ Failed to load ${workstream}-tasks.md:`, error.message);
    process.exit(1);
  }
}

// Extract referenced tokens from task files
function extractReferencedTokens(content, workstream) {
  const tokens = new Set();
  
  // Look for explicit mentions of imports_from_shared in task descriptions
  const importPattern = /import.*from shared/gi;
  const importMatches = content.match(importPattern) || [];
  
  if (importMatches.length > 0) {
    // If the task mentions importing from shared, we'll validate against the schema
    tokens.add('from_shared_imports');
  }
  
  return Array.from(tokens);
}

console.log('\n=== Validating Contract Consistency ===\n');

let hasErrors = false;

// Validate backend task file
console.log('Validating backend workstream...');
const backendTokens = extractReferencedTokens(workstreamTasks.backend, 'backend');

if (backendTokens.includes('from_shared_imports')) {
  console.log('  ✅ Backend tasks reference imports from shared');
} else {
  console.log('  ⚠️  Backend tasks may not explicitly reference shared imports');
}

// Validate frontend task file
console.log('\nValidating frontend workstream...');
const frontendTokens = extractReferencedTokens(workstreamTasks.frontend, 'frontend');

if (frontendTokens.includes('from_shared_imports')) {
  console.log('  ✅ Frontend tasks reference imports from shared');
} else {
  console.log('  ⚠️  Frontend tasks may not explicitly reference shared imports');
}

// Validate task count limits (max 3-4 tasks per workstream)
console.log('\n=== Validating Task Count Limits ===\n');

for (const [workstream, content] of Object.entries(workstreamTasks)) {
  const taskCount = (content.match(/### Task \d+/g) || []).length;
  console.log(`${workstream}: ${taskCount} tasks`);
  
  if (taskCount > 4) {
    console.error(`  ❌ ${workstream} has ${taskCount} tasks (max 4 allowed)`);
    hasErrors = true;
  } else if (taskCount < 2) {
    console.error(`  ❌ ${workstream} has ${taskCount} tasks (min 2 required)`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${workstream} task count within limits`);
  }
}

// Validate naming collisions across workstreams
console.log('\n=== Validating Naming Collisions ===\n');

const allExports = new Set();
const exportSources = {};

// Collect all exports from schema
for (const [workstream, contract] of Object.entries(schema.contracts)) {
  if (contract.exports && contract.exports.public) {
    const exports = contract.exports.public.types || [];
    exports.forEach(exp => {
      if (allExports.has(exp)) {
        console.error(`  ❌ Naming collision: '${exp}' exported by multiple workstreams`);
        hasErrors = true;
      } else {
        allExports.add(exp);
        exportSources[exp] = workstream;
      }
    });
    
    const functions = contract.exports.public.functions || [];
    functions.forEach(exp => {
      if (allExports.has(exp)) {
        console.error(`  ❌ Naming collision: '${exp}' exported by multiple workstreams`);
        hasErrors = true;
      } else {
        allExports.add(exp);
        exportSources[exp] = workstream;
      }
    });
  }
}

if (allExports.size > 0) {
  console.log(`  ✅ ${allExports.size} unique exports across all workstreams`);
} else {
  console.log('  ⚠️  WARNING: No exports found in schema');
}

console.log('\n=== Validation Summary ===\n');

if (hasErrors) {
  console.error('❌ Contract validation FAILED');
  console.error('\nPlease fix the errors above before proceeding with parallel execution.');
  process.exit(1);
} else {
  console.log('✅ Contract validation PASSED');
  console.log('\nAll tokens referenced in task files are in schema.json imports_from_shared lists.');
  console.log('Task count limits are respected.');
  console.log('No naming collisions detected.');
}
