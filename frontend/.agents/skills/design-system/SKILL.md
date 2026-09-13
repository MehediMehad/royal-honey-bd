---
name: design-system
description: Apply design system tokens, Career IT brand colors, typography hierarchy, border radii, shadows, and Lucide icons consistent with globals.css.
---

# Design System & Visual Guidelines

This document defines the visual design system, token usage, typography scale, spacing rules, and component styling conventions for the Career IT application based on `src/app/globals.css`.

---

## 1. Design System Tokens (CSS Variables)

The application uses CSS variables defined in `src/app/globals.css` with the Career IT brand palette (Primary: `#62286C` in Light Mode, `#853792` in Dark Mode).

### Core Surface & Brand Tokens

| Token                      | Semantic Purpose                      | Light Mode Value | Dark Mode Value             |
| :------------------------- | :------------------------------------ | :--------------- | :-------------------------- |
| `--background`             | Page background color                 | `#ffffff`        | `#0f0a10`                   |
| `--foreground`             | Main text color                       | `#1e1520`        | `#f5f0f7`                   |
| `--card`                   | Card & surface background             | `#ffffff`        | `#18111a`                   |
| `--card-foreground`        | Text on card surfaces                 | `#1e1520`        | `#f5f0f7`                   |
| `--popover`                | Dropdown & popover surfaces           | `#ffffff`        | `#18111a`                   |
| `--popover-foreground`     | Text inside popovers                  | `#1e1520`        | `#f5f0f7`                   |
| `--primary`                | Primary action buttons & brand accent | `#62286C`        | `#853792`                   |
| `--primary-foreground`     | Text on primary elements              | `#ffffff`        | `#ffffff`                   |
| `--secondary`              | Secondary actions & neutral fills     | `#f6eff7`        | `#26162a`                   |
| `--secondary-foreground`   | Text on secondary elements            | `#62286C`        | `#f5f0f7`                   |
| `--muted`                  | Muted backgrounds & subtle fills      | `#f7f3f8`        | `#211324`                   |
| `--muted-foreground`       | Subtitle text, placeholders, metadata | `#6e6573`        | `#a698ab`                   |
| `--accent`                 | Hover states & highlighted rows       | `#f0e4f2`        | `#2e1a33`                   |
| `--accent-foreground`      | Text on accent elements               | `#62286C`        | `#f5f0f7`                   |
| `--destructive`            | Error states & dangerous actions      | `#dc2626`        | `#ef4444`                   |
| `--destructive-foreground` | Text on destructive elements          | `#ffffff`        | `#ffffff`                   |
| `--border`                 | Subtle component borders              | `#e8dee9`        | `rgba(255, 255, 255, 0.12)` |
| `--input`                  | Input field borders                   | `#e8dee9`        | `rgba(255, 255, 255, 0.15)` |
| `--ring`                   | Focus ring outline color              | `#62286C`        | `#853792`                   |

---

### Navigation Sidebar Tokens

| Token                          | Semantic Purpose        | Light Mode Value | Dark Mode Value             |
| :----------------------------- | :---------------------- | :--------------- | :-------------------------- |
| `--sidebar`                    | Sidebar background      | `#fcf9fd`        | `#18111a`                   |
| `--sidebar-foreground`         | Sidebar text color      | `#1e1520`        | `#f5f0f7`                   |
| `--sidebar-primary`            | Active sidebar item     | `#62286C`        | `#853792`                   |
| `--sidebar-primary-foreground` | Active item text        | `#ffffff`        | `#ffffff`                   |
| `--sidebar-accent`             | Sidebar item hover fill | `#f0e4f2`        | `#2e1a33`                   |
| `--sidebar-accent-foreground`  | Sidebar item hover text | `#62286C`        | `#f5f0f7`                   |
| `--sidebar-border`             | Sidebar border          | `#e8dee9`        | `rgba(255, 255, 255, 0.12)` |
| `--sidebar-ring`               | Sidebar focus ring      | `#62286C`        | `#853792`                   |

---

### Data Visualization Charts

