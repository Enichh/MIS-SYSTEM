const fs = require("fs");
const path = require("path");

// Load schema.json
const schemaPath = path.join(__dirname, "../contracts/schema.json");
let schema;

try {
  schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  console.log("✅ schema.json is valid JSON");
} catch (error) {
  console.error("❌ ERROR: schema.json is not valid JSON:", error.message);
  process.exit(1);
}

// Validate required fields
const requiredFields = [
  "version",
  "feature",
  "freeze_phase",
  "contracts",
  "dependency_graph",
  "best_practices",
  "codebase_impact",
];
for (const field of requiredFields) {
  if (!schema[field]) {
    console.error(`❌ ERROR: Missing required field: ${field}`);
    process.exit(1);
  }
}
console.log("✅ All required fields present");

// Validate contracts structure
if (!schema.contracts.frontend) {
  console.error("❌ ERROR: Missing frontend contract");
  process.exit(1);
}
console.log("✅ Contracts structure valid");

// Validate codebase_impact
if (
  !schema.codebase_impact.files_to_modify ||
  !schema.codebase_impact.files_to_create
) {
  console.error("❌ ERROR: Missing codebase_impact files lists");
  process.exit(1);
}
console.log("✅ Codebase impact defined");

// Validate CSS best practices mention
if (!schema.best_practices.css_styling) {
  console.error("❌ ERROR: Missing css_styling best practices");
  process.exit(1);
}
console.log("✅ CSS best practices defined");

console.log("");
console.log("=== Contract Validation Complete ===");
