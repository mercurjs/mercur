# Skill: Routing Guide

Quick reference for the file-based routing system.

## Usage

```
/routing-guide [topic]
```

Topics: `structure`, `exports`, `settings`, `modals`, `breadcrumbs`, `loaders`

---

## Structure

```
src/pages/
├── _layout.tsx           # Root layout (wraps all authenticated routes)
│
├── products/             # MAIN ROUTE: /products
│   ├── index.tsx        # → /products (list)
│   ├── create/          # → /products/create (modal)
│   ├── [id]/            # → /products/:id (dynamic)
│   │   ├── index.tsx    # → detail page
│   │   ├── edit/        # → /products/:id/edit
│   │   └── _components/ # internal (NOT a route)
│   └── _components/     # internal (NOT a route)
│
├── settings/             # SETTINGS ROUTES: /settings/*
│   ├── index.tsx        # → /settings (landing)
│   ├── regions/         # → /settings/regions
│   ├── users/           # → /settings/users
│   └── tax-regions/     # → /settings/tax-regions
│
├── login/                # PUBLIC ROUTE: /login
└── invite/               # PUBLIC ROUTE: /invite
```

## Folder Naming Rules

| Folder Name | URL Segment | Type |
|-------------|-------------|------|
| `products/` | `/products` | Static segment |
| `[id]/` | `/:id` | Dynamic parameter |
| `[...slug]/` | `/*` | Catch-all |
| `_components/` | - | Internal (NOT a route) |
| `_common/` | - | Internal (NOT a route) |
| `common/` | - | Internal (NOT a route) |

## Required Exports

### Minimal Page

```tsx
export const Component = () => <div>Page content</div>
```

### With Loader (pre-fetch data)

```tsx
export const loader = async ({ params }) => {
  return fetchData(params.id)
}
export const Component = () => { ... }
```

### With Breadcrumb (dynamic routes)

```tsx
export const Breadcrumb = (props) => {
  return <span>{props.data.name}</span>
}
export const Component = () => { ... }
export { loader } from "./loader"
```

## Route Classification

Routes are **automatically** classified by path:

| Path Pattern | Layout | Auth Required |
|--------------|--------|---------------|
| `/login`, `/invite`, `/reset-password` | PublicLayout | No |
| `/settings/*` | SettingsLayout | Yes |
| Everything else | MainLayout | Yes |

## Layout Hierarchy

```
App
├── PublicLayout (no auth)
│   ├── /login
│   ├── /invite
│   └── /reset-password
│
└── ProtectedRoute (auth required)
    ├── MainLayout (main sidebar)
    │   ├── / → redirect to /orders
    │   ├── /products
    │   ├── /orders
    │   └── /customers
    │
    └── SettingsLayout (settings sidebar) ← SEPARATE, not nested
        ├── /settings
        ├── /settings/regions
        └── /settings/users
```

## Modal/Drawer Routes

Modals and drawers are regular routes that render over the parent:

```
/products           → ProductList
/products/create    → ProductList + CreateModal (overlay)
/products/:id       → ProductDetail
/products/:id/edit  → ProductDetail + EditDrawer (overlay)
```

## Import Aliases

```tsx
import { ... } from "@components/..."   // src/components/
import { ... } from "@hooks/..."        // src/hooks/
import { ... } from "@lib/..."          // src/lib/
import { ... } from "@providers/..."    // src/providers/
import { ... } from "@pages/..."        // src/pages/
```

## Common Patterns

### List with Create Modal

```
products/
├── index.tsx           # Shows table
└── create/
    └── index.tsx       # Modal (RouteFocusModal)
```

### Detail with Edit Drawer

```
products/[id]/
├── index.tsx           # Shows detail sections
└── edit/
    └── index.tsx       # Drawer (RouteDrawer)
```

### Nested Dynamic Routes

```
tax-regions/[id]/provinces/[province_id]/
├── index.tsx                           # Province detail
└── tax-rates/[tax_rate_id]/edit/       # Edit tax rate
```
