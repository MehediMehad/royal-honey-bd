---
name: visual-qa
description: Visually inspect frontend applications in the browser, identify UI defects, compare implementation against requirements, and fix layout, styling, responsive, and interaction issues.
---

# Visual QA Skill

## Purpose

Verify that the implemented UI actually looks and behaves correctly in a real browser.

Do not assume the code is correct simply because it compiles.

## QA Process

Follow:

```text
Open application
↓
Navigate to target page
↓
Inspect desktop
↓
Inspect tablet
↓
Inspect mobile
↓
Test interactions
↓
Identify defects
↓
Fix defects
↓
Re-test
```

## Visual Inspection

Check:

### Layout

- Alignment
- Container width
- Spacing
- Section height
- Grid behavior
- Content density

### Typography

- Font size
- Font weight
- Line height
- Text wrapping
- Heading hierarchy

### Components

Check:

- Buttons
- Inputs
- Cards
- Dialogs
- Dropdowns
- Tabs
- Navigation
- Footer

### States

Check:

```text
default
hover
focus
active
disabled
loading
empty
error
success
```

## Responsive QA

Inspect:

```text
320px
375px
390px
768px
1024px
1440px
```

Look for:

- Horizontal overflow
- Broken grids
- Text clipping
- Overlapping elements
- Incorrect spacing
- Broken navigation

## Interaction QA

Test:

- Navigation
- Buttons
- Forms
- Dropdowns
- Modals
- Tabs
- Pagination
- Links
- Mobile menu

## Console

Inspect browser console for:

- Errors
- Warnings
- Hydration issues
- Failed requests

Fix real issues instead of ignoring warnings.

## Network

When relevant, inspect:

- Failed API requests
- 404 assets
- Slow requests
- Duplicate requests

## Fix Strategy

Prioritize:

```text
Critical functional issues
↓
Layout-breaking issues
↓
Responsive issues
↓
Accessibility issues
↓
Visual inconsistencies
↓
Minor polish
```

## Final Requirement

Never report a UI task as complete until the browser has been used to verify the implementation.
