# Mercur

Open source marketplace platform built on MedusaJS. Follows a shadcn-like CLI approach where code is copied directly into projects for full ownership.

## Project Structure

```
mercur/
├── apps/
│   └── docs/             # Documentation site (Mintlify)
├── packages/
│   ├── admin/            # Admin dashboard UI
│   ├── cli/              # @mercurjs/cli - CLI tool
│   ├── client/           # @mercurjs/client - API client
│   ├── core-plugin/      # @mercurjs/core-plugin - Core Medusa plugin (modules, workflows, providers)
│   ├── dashboard-sdk/    # @mercurjs/dashboard-sdk - Vite plugin for dashboards
│   ├── dashboard-shared/ # Shared UI components for admin and vendor dashboards
│   ├── registry/         # Official block registry
│   ├── types/            # @mercurjs/types - Type definitions
│   └── vendor/           # @mercurjs/vendor - Vendor portal UI components
├── packages/providers/
│   └── payout-stripe-connect/ # @mercurjs/payout-stripe-connect - Stripe Connect payout provider
├── templates/
│   ├── basic/            # Basic marketplace template
│   └── registry/         # Template for custom registries
```

## Key Concepts

### Blocks

Reusable code pieces that can be installed via CLI:

- **Modules** - Data models and business logic
- **Links** - Relationships between modules
- **Workflows** - Multi-step business processes
- **API Routes** - HTTP endpoints
- **Admin Extensions** - Admin dashboard customizations
- **Vendor Extensions** - Vendor portal customizations

## CLI Commands (`packages/cli`)

### `mercurjs create [name]`

Create a new Mercur project from template.

**Options:**

- `-t, --template <template>` - Template: `basic` or `registry`
- `--no-deps` - Skip dependency installation
- `--skip-db` - Skip database configuration
- `--skip-email` - Skip email collection
- `--db-connection-string <string>` - PostgreSQL connection string

### `mercurjs init`

Initialize project configuration (`blocks.json`).

**Options:**

- `-y, --yes` - Skip confirmation
- `-d, --defaults` - Use default paths
- `-s, --silent` - Mute output

### `mercurjs add <blocks...>`

Add blocks from registry to project.

**Options:**

- `-y, --yes` - Skip confirmation
- `-o, --overwrite` - Overwrite existing files
- `-s, --silent` - Mute output

### `mercurjs search`

Search available blocks in registries.

**Options:**

- `-q, --query <query>` - Search query
- `-r, --registry <registry>` - Registry to search (default: `@mercurjs`)

### `mercurjs view <blocks...>`

Display detailed block information.

### `mercurjs build [registry]`

Build registry into JSON files for distribution.

**Options:**

- `-o, --output <path>` - Output directory (default: `./r`)
- `-v, --verbose` - Show detailed output

### `mercurjs diff <blocks...>`

Compare local blocks against registry versions.

### `mercurjs codegen`

Generate TypeScript types from API routes.

**Options:**

- `-w, --watch` - Watch mode for auto-regeneration

### `mercurjs info`

Display project configuration and diagnostics.

### `mercurjs telemetry`

Control anonymous usage data collection.

**Options:**

- `--enable` - Enable telemetry
- `--disable` - Disable telemetry

## Dashboard SDK (`packages/dashboard-sdk`)

Vite plugin providing build-time integration for dashboard applications.

### Features

- **Configuration Management** - Loads `mercur.config.ts`
- **Route Generation** - Auto-generates routes from file-based structure
- **Component Registration** - Lazy-loads custom components via virtual modules
- **Hot Module Reloading** - Detects changes and restarts dev server

### Virtual Modules

```typescript
import routes from "virtual:mercur/routes"; // Generated route array
import config from "virtual:mercur/config"; // Configuration object
import components from "virtual:mercur/components"; // Component registry
```

### File-Based Routing

- `src/pages/page.tsx` → `/`
- `src/pages/users/[id]/page.tsx` → `/users/:id`
- `src/pages/users/[[id]]/page.tsx` → `/users/:id?` (optional)
- `src/pages/search/[*].tsx` → `/search/*` (splat)
- `src/pages/(group)/foo/page.tsx` → `/foo` (route grouping)
- `src/pages/dashboard/@sidebar/page.tsx` → Parallel route