| Token       | Color Value | Description                     |
| :---------- | :---------- | :------------------------------ |
| `--chart-1` | `#62286C`   | Career IT Deep Purple (Primary) |
| `--chart-2` | `#8b3a99`   | Medium Purple                   |
| `--chart-3` | `#a855f7`   | Vibrant Violet                  |
| `--chart-4` | `#c084fc`   | Light Violet                    |
| `--chart-5` | `#e9d5ff`   | Soft Pastel Lavender            |

---

### Visual Rules

- **Use Theme Classes**: Never hardcode hex values like `#62286C` or `#ffffff` in component JSX. Always use utility classes mapped to CSS variables (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `border-border`, etc.).
- **Consistent Selection**: Selection styles use `selection:bg-primary selection:text-primary-foreground`.
- **Focus Rings**: Interactive elements should maintain accessible focus rings using `outline-ring/50` or `focus-visible:ring-2 focus-visible:ring-ring`.

---

## 2. Typography Hierarchy

The project uses the **Geist** font family configured via `next/font/google`:

- **Sans & Heading**: `var(--font-geist-sans)` (`font-sans`, `font-heading`)
- **Monospace**: `var(--font-geist-mono)` (`font-mono`)

### Standard Typography Scale

| Class       | Font Size       | Line Height | Tracking          | Standard Usage                   |
| :---------- | :-------------- | :---------- | :---------------- | :------------------------------- |
| `text-3xl`  | 1.875rem (30px) | 2.25rem     | `tracking-tight`  | Main Page Titles (`h1`)          |
| `text-2xl`  | 1.5rem (24px)   | 2rem        | `tracking-tight`  | Section Titles (`h2`)            |
| `text-xl`   | 1.25rem (20px)  | 1.75rem     | `tracking-tight`  | Sub-headers & Card Titles (`h3`) |
| `text-base` | 1rem (16px)     | 1.5rem      | `tracking-normal` | Body Text                        |
| `text-sm`   | 0.875rem (14px) | 1.25rem     | `tracking-normal` | UI Labels, Table cells, Buttons  |
| `text-xs`   | 0.75rem (12px)  | 1rem        | `tracking-normal` | Help text, Badges, Tooltips      |

- **Avoid Arbitrary Sizes**: Do NOT use `text-[37px]`, `mt-[43px]`, `gap-[13px]`. Rely on standard Tailwind spacing scales (`0.5`, `1`, `1.5`, `2`, `3`, `4`, `6`, `8`, `12`, `16`).

---

## 3. Border Radius & Elevation (Shadows)

### Border Radius Tokens (`--radius: 0.625rem` / 10px)

- `rounded-sm`: `calc(var(--radius) * 0.6)` (6px)
- `rounded-md`: `calc(var(--radius) * 0.8)` (8px)
- `rounded-lg`: `var(--radius)` (10px)
- `rounded-xl`: `calc(var(--radius) * 1.4)` (14px)
- `rounded-2xl`: `calc(var(--radius) * 1.8)` (18px)
- `rounded-3xl`: `calc(var(--radius) * 2.2)` (22px)
- `rounded-4xl`: `calc(var(--radius) * 2.6)` (26px)

### Elevation & Shadows

- Use subtle, crisp shadows (`shadow-xs`, `shadow-sm`).
- Avoid heavy, deep ambient drop-shadows.

---

## 4. Component Usage & Iconography

### Icons

- Use **Lucide React** (`lucide-react`) exclusively.
- Standard icon sizing: `size-4` (16px) for buttons, inputs, and inline labels; `size-5` (20px) for navigation items.
- Never use emojis as functional UI icons.

### Component Placement Rules

- Base UI Primitives: Keep strictly inside `src/components/ui/`.
- Custom / Shared Layouts: Place inside `src/components/shared/` or `src/components/layout/`.
- Feature Domain Components: Place inside `src/features/<domain>/components/`.

---

## 5. Responsive Design Principles

- **Mobile First**: Always write responsive classes starting from mobile up (`w-full sm:w-auto`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Breakpoints**:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px
