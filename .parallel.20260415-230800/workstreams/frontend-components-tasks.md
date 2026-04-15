# Workstream: Frontend-Components

## Contract Version: 1.0.0

## Dependencies: Shared (design system must be complete first)

### Task 1: Modernize Card Components

**Contract References:** `schema.json#/contracts/frontend-components/exports/data-card`
**Acceptance Criteria:**

- [ ] Update .data-card to use new design tokens (colors, shadows, spacing, typography)
- [ ] Implement subtle hover effects with shadow-lg and transform
- [ ] Add border-radius (8px) for modern appearance
- [ ] Use background-secondary with border-light for subtle contrast
- [ ] Ensure card-header, card-body, and card-actions use consistent spacing
      **Validation:** Check cards use only design token variables, no hardcoded values

### Task 2: Enhance Button Design and States

**Contract References:** `schema.json#/contracts/frontend-components/exports/btn-primary`, `schema.json#/contracts/frontend-components/exports/btn-secondary`, `schema.json#/contracts/frontend-components/exports/btn-danger`
**Acceptance Criteria:**

- [ ] Redesign .btn-primary with primary color, proper padding (0.75rem 1.5rem), and border-radius (6px)
- [ ] Update .btn-secondary with background-surface and border-light
- [ ] Modernize .btn-danger with error color and subtle hover state
- [ ] Add focus-ring on focus state for accessibility
- [ ] Implement smooth transitions using transition-base
- [ ] Include hover, active, and disabled states
      **Validation:** Test button states with keyboard and mouse

### Task 3: Improve Form, Modal, and Notification Components

**Contract References:** `schema.json#/contracts/frontend-components/exports/form-group`, `schema.json#/contracts/frontend-components/exports/form-input`, `schema.json#/contracts/frontend-components/exports/modal-overlay`, `schema.json#/contracts/frontend-components/exports/notification-toast`
**Acceptance Criteria:**

- [ ] Update .form-group labels with proper font-weight (600) and text-sm
- [ ] Redesign form inputs with background, border-light, and focus-ring on focus
- [ ] Add proper padding (0.75rem) and border-radius (6px)
- [ ] Ensure select dropdowns have cursor pointer and proper styling
- [ ] Style textarea with min-height (100px) and resize: vertical
- [ ] Add error states with red border and error message
- [ ] Update .modal-overlay with proper backdrop blur and rgba background
- [ ] Redesign .modal with background-secondary, border-radius (12px), and shadow-xl
- [ ] Enhance .notification with proper positioning, shadow-lg, and border-radius
- [ ] Add success, error, and warning variants with semantic colors
- [ ] Implement slide-in animations using transition-slow
- [ ] Ensure modals trap focus and are dismissible with Escape key
      **Validation:** Test form navigation with Tab key, screen reader, and modal keyboard navigation

## Pre-Completion Checklist

- [ ] All components reference design token variables from shared
- [ ] No hardcoded colors, spacing, or typography values
- [ ] Focus states visible and accessible via keyboard
- [ ] Hover states smooth and predictable
- [ ] Run validation: Check component CSS for any legacy values
