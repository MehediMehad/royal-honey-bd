---
name: responsive-design
description: Build and validate mobile-first responsive interfaces across phones, tablets, laptops, desktops, and large screens without overflow or layout breakage.
---

# Responsive Design Skill

## Purpose

Ensure every interface works correctly across different viewport sizes.

## Approach

Use mobile-first design.

Start with the smallest practical layout and progressively enhance for larger screens.

## Target Viewports

Verify at minimum:

```text
320px
375px
390px
768px
1024px
1280px
1440px
1920px
```

## Layout Rules

Prefer:

```text
max-width
width: 100%
flex
grid
minmax()
responsive spacing
responsive typography
```

Avoid unnecessary:

```text
fixed widths
fixed heights
absolute positioning
```

## Containers

Use consistent content containers.

Example:

```text
w-full
max-w-7xl
mx-auto
px-4
sm:px-6
lg:px-8
```

Follow the project's existing container conventions.

## Grid

Use responsive grids.

Example:

```text
grid-cols-1
md:grid-cols-2
lg:grid-cols-3
xl:grid-cols-4
```

Do not force a desktop grid onto mobile.

## Typography

Text must remain readable.

Check:

- Heading wrapping
- Paragraph width
- Button text
- Navigation labels
- Card titles

Avoid text clipping.

## Images

Images must:

- Scale correctly
- Maintain aspect ratio
- Avoid overflow
- Use appropriate object-fit behavior

## Navigation

Mobile navigation should not simply shrink desktop navigation.

Use an appropriate mobile pattern:

```text
Menu button
Drawer
Sheet
Dropdown
```

## Touch Targets

Interactive elements should be comfortably tappable.

Avoid tiny buttons or links.

## Horizontal Overflow

Never allow accidental horizontal scrolling.

Check:

```text
long text
tables
images
buttons
navigation
code blocks
cards
forms
```

## Tables

Tables should have an intentional mobile strategy.

Possible approaches:

```text
horizontal scroll
responsive columns
card transformation
```

Do not let tables break the entire page.

## Modals

Dialogs should work on small screens.

Check:

- Width
- Height
- Scroll behavior
- Close controls
- Keyboard interaction

## Testing

After implementation:

1. Open browser.
2. Test mobile.
3. Test tablet.
4. Test desktop.
5. Look for overflow.
6. Check text wrapping.
7. Check spacing.
8. Check interactive elements.
9. Fix issues.
10. Re-test.

## Final Requirement

A responsive UI is not complete until it has been visually verified at multiple viewport sizes.
