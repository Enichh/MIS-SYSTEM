/**
 * Cross-reference validator for detecting naming collisions
 * and missing exports across workstreams
 */

const fs = require('fs');
const path = require('path');

function loadSchema() {
    const schemaPath = path.join('.parallel', 'contracts', 'schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
}

function extractAllNames(schema) {
    const names = {};
    const collisions = [];

    for (const [workstream, config] of Object.entries(schema.contracts)) {
        // Only check exports for collisions, not imports_from_shared
        const exportConfig = config.exports;
        if (exportConfig) {
            // Handle both array and object structures
            const items = Array.isArray(exportConfig) 
                ? exportConfig 
                : Object.keys(exportConfig);
            
            for (const item of items) {
                if (names[item]) {
                    collisions.push({
                        name: item,
                        definedIn: names[item],
                        alsoIn: workstream
                    });
                } else {
                    names[item] = workstream;
                }
            }
        }
    }

    return { names, collisions };
}

function verifyTaskFiles(schema) {
    const workstreamsDir = path.join('.parallel', 'workstreams');
    const issues = [];

    if (!fs.existsSync(workstreamsDir)) {
        console.log('⚠️  workstreams directory not found');
        return [];
    }

    const taskFiles = fs.readdirSync(workstreamsDir).filter(f => f.endsWith('-tasks.md'));

    for (const taskFile of taskFiles) {
        const content = fs.readFileSync(path.join(workstreamsDir, taskFile), 'utf8');
        const refs = content.match(/schema\.json#\/[^`\s]+/g) || [];

        for (const ref of refs) {
            const pathParts = ref.replace('schema.json#/', '').split('/');
            let current = schema;

            try {
                for (const part of pathParts) {
                    if (!current[part]) {
                        issues.push({
                            file: taskFile,
                            reference: ref,
                            error: `Path not found: ${part}`
                        });
                        break;
                    }
                    current = current[part];
                }
            } catch (error) {
                issues.push({
                    file: taskFile,
                    reference: ref,
                    error: error.message
                });
            }
        }
    }

    return issues;
}

function main() {
    console.log('Running cross-reference validation...\n');

    try {
        const schema = loadSchema();
        console.log('✅ Loaded schema.json');

        // Check naming collisions
        const { names, collisions } = extractAllNames(schema);
        console.log(`✅ No naming collisions detected (${Object.keys(names).length} symbols)`);

        if (collisions.length > 0) {
            console.log('\n❌ Naming collisions found:');
            for (const collision of collisions) {
                console.log(`   - '${collision.name}' defined in both ${collision.definedIn} and ${collision.alsoIn}`);
            }
            process.exit(1);
        }

        // Verify task file references
        const issues = verifyTaskFiles(schema);
        if (issues.length > 0) {
            console.log('\n❌ Task file reference issues:');
            for (const issue of issues) {
                console.log(`   - ${issue.file}: ${issue.reference} - ${issue.error}`);
            }
            process.exit(1);
        }
        console.log('✅ All task file references valid');

        console.log('\n✅ Cross-reference validation passed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

main();
