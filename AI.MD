# Enosoft Project Management System - AI Context

## Project Overview

Enosoft Project Management System is a vanilla JavaScript admin dashboard for managing employees, projects, and tasks. The application uses IndexedDB for local data persistence and Netlify Functions for serverless backend operations, including an integrated AI chat assistant.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Database**: IndexedDB (browser-local storage)
- **Backend**: Netlify Functions (serverless)
- **Deployment**: Netlify
- **Module System**: ES6 modules (import/export)
- **No Framework**: Pure JavaScript - no React, Vue, or other frameworks

## Project Structure

```
MIS SYSTEM/
├── index.html              # Main HTML entry point
├── netlify.toml            # Netlify configuration
├── _redirects              # URL redirects
├── css/                    # Modular CSS architecture
│   ├── main.css            # CSS entry point with @import structure
│   ├── components/         # UI component styles (9 files)
│   │   ├── buttons.css
│   │   ├── cards.css
│   │   ├── chat-components.css
│   │   ├── data-table.css
│   │   ├── empty-state.css
│   │   ├── forms.css
│   │   ├── modals.css
│   │   ├── notification.css
│   │   └── status-badge.css
│   ├── layouts/            # Page layout styles (4 files)
│   │   ├── header.css
│   │   ├── main.css
│   │   ├── nav.css
│   │   └── responsive-grid.css
│   └── shared/             # Shared utility styles (4 files)
│       ├── base.css
│       ├── design-tokens.css    # OKLCH color system, spacing, typography
│       ├── reset.css
│       └── utilities.css
├── .parallel/              # Parallel development workflow tooling
│   ├── FEATURE.md          # Feature specification
│   ├── contracts/          # Workstream contract definitions
│   ├── execution-order.json # Workstream dependency graph
│   ├── prompts/            # AI workstream prompts
│   ├── validation/        # Contract validation scripts
│   └── workstreams/        # Individual workstream contexts
├── netlify/
│   └── functions/          # Serverless functions (5 files)
│       ├── database-helper.js   # Shared database operations
│       ├── employee-data.js
│       ├── knowledge-query.js    # AI chat integration
│       ├── project-data.js
│       └── task-data.js
└── src/
    ├── app.js              # Main application logic
    ├── frontend-components/
    │   ├── chatInput.js    # Chat input component
    │   ├── chatMessage.js  # Chat message display
    │   └── messageList.js  # Message list management
    └── shared/
        ├── apiClient.js    # API client for Netlify Functions
        ├── chatStateManager.js  # Chat history management
        ├── constants.js    # Application constants
        ├── database.js     # IndexedDB operations
        ├── models.js       # Data models and type definitions
        ├── types.js        # TypeScript-like type definitions
        └── validators.js   # Input validation functions
```

## CSS Architecture

### Design System

The project uses a modular CSS architecture with a design token system based on OKLCH color space for perceptual uniformity.

**Design Tokens** (`css/shared/design-tokens.css`):

- **Color Palette**: OKLCH-based colors (primary, background, surface, text, semantic colors)
- **Spacing Scale**: 8px grid base (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px)
- **Typography Scale**: 12px to 30px with font weights (400-700)
- **Shadow System**: 4 shadow levels (sm, md, lg, xl)
- **Transition System**: 3 timing presets (fast: 150ms, base: 200ms, slow: 300ms)
- **Focus Ring**: Accessibility-compliant focus indicators

### CSS Organization

**Import Order** (`css/main.css` follows dependency graph):

1. Reset (CSS normalization)
2. Design tokens (CSS variables - must come before base)
3. Base (HTML element styles using tokens)
4. Utilities (helper classes)
5. Components (UI component styles)
6. Layouts (page layout styles)

### Component Library

**Components** (`css/components/`):

- buttons.css - Primary, secondary, close, FAB buttons
- cards.css - Card containers
- chat-components.css - Chat modal, message list, input
- data-table.css - Data display tables
- empty-state.css - Empty state messaging
- forms.css - Form inputs and labels
- modals.css - Modal overlays and containers
- notification.css - Toast notifications
- status-badge.css - Status indicators

**Layouts** (`css/layouts/`):

