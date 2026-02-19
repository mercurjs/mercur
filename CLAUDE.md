# Mercur

Open source marketplace platform built on MedusaJS. Follows a shadcn-like CLI approach where code is copied directly into projects for full ownership.

## Project Structure

```
mercur/
├── packages/
│   ├── cli/              # @mercurjs/cli - CLI tool
│   ├── client/           # @mercurjs/client - API client
│   ├── core/             # @mercurjs/core - Core Medusa plugin (modules, workflows, providers)
│   ├── dashboard-sdk/    # @mercurjs/dashboard-sdk - Vite plugin for dashboards
│   ├── registry/         # Official block registry
│   ├── types/            # @mercurjs/types - Type definitions
│   └── vendor/           # @mercurjs/vendor - Vendor portal UI components
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

## Core Package (`packages/core`)

MedusaJS v2 plugin providing marketplace functionality.

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
