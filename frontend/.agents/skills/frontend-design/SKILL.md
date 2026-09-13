---
name: frontend-design
description: Build modern, polished, production-quality frontend interfaces with strong visual hierarchy, intentional UX, consistent spacing, and non-generic design decisions.
---

# Frontend Design Skill

## Purpose

Build high-quality frontend interfaces that feel intentionally designed rather than AI-generated or template-like.

The UI must prioritize:

- Visual hierarchy
- Clarity
- Usability
- Consistency
- Accessibility
- Responsiveness
- Maintainability
- Production readiness

## Core Principles

### 1. Avoid Generic AI UI

Do not automatically create:

- Excessive gradients
- Random glassmorphism
- Huge rounded cards everywhere
- Excessive shadows
- Unnecessary animations
- Generic dashboard layouts
- Repetitive card grids
- Random colors
- Decorative elements without purpose

Every visual decision must have a reason.

### 2. Visual Hierarchy

Clearly distinguish:

- Primary heading
- Supporting text
- Primary CTA
- Secondary CTA
- Important information
- Supporting information

Users should understand the page purpose within seconds.

### 3. Layout

Prefer:

- Clear content width
- Consistent horizontal alignment
- Predictable spacing
- Strong section separation
- Responsive grids
- Intentional whitespace

Avoid:

- Random margins
- Arbitrary positioning
- Excessive empty space
- Overcrowded layouts
- Fixed-width layouts that break on smaller screens

### 4. Typography

Use a consistent typography hierarchy.

Typical hierarchy:

- Display heading
- Page heading
- Section heading
- Card heading
- Body text
- Supporting text
- Caption

Do not use many unrelated font sizes.

### 5. Color

Use a controlled color palette.

Define:

- Primary
- Secondary
- Background
- Surface
- Border
- Foreground
- Muted foreground
- Success
- Warning
- Destructive

Do not introduce new colors casually.

### 6. Spacing

Prefer a consistent spacing system.

Use Tailwind spacing utilities instead of arbitrary values unless there is a real design requirement.

Avoid excessive use of:

```text
mt-[37px]
px-[19px]
gap-[13px]
```

Prefer the project's existing spacing scale.

### 7. Components

Prefer reusable components.

Examples:

```text
Button
Input
Card
Modal
Dialog
Dropdown
Badge
Tabs
Table
Pagination
EmptyState
LoadingState
ErrorState
```

Do not duplicate identical UI structures.

### 8. User States

Every interactive feature should consider:

- Loading
- Empty
- Success
- Error
- Disabled
- Hover
- Focus
- Active
- Mobile

### 9. Interaction

Interactive elements should provide clear feedback.

Use:

- Hover states
- Focus states
- Loading indicators
- Disabled states
- Appropriate transitions

Do not animate everything.

### 10. Forms

Forms must have:

- Clear labels
- Useful placeholders
- Validation feedback
- Loading state
- Error state
- Success feedback where appropriate

## Implementation Rules

Before creating new components:

1. Inspect existing components.
2. Reuse existing components where possible.
3. Follow existing naming conventions.
4. Follow existing design tokens.
5. Avoid introducing unnecessary dependencies.

## Before Finishing

Check:

- Visual hierarchy
- Typography consistency
- Spacing consistency
- Component reuse
- Responsive behavior
- Accessibility
- Loading states
- Empty states
- Error states
- Visual consistency

The final UI should look like a deliberate product design, not a collection of generated components.