- header.css - Page header
- main.css - Main content area
- nav.css - Navigation buttons
- responsive-grid.css - Responsive grid layouts

**Shared** (`css/shared/`):

- base.css - HTML element defaults
- design-tokens.css - CSS custom properties
- reset.css - CSS normalization
- utilities.css - Helper classes

### CSS Conventions

- **Naming**: kebab-case for class names (e.g., `btn-primary`, `modal-overlay`)
- **BEM-lite**: Component modifier pattern (e.g., `chat-modal`, `chat-modal-header`)
- **Variables**: Use design tokens via CSS custom properties
- **Responsive**: Mobile-first approach with media queries
- **Accessibility**: Focus rings, semantic HTML, ARIA labels

## Core Entities

### Employee

- **ID Pattern**: `emp_[a-z0-9]{12}` (e.g., `emp_abc123def456`)
- **Fields**: id, name, email, workType (onsite/wfh), assignedProjects, assignedTasks, createdAt, updatedAt
- **Validation**: Name (1-100 chars), email format, workType enum
- **Indexes**: email (unique), workType

### Project

- **ID Pattern**: `prj_[a-z0-9]{12}` (e.g., `prj_xyz789ghi012`)
- **Fields**: id, name, description, status (active/completed/archived), assignedEmployees, tasks, createdAt, updatedAt
- **Validation**: Name (1-200 chars), status enum, description (max 1000 chars)
- **Indexes**: status

### Task

- **ID Pattern**: `tsk_[a-z0-9]{12}` (e.g., `tsk_jkl012mno345`)
- **Fields**: id, projectId, title, description, status (pending/in-progress/completed), assignedEmployees, createdAt, updatedAt
- **Validation**: Title (1-200 chars), status enum, projectId pattern, description (max 1000 chars)
- **Indexes**: projectId, status

## Database Schema

**Database Name**: `enosoft_pms`
**Version**: 1

**Object Stores**:

- `employees`: IndexedDB store for employee records
- `projects`: IndexedDB store for project records
- `tasks`: IndexedDB store for task records

## Coding Conventions

### Naming

- **camelCase**: Variables, functions, and file names (e.g., `getEmployee`, `chatInput.js`)
- **PascalCase**: Classes (if any)
- **UPPER_SNAKE_CASE**: Constants (e.g., `WORK_TYPE_ONSITE`, `DB_NAME`)
- **Prefixes**: Entity IDs use 3-letter prefix (emp*, prj*, tsk\_)

### File Organization

