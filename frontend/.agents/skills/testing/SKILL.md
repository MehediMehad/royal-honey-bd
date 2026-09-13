---
name: testing
description: Design and implement reliable frontend tests covering components, user interactions, validation, critical workflows, and regression scenarios.
---

# Testing Skill

## Purpose

Create tests that protect important application behavior without producing unnecessary brittle tests.

## Testing Philosophy

Test behavior, not implementation details.

Prefer:

```text
What does the user experience?
```

over:

```text
Which internal function was called?
```

## Test Priority

Prioritize:

1. Critical business flows
2. Authentication
3. Payments
4. Forms
5. Navigation
6. Data mutations
7. Error handling
8. Important reusable components

## Unit Tests

Use unit tests for:

- Pure functions
- Utility functions
- Validation logic
- Data transformation

## Component Tests

Test:

- Rendering
- User interaction
- Validation
- Loading states
- Error states
- Accessibility behavior

## Integration Tests

Test workflows involving multiple components.

Examples:

```text
Login
Course enrollment
Checkout
Profile update
Search
Filtering
Pagination
```

## E2E Tests

Use end-to-end tests for critical real-user journeys.

Example:

```text
Visit website
→ Login
→ Browse courses
→ Open course
→ Enroll
→ Checkout
→ Verify success
```

## Forms

Test:

- Empty input
- Invalid input
- Valid input
- Loading
- Server error
- Successful submission

## Error Handling

Test expected failure scenarios.

Examples:

```text
401
403
404
409
422
500
network failure
```

## Accessibility

Where testing tools support it, include accessibility checks.

## Avoid Brittle Tests

Avoid relying heavily on:

- CSS classes
- DOM structure
- Internal implementation details
- Exact generated IDs

Prefer accessible selectors:

```text
role
label
text
placeholder
```

## Before Completion

Run:

```text
typecheck
lint
unit tests
integration tests
E2E tests
```

where configured and appropriate.

Do not modify tests merely to make failing behavior appear correct.

First determine whether the implementation or the test is wrong.
