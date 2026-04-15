# Workstream: Frontend-Layout
## Contract Version: 1.0.0
## Dependencies: Shared (design system must be complete first)

### Task 1: Redesign Header and Navigation
**Contract References:** `schema.json#/contracts/frontend-layout/exports/header-component`, `schema.json#/contracts/frontend-layout/exports/navigation-component`
**Acceptance Criteria:**
- [ ] Update header with background-secondary and border-bottom using border-light
- [ ] Redesign h1 with text-3xl, font-weight 700, and proper letter-spacing
- [ ] Modernize nav with background-tertiary and proper padding (1rem)
- [ ] Update .nav-btn with background-surface, border-light, and spacing-md
- [ ] Implement active state with primary background and white text
- [ ] Add hover effects with shadow-md and transform
- [ ] Ensure navigation is keyboard accessible with focus-ring
**Validation:** Test navigation with Tab key and screen reader

### Task 2: Improve Main Content Layout
**Contract References:** `schema.json#/contracts/frontend-layout/exports/main-content-area`, `schema.json#/contracts/frontend-layout/exports/responsive-grid`
**Acceptance Criteria:**
- [ ] Update main with max-width (1400px) and proper padding (2rem)
- [ ] Redesign .section-header with flex layout, proper spacing, and border-bottom
- [ ] Update section h2 with text-2xl and primary color
- [ ] Implement responsive grid for .data-list (1 column mobile, 2 tablet, 3 desktop)
- [ ] Add proper gap (1rem) between grid items
- [ ] Ensure content flows naturally on mobile devices
**Validation:** Test layout at viewport widths: 320px, 768px, 1024px, 1400px

### Task 3: Enhance Modal and Notification Components
**Contract References:** `schema.json#/contracts/frontend-components/exports/modal-overlay`, `schema.json#/contracts/frontend-components/exports/modal-container`, `schema.json#/contracts/frontend-components/exports/notification-toast`
**Acceptance Criteria:**
- [ ] Update .modal-overlay with proper backdrop blur and rgba background
- [ ] Redesign .modal with background-secondary, border-radius (12px), and shadow-xl
- [ ] Update .modal-header with proper padding and border-bottom
- [ ] Enhance .notification with proper positioning, shadow-lg, and border-radius
- [ ] Add success, error, and warning variants with semantic colors
- [ ] Implement slide-in animations using transition-slow
- [ ] Ensure modals trap focus and are dismissible with Escape key
**Validation:** Test modal keyboard navigation and focus management

## Pre-Completion Checklist
- [ ] All layout components reference design token variables from shared
- [ ] Responsive breakpoints tested across device sizes
- [ ] Focus management implemented for modals
- [ ] Keyboard navigation works throughout interface
- [ ] Run validation: Check layout CSS for any legacy values
