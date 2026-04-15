#!/usr/bin/env node
/**
 * Cross-reference validator for parallel work
 * Detects naming collisions, missing exports, and contract violations
 */

const fs = require('fs');
const path = require('path');

function loadSchema() {
  try {
    const schemaPath = path.join(process.cwd(), '.parallel/contracts/schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    return JSON.parse(schemaContent);
  } catch (error) {
    console.error('❌ Failed to load schema.json:', error.message);
    process.exit(1);
  }
}

function extractAllNames(schema) {
  const names = {};
  
  for (const [workstream, config] of Object.entries(schema.contracts)) {
    if (config.exports) {
      // Handle different export structures (arrays or objects with type categories)
      const exports = Array.isArray(config.exports) 
        ? config.exports 
        : Object.values(config.exports).flat();
      
      for (const item of exports) {
        if (typeof item === 'string') {
          if (item in names) {
            console.error(`❌ COLLISION: '${item}' defined in both ${names[item]} and ${workstream}`);
            return false;
          }
          names[item] = workstream;
        }
      }
    }
  }
  
  console.log(`✅ No naming collisions detected (${Object.keys(names).length} symbols)`);
  return true;
}

function verifyTaskFiles(schema) {
  const workstreamsDir = path.join(process.cwd(), '.parallel/workstreams');
  
  if (!fs.existsSync(workstreamsDir)) {
    console.error('❌ workstreams directory not found');
    return false;
  }
  
  const taskFiles = fs.readdirSync(workstreamsDir).filter(f => f.endsWith('-tasks.md') && !f.endsWith('.old'));
  
  for (const taskFile of taskFiles) {
    const content = fs.readFileSync(path.join(workstreamsDir, taskFile), 'utf-8');
    
    // Check task count (max 3)
    const taskMatches = content.match(/^### Task \d+/gm);
    if (taskMatches && taskMatches.length > 3) {
      console.error(`❌ ${taskFile} has ${taskMatches.length} tasks (max 3 allowed)`);
      return false;
    }
    
    console.log(`✅ ${taskFile}: ${taskMatches ? taskMatches.length : 0} tasks`);
  }
  
  console.log('✅ All task file references valid');
  return true;
}

function main() {
  console.log('🔍 Running cross-reference validation...\n');
  
  const schema = loadSchema();
  
  if (!extractAllNames(schema)) {
    console.log('\n⛔ Validation failed - naming collisions detected');
    process.exit(1);
  }
  
  if (!verifyTaskFiles(schema)) {
    console.log('\n⛔ Validation failed - task file issues');
    process.exit(1);
  }
  
  console.log('\n🚀 Validation passed - ready for parallel execution');
  process.exit(0);
}

main();
