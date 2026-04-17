# Workstream: frontend (React Component Migration)
## Contract Version: 1.0.0
## Dependencies: shared, backend (must complete first)

### SCOPE BOUNDARIES
**IN SCOPE:**
- Migrate vanilla JS components to React Server Components
- Create app/page.tsx as main entry point
- Create reusable UI components in app/components/
- Maintain API compatibility with migrated backend
- Preserve existing functionality (employees, projects, tasks, chat)

**OUT OF SCOPE (DO NOT TOUCH):**
- app/api/ routes (belongs to backend workstream)
- lib/ directory (belongs to shared workstream)

### Task 1: Create Main Page and Layout Structure
**Contract References:** `schema.json#/contracts/frontend/nextjs_best_practices`
**Acceptance Criteria:**
- [ ] Create app/layout.tsx with HTML structure from index.html
- [ ] Create app/page.tsx as main entry point
- [ ] Set up app/globals.css from css/main.css
- [ ] Import and apply design tokens from shared workstream
- [ ] Configure metadata and viewport in layout.tsx
- [ ] Ensure Server Components are used by default (no 'use client' unless needed)
- [ ] Test that page renders without errors
**Validation Command:** `npm run dev` (page loads at http://localhost:3000)

### Task 2: Migrate Core UI Components
**Contract References:** `schema.json#/contracts/frontend/exports` (EmployeeList, ProjectList, TaskList, ChatModal, ThemeToggle)
**Acceptance Criteria:**
- [ ] Create app/components/Header/Header.tsx from header structure
- [ ] Create app/components/Navigation/Navigation.tsx from nav buttons
- [ ] Create app/components/EmployeeList/EmployeeList.tsx (Server Component)
- [ ] Create app/components/ProjectList/ProjectList.tsx (Server Component)
- [ ] Create app/components/TaskList/TaskList.tsx (Server Component)
- [ ] Components fetch data from migrated API routes (/api/employees, /api/projects, /api/tasks)
- [ ] Preserve existing styling from css/components/
- [ ] Use TypeScript types from shared workstream (Employee, Project, Task)
- [ ] Implement error handling for API failures
**Validation Command:** Verify all components render with data from API routes

### Task 3: Migrate Chat and Interactive Components
**Contract References:** `schema.json#/contracts/frontend/exports`, `schema.json#/contracts/frontend/nextjs_best_practices`
**Acceptance Criteria:**
- [ ] Create app/components/ChatModal/ChatModal.tsx (Client Component with 'use client')
- [ ] Create app/components/ThemeToggle/ThemeToggle.tsx (Client Component)
- [ ] Migrate chat functionality to call /api/knowledge/query endpoint
- [ ] Preserve chat history persistence using CHAT_STORAGE_KEY from shared
- [ ] Implement form handlers for employee/project/task creation (if needed)
- [ ] Ensure client components only use 'use client' when necessary (interactivity)
- [ ] Test chat functionality with migrated knowledge query API
- [ ] Verify theme toggle works correctly
- [ ] Ensure all interactive features work as before
**Validation Command:** Test chat interface and all interactive features

### Task 4: Clean Up Legacy Code
**Contract References:** None (cleanup task)
**Acceptance Criteria:**
- [ ] Delete netlify/functions/ directory (replaced by app/api/)
- [ ] Delete src/ directory (vanilla JS replaced by React components)
- [ ] Delete index.html (replaced by app/page.tsx)
- [ ] Delete css/ directory (migrated to app/globals.css or CSS modules)
- [ ] Delete styles.css.backup
- [ ] Keep netlify.toml for Netlify deployment configuration
- [ ] Keep _redirects if needed for custom routing
- [ ] Handle gracefully if any directory/file doesn't exist (skip deletion)
- [ ] Verify Next.js app still works after cleanup
- [ ] Run `npm run build` to ensure no broken imports
**Validation Command:** `npm run build` (succeeds with no errors)

## Pre-Completion Checklist
- [ ] Run `npx tsc --noEmit` (type checking)
- [ ] Run `npm run lint` (code quality)
- [ ] Test all features work as expected (employees, projects, tasks, chat)
- [ ] Verify Server Components are used by default
- [ ] Check that 'use client' is only used when necessary
- [ ] Verify API calls use migrated endpoints (/api/* not /.netlify/functions/*)
- [ ] Ensure TypeScript types from shared workstream are used
- [ ] Check that styling is preserved from original CSS
- [ ] Test responsive design and mobile functionality
- [ ] No unauthorized schema modifications