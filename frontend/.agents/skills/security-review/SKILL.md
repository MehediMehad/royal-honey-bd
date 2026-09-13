---
name: security-review
description: Review frontend applications for common security risks including XSS, unsafe HTML, exposed secrets, insecure storage, unsafe redirects, dependency risks, and sensitive data leakage.
---

# Security Review Skill

## Purpose

Identify frontend security issues before production deployment.

This skill focuses on defensive application security.

## Secrets

Never expose:

```text
API keys
private keys
database credentials
service credentials
JWT signing secrets
payment secrets
```

to browser code.

Client-exposed environment variables must be intentionally public.

## XSS

Avoid unsafe HTML rendering.

Be especially careful with:

```tsx
dangerouslySetInnerHTML;
```

If HTML must be rendered:

- Sanitize it using an appropriate trusted sanitizer.
- Restrict allowed tags/attributes.
- Never trust arbitrary user-generated HTML.

## URLs

Validate user-controlled URLs.

Be careful with:

```text
redirect
callback
returnUrl
next
href
```

Avoid open redirect vulnerabilities.

## Authentication

Never assume frontend authentication is sufficient.

Frontend guards are UX mechanisms.

Authorization must be enforced server-side.

## Tokens

Avoid unnecessarily storing sensitive authentication tokens in:

```text
localStorage
sessionStorage
```

Follow the project's secure authentication architecture.

## Sensitive Data

Do not expose unnecessary:

```text
user data
internal IDs
permissions
server errors
database details
API credentials
```

to the client.

## Dependencies

Before adding a dependency:

- Check whether it is necessary.
- Prefer maintained packages.
- Avoid suspicious/untrusted packages.
- Minimize dependency count.

## Forms

Check:

- Input validation
- Server-side validation assumptions
- Error leakage
- CSRF protection requirements
- Rate limiting expectations

Remember that frontend validation is not a security boundary.

## Error Messages

Never expose:

```text
stack traces
database errors
internal paths
secret values
server implementation details
```

## Browser Storage

Do not store sensitive information unnecessarily.

Review:

```text
cookies
localStorage
sessionStorage
IndexedDB
```

## Security Checklist

Check:

- XSS
- unsafe HTML
- secrets
- authentication assumptions
- authorization assumptions
- open redirects
- unsafe URLs
- sensitive data
- browser storage
- dependencies
- error leakage

Security issues should be prioritized by severity and exploitability.
