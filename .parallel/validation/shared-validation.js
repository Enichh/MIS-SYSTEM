/**
 * Shared workstream validation script
 * Ensures shared exports are complete and consistent
 * Shared is the foundation - if it fails, all downstream workstreams fail
 */

const fs = require('fs');
const path = require('path');

function loadSchema() {
    const schemaPath = path.join('.parallel', 'contracts', 'schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
}

function validateSharedExports(schema) {
    const sharedContract = schema.contracts.shared;
    const issues = [];

    if (!sharedContract) {
        issues.push('Shared workstream contract not found in schema.json');
        return issues;
    }

    // Check that exports are properly categorized
    const exportCategories = ['functions', 'classes', 'constants', 'config'];
    for (const category of exportCategories) {
        if (!sharedContract.exports[category]) {
            issues.push(`Missing export category: ${category}`);
        }
    }

    // Check that schemas are defined for all exports
    if (sharedContract.schemas) {
        const allExports = [
            ...Object.keys(sharedContract.exports.functions || {}),
            ...Object.keys(sharedContract.exports.classes || {}),
            ...Object.keys(sharedContract.exports.config || {})
        ];

        for (const exportName of allExports) {
            if (!sharedContract.schemas[exportName]) {
                issues.push(`Missing schema definition for export: ${exportName}`);
            }
        }
    }

    // Check that downstream workstreams have proper imports_from_shared
    for (const [workstreamName, contract] of Object.entries(schema.contracts)) {
        if (workstreamName === 'shared') continue;

        if (!contract.imports_from_shared) {
            issues.push(`${workstreamName} missing imports_from_shared list`);
        }
    }

    return issues;
}

function main() {
    console.log('Running shared workstream validation...\n');

    try {
        const schema = loadSchema();
        console.log('✅ Loaded schema.json');

        const issues = validateSharedExports(schema);

        if (issues.length > 0) {
            console.log('\n❌ Shared workstream validation issues:');
            for (const issue of issues) {
                console.log(`   - ${issue}`);
            }
            console.log('\n💡 Fix: Ensure shared exports are complete and properly documented in schema.json');
            process.exit(1);
        }

        console.log('✅ Shared workstream validation passed - exports are complete and consistent');
        process.exit(0);

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

main();
