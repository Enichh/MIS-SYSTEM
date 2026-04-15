/**
 * Contract validation script
 * Ensures all tokens referenced in task files are in schema.json imports_from_shared lists
 * This prevents contract violations during execution
 */

const fs = require('fs');
const path = require('path');

function loadSchema() {
    const schemaPath = path.join('.parallel', 'contracts', 'schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
}

function extractImportsFromTaskFile(taskFilePath) {
    const content = fs.readFileSync(taskFilePath, 'utf8');
    const imports = [];

    // Look for patterns like "longcatApiClient", "ChatStateManager", etc.
    // in the context of imports or usage
    const patterns = [
        /(?:import|from|use|require)\s+['"`]?(\w+)['"`]?/g,
        /(\w+)\(/g, // Function calls
        /new\s+(\w+)\(/g, // Class instantiation
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const token = match[1];
            if (token && token.length > 2 && !token.match(/^(if|for|while|return|const|let|var|function|class|async|await)$/)) {
                imports.push(token);
            }
        }
    }

    return [...new Set(imports)]; // Deduplicate
}

function validateContractConsistency(schema) {
    const workstreamsDir = path.join('.parallel', 'workstreams');
    const violations = [];

    if (!fs.existsSync(workstreamsDir)) {
        console.log('⚠️  workstreams directory not found');
        return [];
    }

    const taskFiles = fs.readdirSync(workstreamsDir).filter(f => f.endsWith('-tasks.md'));

    for (const taskFile of taskFiles) {
        const workstreamName = taskFile.replace('-tasks.md', '');
        const taskFilePath = path.join(workstreamsDir, taskFile);
        const content = fs.readFileSync(taskFilePath, 'utf8');

        // Extract the workstream contract
        const contract = schema.contracts[workstreamName];
        if (!contract) {
            violations.push({
                workstream: workstreamName,
                error: 'Workstream not found in schema.json'
            });
            continue;
        }

        // Get allowed imports from shared
        const allowedImports = contract.imports_from_shared || [];

        // Extract tokens referenced in task file
        const referencedTokens = extractImportsFromTaskFile(taskFilePath);

        // Check if referenced tokens are in allowed imports
        for (const token of referencedTokens) {
            if (allowedImports.length > 0 && !allowedImports.includes(token)) {
                // Check if it might be a shared export that should be in imports_from_shared
                const sharedExports = schema.contracts.shared?.exports || [];
                const allSharedExports = [
                    ...(sharedExports.functions || []),
                    ...(sharedExports.classes || []),
                    ...(sharedExports.constants || []),
                    ...(sharedExports.config || [])
                ];

                if (allSharedExports.includes(token)) {
                    violations.push({
                        workstream: workstreamName,
                        token: token,
                        error: `Token '${token}' is in shared exports but not in imports_from_shared list`
                    });
                }
            }
        }
    }

    return violations;
}

function main() {
    console.log('Running contract validation...\n');

    try {
        const schema = loadSchema();
        console.log('✅ Loaded schema.json');

        const violations = validateContractConsistency(schema);

        if (violations.length > 0) {
            console.log('\n❌ Contract violations found:');
            for (const violation of violations) {
                console.log(`   - ${violation.workstream}: ${violation.token || ''} - ${violation.error}`);
            }
            console.log('\n💡 Fix: Update schema.json imports_from_shared lists to include all referenced tokens');
            process.exit(1);
        }

        console.log('✅ Contract validation passed - no violations detected');
        process.exit(0);

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

main();
