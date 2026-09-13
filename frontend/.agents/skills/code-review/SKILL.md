---
name: code-review
description: Perform production-grade frontend code reviews focusing on architecture, correctness, maintainability, TypeScript, React, Next.js, performance, accessibility, and unnecessary complexity.
---

# Code Review Skill

## Purpose

Review code as a senior frontend engineer.

Do not focus only on formatting.

## Review Categories

Review:

```text
Correctness
Architecture
Maintainability
TypeScript
React
Next.js
Performance
Accessibility
Security
Testing
Error Handling
Dependencies
```

## Severity

Classify findings:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

## Correctness

Check:

- Incorrect state handling
- Race conditions
- Broken edge cases
- Incorrect conditional rendering
- Missing error handling
- Incorrect async behavior

## React

Check:

- Unnecessary Client Components
- Incorrect effects
- State duplication
- Unnecessary re-renders
- Missing keys
- Component responsibility

Avoid unnecessary:

```text
useEffect
useMemo
useCallback
```

## Next.js

Check:

- Server vs Client Components
- Data fetching
- Routing
- Metadata
- Loading states
- Error boundaries
- Image optimization

## TypeScript

Look for:

```text
any
unsafe casts
duplicate types
weak typing
nullable mistakes
```

Prefer precise types.

## Architecture

Check:

- Component boundaries
- Reusability
- Feature organization
- Separation of concerns
- Business logic placement

## Accessibility

Check:

- Semantic HTML
- Labels
- Keyboard navigation
- Focus
- ARIA
- Contrast

## Performance

Check:

- Large client components
- Heavy dependencies
- Duplicate requests
- Large images
- Unnecessary rendering
- Bundle size risks

## Security

Check:

- Unsafe HTML
- Client-side secrets
- Sensitive data exposure
- Unsafe URL handling
- Insecure local storage usage

## Review Output

Return:

```text
Summary

CRITICAL
- issue
- impact
- recommendation

HIGH
- issue
- impact
- recommendation

MEDIUM
...

LOW
...

Positive Findings
- ...

Recommended Next Steps
1. ...
2. ...
3. ...
```

Do not rewrite large sections of code unless explicitly requested.

Prioritize actionable findings.
