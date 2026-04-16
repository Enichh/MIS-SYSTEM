# Contract Validation Script

This script validates that all tokens referenced in task files are present in schema.json imports_from_shared lists.

## Usage
```bash
node .parallel/validation/contract-validation.js
```

## Validation Checks
1. Schema JSON structure and syntax
2. Naming collisions across workstreams
3. Task count limits (max 3-4 per workstream)
4. Contract consistency: All tokens referenced in task files must be in schema.json imports_from_shared lists
5. DTO/schema compliance: Mock data respects enum constraints and required fields
6. API endpoint consistency: Endpoints match existing codebase patterns
7. Data flow verification: Data structures propagate correctly across workstreams

## Exit Codes
- 0: All validations passed
- 1: Validation failed

## Notes
- This script should be run after plan generation and before parallel execution
- Any violations should be fixed in schema.json before proceeding