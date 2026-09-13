---
name: accessibility
description: Build accessible frontend interfaces using semantic HTML, keyboard navigation, focus management, labels, ARIA, contrast, and inclusive interaction patterns.
---

# Accessibility Skill

## Purpose

Build interfaces that are usable by keyboard users, screen readers, users with visual limitations, and users with different interaction needs.

## Semantic HTML

Prefer semantic elements.

Use:

```html
<header>
  <nav>
    <main>
      <section>
        <article>
          <footer>
            <button>
              <form>
                <label></label>
              </form>
            </button>
          </footer>
        </article>
      </section>
    </main>
  </nav>
</header>
```

Avoid using:

```html
<div onclick=""></div>
```

when a semantic interactive element is appropriate.

## Buttons

Use:

```html
<button></button>
```

for actions.

Use:

```html
<a></a>
```

for navigation.

Do not confuse actions and navigation.

## Forms

Every form field must have an accessible label.

Prefer:

```tsx
<Label htmlFor="email">
  Email
</Label>

<Input id="email" />
```

Validation errors must be understandable.

## Keyboard Navigation

All interactive elements must be keyboard accessible.

Check:

```text
Tab
Shift + Tab
Enter
Space
Escape
Arrow keys where appropriate
```

## Focus

Never remove focus indicators without replacing them.

Provide clear:

```text
focus-visible
```

styles.

## ARIA

Use ARIA only when semantic HTML is insufficient.

Do not add unnecessary ARIA attributes.

Examples:

```text
aria-label
aria-describedby
aria-expanded
aria-controls
aria-live
```

## Dialogs

Dialogs must:

- Have accessible names
- Trap focus appropriately
- Restore focus
- Support Escape
- Prevent inaccessible background interaction

Use established dialog components when available.

## Images

Informative images require meaningful alt text.

Decorative images should use:

```text
alt=""
```

when appropriate.

Do not put unnecessary information into alt text.

## Color

Never communicate information through color alone.

Bad:

```text
Green = success
Red = error
```

without additional indication.

Use:

- Text
- Icons
- Labels
- Appropriate semantics

## Contrast

Ensure readable contrast between foreground and background.

Check:

- Text
- Buttons
- Borders
- Placeholder text
- Focus indicators

## Motion

Respect reduced-motion preferences.

Avoid excessive animation.

Prefer meaningful transitions.

## Error Messages

Errors must:

- Identify the problem
- Explain what needs to change
- Be associated with the relevant field where appropriate

## Accessibility Review

Before completion inspect:

- Semantic HTML
- Keyboard navigation
- Focus states
- Labels
- ARIA
- Contrast
- Error messages
- Dialog behavior
- Reduced motion
- Screen-reader semantics

Accessibility is a requirement, not an optional enhancement.
