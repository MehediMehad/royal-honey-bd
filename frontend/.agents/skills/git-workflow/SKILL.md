---
name: git-workflow
description: Manage frontend development changes safely using clean Git practices, focused commits, meaningful messages, branch discipline, and pre-commit validation.
---

# Git Workflow Skill

## Purpose

Keep development history clean, reviewable, and safe.

## Before Making Changes

Inspect:

```text
git status
git branch
recent commits
```

Understand the current state before modifying files.

## Never Destroy Existing Work

Do not:

```text
reset --hard
checkout -- .
clean untracked files
force push
```

unless explicitly requested and understood.

Protect existing user changes.

## Branches

Use focused branches.

Examples:

```text
feature/course-page
fix/mobile-navbar
refactor/design-system
perf/image-optimization
```

## Commits

Prefer small logical commits.

Good:

```text
feat: add course details page
fix: resolve mobile navbar overflow
refactor: extract reusable course card
perf: optimize course images
```

Avoid:

```text
update
changes
final
fix stuff
work
```

## Scope

One commit should ideally represent one logical change.

Avoid mixing:

```text
feature + unrelated refactor + formatting + dependency changes
```

unless necessary.

## Before Commit

Run appropriate checks:

```text
typecheck
lint
tests
build
```

depending on project configuration.

## Diff Review

Before committing inspect:

```text
git diff
git status
```

Look for:

- Accidental files
- Debug logs
- Secrets
- Temporary code
- Unrelated modifications
- Large generated files

## Generated Files

Do not commit unnecessary:

```text
build output
cache
temporary files
environment files
local secrets
```

Follow the project's `.gitignore`.

## Commit Message Format

Prefer Conventional Commit style:

```text
feat:
fix:
refactor:
perf:
docs:
test:
chore:
style:
```

## Pull Request Preparation

A good PR should communicate:

```text
What changed?
Why?
How was it tested?
Any known limitations?
```

## Final Rule

Git history should help another developer understand how the project evolved.

Keep changes focused, safe, and reversible.
