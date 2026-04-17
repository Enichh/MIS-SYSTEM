# Workstream: backend (API Routes Migration)
## Contract Version: 1.0.0
## Dependencies: shared (must complete first)

### SCOPE BOUNDARIES
**IN SCOPE:**
- Migrate Netlify Functions to Next.js App Router API routes
- Create route.ts files in app/api/ directory
- Implement GET/POST handlers using NextRequest/NextResponse
- Add input validation with Zod
- Configure CORS middleware for external API access

**OUT OF SCOPE (DO NOT TOUCH):**
- app/components/ (belongs to frontend workstream)
- lib/ directory (belongs to shared workstream)
- index.html or vanilla JS frontend code

### Task 1: Migrate Employee Data API Route
**Contract References:** `schema.json#/contracts/backend/exports/0`, `schema.json#/contracts/backend/nextjs_best_practices`
**Acceptance Criteria:**
- [ ] Create app/api/employees/route.ts with GET handler
- [ ] Import fetchFromDatabase from shared workstream
- [ ] Use NextRequest and NextResponse (not Express-style req/res)
- [ ] Implement query parameter parsing with request.nextUrl.searchParams
- [ ] Add Zod validation for query parameters (id, status filters)
- [ ] Return JSON response with proper Content-Type header
- [ ] Add error handling with 500 status and ApiResponse shape
- [ ] Set export const dynamic = 'force-dynamic' (Next.js 15+ default)
**Validation Command:** `curl http://localhost:3000/api/employees` (returns JSON array)

### Task 2: Migrate Project and Task Data API Routes
**Contract References:** `schema.json#/contracts/backend/exports/1`, `schema.json#/contracts/backend/exports/2`
**Acceptance Criteria:**
- [ ] Create app/api/projects/route.ts with GET handler
- [ ] Create app/api/tasks/route.ts with GET handler
- [ ] Both routes import fetchFromDatabase from shared workstream
- [ ] Implement query parameter filtering (id, status, projectId, assignedTo)
- [ ] Add Zod validation for all query parameters
- [ ] Return proper error responses with ApiResponse shape
- [ ] Ensure consistent response format across all routes
- [ ] Test with vanilla JS frontend to verify API compatibility
**Validation Command:** `curl http://localhost:3000/api/projects` then `curl http://localhost:3000/api/tasks`

### Task 3: Migrate Knowledge Query API Route
**Contract References:** `schema.json#/contracts/backend/exports/3`, `schema.json#/contracts/backend/nextjs_best_practices`
**Acceptance Criteria:**
- [ ] Create app/api/knowledge/query/route.ts with POST handler
- [ ] Import detectQueryIntent, buildKnowledgeContext from shared workstream
- [ ] Parse request body with Zod validation (KnowledgeQuery schema)
- [ ] Build context using buildKnowledgeContext function
- [ ] Call LONGCAT API with proper error handling
- [ ] Implement response streaming for AI answers (if needed)
- [ ] Return KnowledgeResponse with answer, sources, confidence, relatedEntities
- [ ] Handle LONGCAT_API_KEY from environment variables
- [ ] Add proper error responses for missing API key or API failures
**Validation Command:** Test with vanilla JS chat interface (knowledge queries work)

## Pre-Completion Checklist
- [ ] Run `npx tsc --noEmit` (type checking)
- [ ] Run `npm run lint` (code quality)
- [ ] Test all API routes with curl or Postman
- [ ] Verify vanilla JS frontend can call migrated APIs successfully
- [ ] Check that all routes use NextRequest/NextResponse APIs
- [ ] Verify Zod validation is implemented for all inputs
- [ ] Ensure dynamic caching is configured correctly
- [ ] Verify API endpoints match schema.json exports
- [ ] Check error responses match ApiResponse shape
- [ ] No unauthorized schema modifications