# Workstream: shared (Infrastructure & Shared Utilities)
## Contract Version: 1.0.0
## Dependencies: None (foundational workstream)

### SCOPE BOUNDARIES
**IN SCOPE:**
- Initialize Next.js project with TypeScript and App Router
- Set up project structure (app directory, lib for utilities, types)
- Migrate shared utilities (constants, database helpers) to lib directory
- Create TypeScript type definitions for data models
- Set up environment variable configuration

**OUT OF SCOPE (DO NOT TOUCH):**
- app/api/ routes (belongs to backend workstream)
- app/components/ (belongs to frontend workstream)
- Netlify Functions directory (legacy code)

### Task 1: Initialize Next.js Project with TypeScript
**Contract References:** `schema.json#/contracts/shared/exports/public/types` 
**Acceptance Criteria:**
- [ ] Initialize Next.js 15+ project with App Router and TypeScript
- [ ] Create project structure: app/, lib/, types/, public/
- [ ] Configure tsconfig.json with strict mode enabled
- [ ] Set up .env.local for LONGCAT_API_KEY
- [ ] Install dependencies: next, react, react-dom, typescript, @types/node, zod
- [ ] Configure next.config.js for Netlify deployment
**Validation Command:** Verify Next.js project initialized successfully (check package.json exists)

### Task 2: Migrate Database Helper and Mock Data
**Contract References:** `schema.json#/contracts/shared/exports/public/functions/0` 
**Acceptance Criteria:**
- [ ] Create lib/utils/database.ts with fetchFromDatabase function
- [ ] Migrate mock data from netlify/functions/database-helper.js to lib/data/mockData.ts
- [ ] Convert CommonJS require/module.exports to ES6 modules
- [ ] Add TypeScript types for Employee, Project, Task
- [ ] Ensure function signature matches schema: fetchFromDatabase(storeName: string, filters?: object): Promise<any[]>
**Validation Command:** `npx tsc --noEmit` (no type errors)

### Task 3: Create Type Definitions and Constants
**Contract References:** `schema.json#/contracts/shared/exports/public/types`, `schema.json#/contracts/shared/exports/public/constants`
**Acceptance Criteria:**
- [ ] Create types/index.ts exporting Employee, Project, Task, ApiResponse, KnowledgeQuery, KnowledgeResponse
- [ ] Create lib/constants.ts with API_BASE_URL, KNOWLEDGE_ENDPOINTS, CHAT_STORAGE_KEY
- [ ] Update constants to use Next.js API routes pattern (/api/* instead of /.netlify/functions/*)
- [ ] Add Zod schemas for input validation (EmployeeSchema, ProjectSchema, TaskSchema)
- [ ] Export all types and constants from shared workstream per schema
**Validation Command:** `npx tsc --noEmit` (no type errors)

### Task 4: Set Up Utility Functions
**Contract References:** `schema.json#/contracts/shared/exports/internal`
**Acceptance Criteria:**
- [ ] Create lib/utils/validation.ts with validateEmployee, validateProject, validateTask functions
- [ ] Create lib/utils/knowledge.ts with detectQueryIntent, buildKnowledgeContext functions
- [ ] Add internal helpers: sanitizeQuery, formatKnowledgeResponse
- [ ] Ensure all functions are properly typed with TypeScript
- [ ] Export public functions per schema, keep internal helpers as module-private
**Validation Command:** `npm run lint` (no linting errors)

## Pre-Completion Checklist
- [ ] Run `npx tsc --noEmit` (type checking)
- [ ] Run `npm run lint` (code quality)
- [ ] Verify all public exports in schema.json exist
- [ ] Verify internal helpers are documented but not exported
- [ ] Check that API endpoints use /api/ pattern (not /.netlify/functions/)
- [ ] Ensure mock data respects schema enum constraints
- [ ] Verify TypeScript strict mode compliance
- [ ] No unauthorized schema modifications