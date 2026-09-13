---
name: performance-optimization
description: Optimize frontend performance, loading speed, rendering, images, JavaScript, network requests, caching, and Core Web Vitals without sacrificing maintainability.
---

# Performance Optimization Skill

## Purpose

Build fast applications with efficient rendering, loading, networking, and asset usage.

## First Rule

Do not optimize blindly.

First identify the actual bottleneck.

## JavaScript

Avoid unnecessary JavaScript.

Prefer Server Components where possible.

Do not make a component Client Component without a reason.

Avoid unnecessary:

```text
useEffect
useMemo
useCallback
state
event listeners
```

Optimization should be evidence-based.

## Bundle Size

Avoid unnecessary dependencies.

Before installing a package:

1. Check whether the project already has an equivalent.
2. Check whether native functionality is sufficient.
3. Consider bundle impact.

## Images

Use optimized image handling.

Consider:

- Correct dimensions
- Appropriate formats
- Lazy loading
- Responsive images
- Priority loading only when justified

Do not load huge images for small UI elements.

## Fonts

Avoid loading unnecessary font variants.

Only load required:

```text
families
weights
styles
```

## Rendering

Prefer:

```text
Server rendering
Streaming
Static rendering
```

when appropriate.

Do not force dynamic rendering without a requirement.

## Data Fetching

Avoid duplicate requests.

Check:

- Request waterfalls
- Duplicate API calls
- Unnecessary polling
- Over-fetching
- Client-side requests that can happen on the server

## Caching

Use caching and revalidation intentionally.

Do not cache user-specific or sensitive data incorrectly.

## Lazy Loading

Lazy-load expensive functionality when appropriate.

Examples:

```text
Large modals
Charts
Editors
Maps
Heavy client libraries
```

## Core Web Vitals

Pay attention to:

```text
LCP
INP
CLS
```

Investigate:

### LCP

- Large images
- Slow server response
- Render-blocking resources
- Excessive client-side rendering

### INP

- Heavy JavaScript
- Expensive event handlers
- Large client components

### CLS

- Images without dimensions
- Dynamic content
- Layout shifts
- Late-loading fonts

## Browser Verification

After optimization:

1. Test initial load.
2. Test navigation.
3. Test slow network where appropriate.
4. Inspect console.
5. Check unnecessary requests.
6. Check visual stability.
7. Verify functionality has not changed.

## Rule

Never sacrifice:

- Accessibility
- Correctness
- Maintainability

for micro-optimizations.
