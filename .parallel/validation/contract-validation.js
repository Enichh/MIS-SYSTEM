const fs = require('fs');
const path = require('path');

// Read schema.json
const schemaPath = path.join('.parallel', 'contracts', 'schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

console.log('=== Contract Validation ===\n');

// Validate schema structure
if (!schema.version || !schema.feature || !schema.freeze_phase) {
    console.error('❌ ERROR: Missing required schema fields');
    process.exit(1);
}

console.log(`✓ Feature: ${schema.feature}`);
console.log(`✓ Version: ${schema.version}`);
console.log(`✓ Freeze Phase: ${schema.freeze_phase}`);

// Validate contracts exist
if (!schema.contracts) {
    console.error('❌ ERROR: Missing contracts section');
    process.exit(1);
}

console.log('✓ Contracts section exists');

// Validate workstreams
const workstreams = Object.keys(schema.contracts);
console.log(`\nWorkstreams: ${workstreams.join(', ')}`);

// Validate dependency graph
if (!schema.dependency_graph) {
    console.error('❌ ERROR: Missing dependency_graph');
    process.exit(1);
}

console.log('✓ Dependency graph exists');

// Check for naming collisions
const allExports = {};
workstreams.forEach(ws => {
    const contract = schema.contracts[ws];
    if (contract.exports && contract.exports.public) {
        const exports = contract.exports.public;
        Object.keys(exports).forEach(type => {
            exports[type].forEach(item => {
                const key = `${ws}:${type}:${item}`;
                if (allExports[key]) {
                    console.error(`❌ ERROR: Naming collision detected: ${key}`);
                    process.exit(1);
                }
                allExports[key] = true;
            });
        });
    }
});

console.log('✓ No naming collisions detected');

// Validate task files reference tokens in schema
const sharedTasksPath = path.join('.parallel', 'workstreams', 'shared-tasks.md');
const frontendTasksPath = path.join('.parallel', 'workstreams', 'frontend-tasks.md');

if (!fs.existsSync(sharedTasksPath)) {
    console.error('❌ ERROR: shared-tasks.md not found');
    process.exit(1);
}

if (!fs.existsSync(frontendTasksPath)) {
    console.error('❌ ERROR: frontend-tasks.md not found');
    process.exit(1);
}

console.log('✓ Task files exist');

// Read task files
const sharedTasks = fs.readFileSync(sharedTasksPath, 'utf8');
const frontendTasks = fs.readFileSync(frontendTasksPath, 'utf8');

// Check that task files reference schema correctly
if (sharedTasks.includes('schema.json#/contracts/')) {
    console.log('✓ shared-tasks.md references schema');
} else {
    console.warn('⚠ WARNING: shared-tasks.md may not reference schema');
}

if (frontendTasks.includes('schema.json#/contracts/')) {
    console.log('✓ frontend-tasks.md references schema');
} else {
    console.warn('⚠ WARNING: frontend-tasks.md may not reference schema');
}

console.log('\n=== Contract Validation Complete ===');
console.log('✓ All checks passed');
