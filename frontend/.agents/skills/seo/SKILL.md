---
name: seo
description: Implement technical and on-page SEO for Next.js applications including metadata, canonical URLs, structured content, sitemap, robots, semantic HTML, and indexability.
---

# SEO Skill

## Purpose

Ensure pages are discoverable, understandable, shareable, and indexable by search engines.

## Page Metadata

Important pages should have:

```text
title
description
canonical URL
Open Graph
Twitter/X metadata where appropriate
```

Use Next.js Metadata APIs.

## Title

Titles should be:

- Unique
- Descriptive
- Relevant
- Concise

Avoid duplicate titles across pages.

## Description

Descriptions should accurately summarize page content.

Do not stuff keywords.

## Headings

Use logical hierarchy.

Prefer:

```text
H1
  H2
    H3
```

Avoid using headings only for visual styling.

## Semantic HTML

Use meaningful semantic elements.

Search engines should be able to understand page structure from HTML.

## URLs

Prefer clean URLs.

Examples:

```text
/courses
/courses/nextjs-masterclass
/blog/react-server-components
```

Avoid unnecessary query parameters for indexable content.

## Canonical

Use canonical URLs when duplicate or similar URLs could exist.

## Sitemap

Ensure important public pages are included in sitemap generation.

Exclude private pages.

## Robots

Ensure:

- Public pages can be crawled.
- Private pages are protected from indexing.
- Admin/dashboard pages are not accidentally indexed.

## Structured Data

Use structured data where appropriate.

Examples:

```text
Article
Course
Product
Organization
BreadcrumbList
FAQ
```

Only use structured data that accurately represents visible page content.

## Internal Linking

Important pages should be reachable through internal links.

Course websites should connect:

```text
Home
→ Categories
→ Courses
→ Course Detail
→ Related Courses
```

## Images

Use meaningful alt text where appropriate.

Do not keyword-stuff alt attributes.

## SEO Checklist

Before completion:

- Unique title
- Description
- H1
- Semantic structure
- Canonical
- Open Graph
- Internal links
- Sitemap
- Robots
- Structured data where appropriate
- Mobile responsiveness
- Performance
- Indexability
