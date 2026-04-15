# Workstream: Shared - Design System Foundation
## Contract Version: 1.0.0
## Dependencies: None (must execute first)

### Task 1: Define Modern Color Palette Using OKLCH
**Contract References:** `schema.json#/contracts/shared/exports/css_variables`
**Acceptance Criteria:**
- [ ] Replace aggressive red/black theme with professional indigo/slate OKLCH colors
- [ ] Define primary, background, text, border, and semantic colors (success, error, warning, info)
- [ ] Use oklch() color function for perceptually uniform colors
- [ ] Include hover states and light variants
- [ ] All color variables use semantic naming (e.g., --color-primary, not --red)
**Validation:** Verify color contrast ratios meet WCAG AA standards

### Task 2: Implement Spacing and Typography Systems
**Contract References:** `schema.json#/contracts/shared/exports/spacing_scale`, `schema.json#/contracts/shared/exports/typography_scale`
**Acceptance Criteria:**
- [ ] Create 6-step spacing scale based on 8px grid (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px)
- [ ] Define 7-step typography scale (xs: 12px, sm: 14px, base: 16px, lg: 18px, xl: 20px, 2xl: 24px, 3xl: 30px)
- [ ] Include font weights (regular: 400, medium: 500, semibold: 600, bold: 700)
- [ ] Set line heights for optimal readability (1.5 for body, 1.25 for headings)
- [ ] Use modern font stack: ui-sans-serif, system-ui, sans-serif
**Validation:** Check spacing consistency across existing CSS

### Task 3: Define Shadow, Transition, and Focus Systems
**Contract References:** `schema.json#/contracts/shared/exports/css_variables`
**Acceptance Criteria:**
- [ ] Create 4 shadow levels (sm, md, lg, xl) using rgba for transparency
- [ ] Define 3 transition timings (fast: 150ms, base: 200ms, slow: 300ms) with cubic-bezier easing
- [ ] Implement focus-ring for accessibility (3px ring with primary color at 30% opacity)
- [ ] Add elevation system for depth hierarchy
- [ ] Ensure all animations respect prefers-reduced-motion media query
**Validation:** Test focus states with keyboard navigation

## Pre-Completion Checklist
- [ ] All CSS custom properties defined in :root selector
- [ ] No hardcoded color values remain in styles.css
- [ ] Design tokens documented with comments
- [ ] Color contrast ratios verified (minimum 4.5:1 for normal text)
- [ ] Run validation: Check styles.css for any remaining legacy color values