### Usage

```typescript
// vite.config.ts
import { dashboardPlugin } from "@mercurjs/dashboard-sdk";

export default {
  plugins: [react(), dashboardPlugin()],
};
```

## Vendor Package (`packages/vendor`)

React-based vendor portal UI framework.

## Core Package (`packages/core-plugin`)

MedusaJS v2 plugin providing marketplace functionality.

## Documentation (`apps/docs`)

Documentation site built with [Mintlify](https://mintlify.com). Configuration lives in `docs.json`.

- **Content format**: MDX files
- **API Reference**: Auto-generated from OpenAPI spec (`api-reference/combined.oas.json`)
- **Sections**: Quick start, Core Concepts, Product (modules, workflows, events, subscribers), Integrations, Deployment, API Reference, Changelog
- **Dev server**: `mintlify dev` from `apps/docs/`

## Skills (`.claude/skills/`)

Before writing ANY admin UI code, invoke the relevant skill. Skills contain hard rules and exact code patterns.

| Skill | When to use |
|-------|-------------|
| `admin-page-ui` | List pages, detail pages, Container sections, ActionMenu, empty states |
| `admin-form-ui` | Form fields, edit drawers (RouteDrawer), create modals (RouteFocusModal) |
| `admin-tab-ui` | Tabbed wizard forms (ProgressTabs, TabbedForm) |
| `medusa-ui-conformance` | Before adding any custom UI — check if @medusajs/ui or local wrapper exists |
| `cc-alignment` | Renaming/restructuring compound component exports |
| `compound-components-migration-review` | Migrating pages to compound component pattern |
| `code-review` | After completing implementation, before merging |
| `admin-ui-review` | Reviewing admin UI code for pattern consistency |

## Reusable Components (`packages/admin/src/components/`)

**ALWAYS search for existing components before writing custom UI.** Never hand-roll what already exists.

| Component | Path | Use for |
|-----------|------|---------|
| `HandleInput` | `components/inputs/handle-input/` | Handle/slug fields with `/` prefix |
| `ChipInput` | `components/inputs/chip-input/` | Tag-like multi-value inputs |
| `SwitchBox` | `components/common/switch-box/` | Switch with label + description card |
| `Form.*` | `components/common/form/` | All form fields (Field, Label, Control, ErrorMessage, Hint) |
| `ActionMenu` | `components/common/action-menu/` | Dropdown action menus (edit, delete) |
| `SectionRow` | `components/common/section/` | Key-value rows in detail sections |
| `RouteDrawer` | `components/modals/` | Edit drawers with route-based open/close |
| `RouteFocusModal` | `components/modals/` | Create modals with route-based open/close |
| `useRouteModal` | `components/modals/` | Get `handleSuccess()` — must be INSIDE RouteDrawer/RouteFocusModal |
| `KeyboundForm` | `components/utilities/keybound-form/` | Form with Ctrl+Enter submit |
| `_DataTable` | `components/table/data-table/` | Table with filters, search, sort, pagination |
| `SingleColumnPage` | `components/layout/pages/` | List page wrapper |
| `TwoColumnPage` | `components/layout/pages/` | Detail page wrapper (Main + Sidebar) |
| `useDataTable` | `hooks/use-data-table` | Table state (pagination, row selection) synced to URL |
| `useQueryParams` | `hooks/use-query-params` | Extract typed query params from URL |

## Architecture

- **Foundation**: MedusaJS v2 (headless commerce)
- **Language**: TypeScript
- **Monorepo**: Turborepo
- **Package Manager**: bun

## Configuration Files

- `blocks.json` - Project configuration with path aliases
- `registry.json` - Registry definition with block metadata
- `mercur.config.ts` - Dashboard/vendor app configuration
- `medusa-config.ts` - MedusaJS configuration

## Supported Deployment Vendors

- Medusa Cloud
- Railway
- Render
- Fly.io
- Heroku
- DigitalOcean
- Koyeb
