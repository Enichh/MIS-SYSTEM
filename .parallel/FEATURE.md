# AI Chatbot with Employee Data Access and Netlify Deployment

## Feature Overview
Add an AI-powered chatbot to the MIS (Management Information System) webapp that:
- Provides conversational access to employee data from IndexedDB
- Uses LONGCAT API for AI responses
- Features a Floating Action Button (FAB) for easy chat access
- Deploys seamlessly to Netlify with proper configuration

## Technical Stack
- **Frontend**: Vanilla JavaScript with ES modules
- **Database**: IndexedDB (existing employee database)
- **AI API**: LONGCAT API for chat responses
- **Deployment**: Netlify with environment variable support
- **Storage**: localStorage for chat history persistence

## Workstreams

### 1. Shared Workstream (Foundation)
**Must complete first** - Provides API client, state management, and deployment config

**Exports:**
- `longcatApiClient` - LONGCAT API integration function
- `queryEmployeeData` - Employee database query function
- `ChatStateManager` - Chat state management class
- `initializeChatState` - State manager initialization function
- `LONGCAT_API_BASE_URL` - API endpoint constant
- `CHAT_STORAGE_KEY` - localStorage key constant
- `netlifyConfig` - Netlify deployment configuration

**Tasks:**
1. Create LONGCAT API client and employee data query functions
2. Implement ChatStateManager class with localStorage persistence
3. Create Netlify configuration and constants

### 2. Frontend-Layout Workstream
**Dependencies:** Shared (must complete first)

**Exports:**
- `fabButton` - Floating Action Button component (bottom-right)
- `chatModalLayout` - Chat modal layout with responsive design
- `responsiveContainer` - Responsive container for chat interface

**Tasks:**
1. Create FAB button component (fixed bottom-right with chat icon)
2. Design chat modal layout with responsive design
3. Create responsive container for chat interface

### 3. Frontend-Components Workstream
**Dependencies:** Shared (must complete first)

**Imports from Shared:**
- `longcatApiClient`
- `queryEmployeeData`
- `ChatStateManager`

**Exports:**
- `chatMessage` - Individual message component
- `messageList` - Message history component with auto-scroll
- `chatInput` - Chat input component with API integration

**Tasks:**
1. Create chat message component (user/AI differentiation)
2. Create message list component (history display with auto-scroll)
3. Create chat input component (send to LONGCAT API with employee context)

## Contract Schema
See `.parallel/contracts/schema.json` for the complete contract definition including:
- Export specifications with types
- Schema definitions for each export
- Import relationships between workstreams
- File naming conventions

## Deployment Configuration
The Netlify configuration will include:
- Build command for static site generation
- Publish directory specification
- Environment variable support for LONGCAT API key
- ES module support headers
- Redirect rules for single-page app routing

## Execution Order
1. **Shared workstream** - Complete first (provides foundation)
2. **Frontend-layout and Frontend-components** - Execute in parallel after shared completes
3. **Integration validation** - Run after all workstreams complete

## Validation
All workstreams include validation scripts to ensure:
- Contract compliance (exports match schema)
- No naming collisions between workstreams
- Proper import relationships
- Shared workstream completeness (foundation validation)

Run `.parallel/validation/pre-flight-check.bat` before starting parallel execution.
