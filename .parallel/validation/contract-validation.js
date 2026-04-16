// Contract Validation Script
// Validates that all tokens referenced in task files are in schema.json imports_from_shared lists

const fs = require('fs');
const path = require('path');

// Read schema.json
const schemaPath = path.join(__dirname, '../contracts/schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Read all task files
const workstreamsDir = path.join(__dirname, '../workstreams');
const taskFiles = fs.readdirSync(workstreamsDir).filter(f => f.endsWith('-tasks.md'));

console.log('=== Contract Validation ===\n');

let violations = [];

// Extract imports_from_shared from schema for each workstream
const schemaImports = {};
for (const workstreamName of Object.keys(schema.contracts)) {
    if (workstreamName === 'shared-foundation') continue;
    schemaImports[workstreamName] = schema.contracts[workstreamName].imports_from_shared || [];
}

// Validate each task file
for (const taskFile of taskFiles) {
    const workstreamName = taskFile.replace('-tasks.md', '');
    const taskFilePath = path.join(workstreamsDir, taskFile);
    const taskContent = fs.readFileSync(taskFilePath, 'utf8');
    
    console.log(`Validating ${workstreamName}...`);
    
    // Skip shared-foundation (it defines exports, doesn't import)
    if (workstreamName === 'shared-foundation') {
        console.log(`  ✓ Skipped (defines exports, doesn't import from shared)\n`);
        continue;
    }
    
    // Extract function/type/constant references from task content
    // Look for patterns like: "validateEmployee", "EmployeeDTO", "WORK_TYPE_ONSITE"
    const functionPattern = /\b(validate[A-Z][a-zA-Z]*|create[A-Z][a-zA-Z]*|get[A-Z][a-zA-Z]*|update[A-Z][a-zA-Z]*|delete[A-Z][a-zA-Z]*|getAll[A-Z][a-zA-Z]*|assign[A-Z][a-zA-Z]*|remove[A-Z][a-zA-Z]*|generateId|initializeApiClient|queryKnowledge|ChatStateManager|initializeChatState|ThemeToggle|initializeThemeManager)\b/g;
    const typePattern = /\b(EmployeeDTO|ProjectDTO|TaskDTO)\b/g;
    const constantPattern = /\b(DB_NAME|DB_VERSION|STORE_EMPLOYEES|STORE_PROJECTS|STORE_TASKS|WORK_TYPE_ONSITE|WORK_TYPE_WFH)\b/g;
    
    const functionMatches = taskContent.match(functionPattern) || [];
    const typeMatches = taskContent.match(typePattern) || [];
    const constantMatches = taskContent.match(constantPattern) || [];
    
    const allReferences = [...new Set([...functionMatches, ...typeMatches, ...constantMatches])];
    
    const allowedImports = schemaImports[workstreamName] || [];
    
    for (const ref of allReferences) {
        if (!allowedImports.includes(ref)) {
            violations.push({
                workstream: workstreamName,
                reference: ref,
                allowed: allowedImports
            });
        }
    }
    
    if (violations.filter(v => v.workstream === workstreamName).length === 0) {
        console.log(`  ✓ All references in imports_from_shared\n`);
    }
}

// Report violations
if (violations.length > 0) {
    console.log('\n=== CONTRACT VIOLATIONS FOUND ===\n');
    for (const violation of violations) {
        console.log(`Workstream: ${violation.workstream}`);
        console.log(`  Reference: "${violation.reference}"`);
        console.log(`  Allowed imports: [${violation.allowed.join(', ')}]`);
        console.log(`  Status: ✗ NOT in allowed imports\n`);
    }
    console.log('\nFix required: Add missing references to schema.json imports_from_shared for the affected workstream(s).');
    process.exit(1);
} else {
    console.log('\n=== Contract Validation Complete ===');
    console.log('No contract violations found ✓');
    process.exit(0);
}
