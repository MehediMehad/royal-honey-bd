---
name: nextjs-best-practices
description: Build scalable Next.js applications using modern App Router architecture, Server Components, TypeScript, proper data fetching, routing, metadata, caching, and project structure.
---

# Next.js Best Practices

## Purpose

Build maintainable, scalable and production-ready Next.js applications.

## Architecture

Use the App Router.

Prefer:

```text
app/
components/
lib/
hooks/
services/
types/
schemas/
config/
```

Keep responsibilities separated.

## Server Components

Prefer Server Components by default.

Do not add:

```tsx
"use client";
```

unless required.

Use Client Components only when needing:

- Browser APIs
- React state
- Event handlers
- Effects
- Interactive UI
- Client-only libraries

## Client Boundary

Keep Client Components as small as possible.

Avoid making entire pages Client Components unnecessarily.

Prefer:

```text
Server Page
   ↓
Server Components
   ↓
Small Client Component
```

instead of:

```text
Client Page
   ↓
Everything client-side
```

## Data Fetching

Choose the appropriate data-fetching strategy based on requirements.

Consider:

- Server-side fetching
- Client-side fetching
- Streaming
- Caching
- Revalidation

Do not fetch data from an internal API route from a Server Component when direct server-side access is possible.

## Routing

Use clear route organization.

Examples:

```text
app/
├── (marketing)/
├── dashboard/
├── courses/
├── checkout/
└── auth/
```

Use route groups when they improve organization without affecting URLs.

## Loading UI

Use:

```text
loading.tsx
```

for meaningful loading boundaries.

Use skeleton components for content-heavy sections.

## Error Handling

Use:

```text
error.tsx
not-found.tsx
global-error.tsx
```

where appropriate.

Errors should be user-friendly.

Never expose sensitive server errors to users.

## Metadata

Use Next.js Metadata APIs.

Every important page should have:

- title
- description
- Open Graph metadata where appropriate
- canonical URL where appropriate

## Images

Use Next.js image optimization.

Prefer:

```tsx
<Image />
```

over raw:

```html
<img />
```

unless there is a legitimate reason.

Always provide meaningful `alt` text.

## Links

Prefer:

```tsx
<Link />
```

for internal navigation.

Avoid unnecessary client-side navigation logic.

## TypeScript

Avoid:

```ts
any;
```

unless unavoidable.

Prefer:

```ts
unknown;
```

with proper narrowing when the type is genuinely unknown.

Define reusable domain types.

## Environment Variables

Never expose secrets to the client.

Only variables intentionally exposed to the browser should use:

```text
NEXT_PUBLIC_
```

## Project Inspection

Before modifying the project:

1. Inspect package.json.
2. Inspect Next.js version.
3. Inspect tsconfig.
4. Inspect existing architecture.
5. Inspect components.
6. Inspect styling setup.
7. Inspect linting configuration.

Follow existing conventions.

## Final Check

Before completing work:

- Run type checking.
- Run linting.
- Run tests if available.
- Check production build when appropriate.
- Verify routes.
- Verify loading/error states.
- Verify responsive behavior.
