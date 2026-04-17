# MIS SYSTEM - Project Management System

## Project Structure

This project follows a modular architecture with clear separation of concerns:

```
src/
├── app/                    # Application entry point and global setup
│   ├── app.js             # Main application initialization and routing
│   ├── router.js          # Navigation logic between sections
│   ├── providers.js       # Theme and chat initialization
│   └── global-styles.js   # Global CSS imports
├── features/              # Feature-specific modules
│   ├── employees/         # Employee management feature
│   │   ├── components/    # Employee UI components
│   │   ├── services/      # Employee business logic
│   │   ├── types/         # Employee type definitions
│   │   └── index.js       # Public API exports
│   ├── projects/          # Project management feature
│   │   ├── components/    # Project UI components
│   │   ├── services/      # Project business logic
│   │   ├── types/         # Project type definitions
│   │   └── index.js       # Public API exports
│   ├── tasks/             # Task management feature
│   │   ├── components/    # Task UI components
│   │   ├── services/      # Task business logic
│   │   ├── types/         # Task type definitions
│   │   └── index.js       # Public API exports
│   └── chat/              # Chat assistant feature
│       ├── components/    # Chat UI components
│       ├── services/      # Chat business logic
│       ├── types/         # Chat type definitions
│       └── index.js       # Public API exports
└── shared/                # Shared utilities and services
    ├── components/        # Design system components (button, card, modal, form)
    ├── services/          # Global services (database, API client, validators)
    ├── utils/             # Pure utility functions (models, chat state manager)
    └── constants.js       # Global constants

css/                       # Stylesheets (legacy structure)
├── components/            # Component-specific styles
├── layouts/               # Layout-specific styles
├── shared/                # Shared styles (reset, base, utilities)
└── main.css               # Main CSS entry point
```

## Architecture Principles

1. **Single Responsibility**: Each module has one clear purpose
2. **Feature-Based Organization**: Features are self-contained with their own components, services, and types
3. **Shared Foundation**: Common utilities and components are in the shared directory
4. **Clear Contracts**: Each feature exports a public API through index.js
5. **Dependency Management**: Features depend on shared services, not on each other

## Entry Point

The application initializes at `src/app/app.js` which:
- Initializes theme manager
- Opens database connection
- Initializes API client
- Renders all features (employees, projects, tasks)
- Sets up navigation and event listeners
- Initializes chat state

## Features

### Employees
- Create, read, update, delete employees
- Assign employees to projects and tasks
- Track work type (onsite/remote)

### Projects
- Create, read, update, delete projects
- Assign employees to projects
- Track project status (active, completed, archived)

### Tasks
- Create, read, update, delete tasks
- Assign tasks to projects
- Assign employees to tasks
- Track task status (pending, in-progress, completed)

### Chat
- AI-powered chat assistant
- Chat history management
- Knowledge base integration

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+ modules)
- **Database**: IndexedDB
- **Styling**: CSS with component-based organization
- **API**: Netlify Functions for backend services

## Development

To run the application locally:
1. Serve the project directory using a local server
2. Open index.html in a browser
3. The application will initialize automatically

## Migration Notes

This project has undergone a UI architecture migration to improve modularity and maintainability. The migration moved from a monolithic structure to a feature-based architecture with clear separation of concerns.