- **shared/**: Reusable utilities and data models
- **frontend-components/**: UI components for specific features
- **app.js**: Main application entry point and event handling

### Function Patterns

- **Async/Await**: All database operations are async
- **Error Handling**: Try-catch blocks with descriptive error messages
- **Validation**: Validate before database operations
- **Return Values**: Functions return Promises resolving to data or void

### Documentation

- **JSDoc**: All functions have JSDoc comments with @param, @returns, @throws
- **Type Definitions**: Use JSDoc typedef for complex types
- **Module Comments**: @fileoverview at top of each file
- **Examples**: Include usage examples in JSDoc

### Validation

- **Validators Module**: All validation logic in `shared/validators.js`
- **Type Guards**: Use `isEmployee()`, `isProject()`, `isTask()` for runtime type checking
- **Error Messages**: Return `{valid: boolean, errors: string[]}` from validators
- **Pre-DB Validation**: Always validate before database operations

## API Integration

### Netlify Functions

- **Base URL**: `/.netlify/functions`
- **Endpoints**:
  - `/knowledge-query`: AI knowledge queries (requires LONGCAT_API_KEY environment variable)
  - `/project-data`: Project data operations
  - `/employee-data`: Employee data operations
  - `/task-data`: Task data operations

### Netlify Function Architecture

- **database-helper.js**: Shared utility for database operations across all function handlers
- **Pattern**: All data functions use `fetchFromDatabase(storeName, queryParams)` helper
- **Environment Variables**: LONGCAT_API_KEY required for knowledge-query function

### API Client

- **Configuration**: Timeout: 30000ms
- **Location**: `src/shared/apiClient.js`
- **Usage**: Initialize with config, then call methods

## Chat System

### Chat State Management

- **Storage Key**: `enosoft_chat_history`
- **Location**: `src/shared/chatStateManager.js`
- **Persistence**: localStorage for chat history
- **Initialization**: Default welcome message on first load

### Chat Components

- **chatInput.js**: Handles user input and message submission
- **chatMessage.js**: Displays individual messages
- **messageList.js**: Manages message list rendering

### Chat Features

- **Floating Action Button**: FAB button to open chat modal
- **Modal Interface**: Responsive chat modal with message list and input
- **Escape Key**: Closes modal on Escape key press
- **Overlay Click**: Closes modal when clicking overlay

## Development Workflow

### Running Locally

1. Open `index.html` in browser (no build step required)
2. Or use Netlify CLI: `netlify dev` (port 3000)
3. Data persists in browser IndexedDB

### Deployment

- **Platform**: Netlify
- **Build**: No build step (vanilla JS)
- **Publish Directory**: Root directory `.`
- **Functions Directory**: `netlify/functions`

### Making Changes

1. Edit JavaScript files in `src/`
2. Edit CSS in `css/` directory (edit component files, not main.css directly)
3. Edit HTML structure in `index.html`
4. Refresh browser to see changes
5. For Netlify Functions, edit in `netlify/functions/`

### CSS Development Workflow

- **Edit component styles**: Modify files in `css/components/` or `css/layouts/`
- **Edit design tokens**: Modify `css/shared/design-tokens.css`
- **Do not edit**: `css/main.css` (it only contains @import statements)
- **Import order**: Follow the dependency graph in main.css when adding new files

### Parallel Development Workflow

The `.parallel/` directory contains tooling for coordinating multiple AI workstreams on complex features:

**Structure**:

- `FEATURE.md`: Feature specification with workstream breakdown and dependencies
- `contracts/schema.json`: Contract definitions defining interfaces between workstreams
- `execution-order.json`: Dependency graph and execution order for workstreams
- `validation/`: Scripts for contract validation and pre-flight checks
- `prompts/`: AI prompts for individual workstreams (generated per feature)
- `workstreams/`: Individual workstream contexts and contracts (generated per feature)

**Usage**:

1. Define feature in `.parallel/FEATURE.md`
2. Specify contracts in `.parallel/contracts/schema.json`
3. Define execution order in `.parallel/execution-order.json`
4. Run validation scripts in `.parallel/validation/`
5. Open separate AI windows for each workstream
6. Execute workstreams in dependency order
7. Run integration validation after completion

**Purpose**: Enables parallel development of complex features by breaking them into independent workstreams with clear contracts and validation.

## Key Design Decisions

### Vanilla JavaScript Choice

- No framework dependencies for simplicity
- Direct DOM manipulation in app.js
- ES6 modules for code organization
- Modern browser features (IndexedDB, async/await)

### IndexedDB for Storage

- Client-side persistence without backend
- Offline capability
- Fast local data access
- Schema versioning support

### Modular Architecture

- Separation of concerns (shared vs frontend-components)
- Reusable utilities in shared/
- Component-based UI structure
- Clear data flow through database layer

### Validation Strategy

- Centralized validation in validators.js
- Type guards for runtime safety
- Pre-operation validation
- Descriptive error messages

## Common Patterns

### CSS Pattern - Design Token Usage

```css
.component {
  color: var(--color-text);
  background: var(--color-background);
  padding: var(--spacing-md);
  font-size: var(--text-base);
  transition: var(--transition-base);
  box-shadow: var(--shadow-md);
}
```

### CSS Pattern - Component Structure

```css
.component-name {
  /* Component base styles using tokens */
}

.component-name--modifier {
  /* Component variant styles */
}

