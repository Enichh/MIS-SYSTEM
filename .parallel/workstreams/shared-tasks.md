# Workstream: Shared - API Client, State Management, and Netlify Config
## Contract Version: 1.0.0
## Dependencies: None (must execute first)

### Task 1: Create LONGCAT API Client and Employee Data Query
**Contract References:** `schema.json#/contracts/shared/exports/functions/longcatApiClient`, `schema.json#/contracts/shared/exports/functions/queryEmployeeData`
**Acceptance Criteria:**
- [ ] Create `longcatApiClient` function that accepts apiKey, message, and context parameters
- [ ] Implement proper error handling and timeout handling for API calls
- [ ] Create `queryEmployeeData` function that searches IndexedDB employee store
- [ ] Both functions return Promise with proper typing and error messages
- [ ] Add JSDoc documentation with @example for both functions
**Validation:** Test API client with mock LONGCAT endpoint, verify employee query returns correct data

### Task 2: Implement Chat State Manager
**Contract References:** `schema.json#/contracts/shared/exports/classes/ChatStateManager`
**Acceptance Criteria:**
- [ ] Create ChatStateManager class with methods: addMessage, getHistory, clearHistory, persistToStorage
- [ ] Implement localStorage persistence for chat history
- [ ] Add message timestamp and unique ID generation
- [ ] Include methods for loading history from storage on initialization
- [ ] Add JSDoc documentation for all methods
**Validation:** Test state persistence across page reloads, verify message ordering

### Task 3: Create Netlify Configuration and Constants
**Contract References:** `schema.json#/contracts/shared/exports/config/netlifyConfig`, `schema.json#/contracts/shared/exports/constants`
**Acceptance Criteria:**
- [ ] Create netlify.toml configuration file with build command and publish directory
- [ ] Define LONGCAT_API_BASE_URL constant (use Netlify environment variable)
- [ ] Define CHAT_STORAGE_KEY constant for localStorage
- [ ] Configure proper headers for ES module support in netlify.toml
- [ ] Add redirect rules if needed for single-page app routing
**Validation:** Verify netlify.toml syntax, test environment variable access

## Pre-Completion Checklist
- [ ] All exports match schema.json exactly
- [ ] Functions have proper error handling
- [ ] JSDoc documentation complete with examples
- [ ] Netlify configuration validates with Netlify CLI
- [ ] Run validation: Check all exports are importable