.component-name__element {
  /* Component child element styles */
}
```

### Database Operation Pattern

```javascript
async function operationName(data) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.method(data);
      request.onsuccess = () => resolve(result);
      request.onerror = () => reject(new Error(`Error: ${request.error}`));
    });
  } catch (error) {
    throw new Error(`operationName error: ${error.message}`);
  }
}
```

### Validation Pattern

```javascript
function validateEntity(entity) {
  const errors = [];

  if (!entity || typeof entity !== "object") {
    return { valid: false, errors: ["Entity must be an object"] };
  }

  // Check required fields
  if (typeof entity.field !== "string") {
    errors.push("Field must be a string");
  }

  return { valid: errors.length === 0, errors };
}
```

### ID Generation Pattern

```javascript
generateId("emp"); // Returns 'emp_abc123def456'
generateId("prj"); // Returns 'prj_xyz789ghi012'
generateId("tsk"); // Returns 'tsk_jkl012mno345'
```

## Important Notes for AI Assistance

### When Working with CSS

- **Edit component files**: Modify files in `css/components/` or `css/layouts/`, not `css/main.css`
- **Use design tokens**: Always use CSS custom properties from `design-tokens.css`
- **Follow naming**: Use kebab-case and BEM-lite patterns (e.g., `btn-primary`, `modal-overlay`)
- **Import order**: When adding new CSS files, follow the dependency graph in `main.css`
- **Color system**: Use OKLCH colors via tokens, not hardcoded values
- **Accessibility**: Include focus rings and ARIA labels for interactive elements

### When Working with Database Operations

- Always use functions from `shared/database.js`
- Never directly access IndexedDB
- Validate data before database operations
- Handle errors with try-catch blocks
- Use proper transaction scopes

### When Working with UI Components

- Main UI logic is in `app.js`
- Chat components are in `frontend-components/`
- Use data attributes for event handling (e.g., `data-action="edit"`)
- Modal system uses overlay pattern
- Notification system for user feedback

### When Working with Data Models

- All type definitions in `shared/models.js`
- All validators in `shared/validators.js`
- Follow ID patterns strictly
- Respect field length limits
- Use proper enum values for status fields

### When Working with Chat System

- Chat state managed by `chatStateManager.js`
- History persisted in localStorage
- Components initialized lazily on modal open
- API calls go through Netlify Functions

## Security Considerations

- No sensitive data in client-side code
- IndexedDB data is local to browser
- API endpoints on Netlify Functions
- No hardcoded credentials
- Input validation on all user data

## Testing

Currently no automated test suite. Manual testing involves:

1. Opening application in browser
2. Testing CRUD operations for all entities
3. Testing assignment/removal operations
4. Testing chat functionality
5. Verifying data persistence across page reloads

## Known Limitations

- No backend database (data is local only)
- No user authentication
- No data synchronization across devices
- Limited to single browser instance
- No automated testing
- No error logging beyond console

## Future Enhancements

Potential areas for improvement:

- Backend database integration
- User authentication and authorization
- Data synchronization across devices
- Automated testing suite
- Error logging and monitoring
- Advanced search and filtering
- Export/import functionality
- Real-time updates

---

_Last Updated: 2026-04-17_
_Version: 1.1.0_
_Project: Enosoft Project Management System_

## Changelog

### 2026-04-17 — v1.1.0

**Full Scan - CSS Architecture Refactor**

**Added:**

- CSS Architecture section with design system documentation
- Design tokens documentation (OKLCH color system, spacing, typography, shadows, transitions)
- CSS component library documentation (9 components, 4 layouts, 4 shared utilities)
- CSS conventions (naming, BEM-lite, variables, responsive, accessibility)
- CSS development workflow guidance
- Parallel Development Workflow section (.parallel directory documentation)
- Netlify Function Architecture section (database-helper.js pattern)
- CSS patterns to Common Patterns section
- CSS guidance to Important Notes for AI Assistance

**Updated:**

- Project Structure: Replaced monolithic styles.css with modular css/ directory structure
- Project Structure: Added .parallel/ directory for parallel development workflow
- Project Structure: Updated netlify/functions/ to list all 5 function files
- API Integration: Added LONGCAT_API_KEY environment variable documentation
- API Integration: Added database-helper.js pattern documentation
- Development Workflow: Replaced styles.css references with css/ directory guidance
- Development Workflow: Added CSS Development Workflow subsection

**Removed:**

- References to monolithic styles.css (replaced with modular architecture)

### 2026-04-16 — v1.0.0

**Initial Context File Creation**

- Established baseline documentation for project structure, entities, database schema, coding conventions, and development workflow
