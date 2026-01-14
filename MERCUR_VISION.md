# MercurJS: Platform Vision & CLI Architecture

## Purpose

We've received extensive feedback from Rigby teams about Mercur and the developer experience. Developers have identified numerous bugs, poor DX, and significant amounts of code not dedicated to their specific use cases. We'll redesign the architecture, improve developer experience, revamp admin and vendor panels, and update documentation.

### Strategic Shift

Remake the current Mercur B2C from being a template to becoming a core plugin and block registry. This will improve Rigby project quality, engage more community members, track platform usage, and enhance customer engagement.

## Goals

- Create CLI for creating block registry which can add, update, list, and spot differences in existing blocks
- Identify overlaps in marketplace features and move them into core plugin (example: complete cart workflow, config, etc.)
- Provide core plugin workflows API which can be changed or extended for multiple use cases using Medusa workflow hooks
- Create backend typed router which can be shared between admin and vendor panel and with which you can create type-safe API client
- Create clear roadmap for community
- Provide clear monorepo
- Provide admin and vendor panels inside monorepo with file-based routing
- Create Mercur MCP
- Build fully in public

## Non-Goals

- Not building a plugin-based architecture
- Backward compatibility with old Mercur

## Requirements

### Research

- Research how to share UI components in admin and vendor panel
- Research how to split registry blocks by use case (B2C, B2B)

### Mercur CLI

- `create-mercur-app`, `init`, `add`, `diff`, `list`, `search`, `view` commands
- Add init templates (B2C, B2B, Registry)
- Build registry command

### Core Plugin

- Typed router with frontend API client integration
- Core workflows and modules and API routes

### Admin Panel

- (To be defined)

### Vendor Panel

- (To be defined)

### Monorepo

- (To be defined)

### Documentation & Community

- Improve docs
- Provide roadmap

---

## Executive Summary

MercurJS is a comprehensive marketplace platform built on MedusaJS. This document outlines the architecture for a **shadcn-like CLI** that allows developers to add modules, API endpoints, workflows, and UI extensions by **copying source code directly into their projects** - giving full ownership and customization capability.

### The Paradigm Shift: From Plugins to CLI

```
Traditional Plugin Approach          MercurJS CLI Approach
========================           =======================
npm install plugin                 npx mercur add vendor-reviews
  |                                    |
  v                                    v
Plugin lives in node_modules       Code copied to src/
  |                                    |
  v                                    v
Limited customization              Full code ownership
Black box behavior                 Transparent, modifiable code
Version lock-in                    Independent evolution
```

### Why This Approach?

Like **shadcn/ui** revolutionized component libraries by giving developers actual source code instead of npm packages, MercurJS CLI:

- **Full Ownership**: Code lives in your repo, not node_modules
- **Complete Customization**: Modify any file to fit your needs
- **Transparency**: See exactly how everything works
- **Independence**: Your code evolves independently from registry updates
- **Learning**: Study real-world patterns in your codebase

### The Relationship Model

```
NestJS ──────> Vendure
   |              |
MedusaJS ────> MercurJS
```

**MedusaJS is to MercurJS what NestJS is to Vendure**

---

## CLI Commands

### Package & Installation

```bash
# The CLI is published as @mercurjs/cli
npx mercur <command>

# Or install globally
npm install -g @mercurjs/cli
mercur <command>
```

### Command Reference

#### `mercur init`

Initializes MercurJS in an existing MedusaJS project.

```bash
mercur init [options]

Options:
  --defaults     Use default configuration
  --src-dir      Source directory (default: src)
```

**What it does:**

1. Detects MedusaJS project (checks for `@medusajs/medusa` dependency)
2. Creates `mercur.json` configuration file
3. Installs `@mercurjs/core` dependency
4. Optionally updates `medusa-config.ts` with `withMercur()` wrapper

**Example output:**

```
$ npx mercur init

  Detected MedusaJS project (v2.12.4)
  Creating mercur.json...
  Installing @mercurjs/core...

  MercurJS initialized successfully!

  Next steps:
    1. Browse available items: mercur list
    2. Add a module: mercur add <item-name>
    3. Run migrations: npx medusa db:migrate
```

---

#### `mercur add <item...>`

Adds registry items to the project by copying source code.

```bash
mercur add <item...> [options]

Options:
  --registry <url>    Custom registry URL
  --overwrite         Overwrite existing files
  --dry-run           Preview changes without writing
  --path <path>       Custom installation path
  --skip-migrations   Skip migration file generation
```

**Examples:**

```bash
# Add a single module
mercur add vendor-reviews

# Add multiple items
mercur add vendor-reviews commission-splits

# Add from namespaced registry (third-party)
mercur add @marketplace/advanced-payouts

# Add specific resource types
mercur add workflow/approve-vendor
mercur add api/vendor/products

# Preview what would be added
mercur add vendor-reviews --dry-run
```

**Example output:**

```
$ mercur add vendor-reviews

Fetching vendor-reviews@2.1.0...

Dependencies:
  npm: @medusajs/framework (already installed)
  registry: notification-service (will be installed)

Files to create:
  src/modules/vendor-reviews/index.ts
  src/modules/vendor-reviews/service.ts
  src/modules/vendor-reviews/models/review.ts
  src/modules/vendor-reviews/models/review-response.ts
  src/modules/vendor-reviews/migrations/Migration20240101000000.ts
  src/api/vendor/reviews/route.ts
  src/api/vendor/reviews/[id]/route.ts
  src/api/store/reviews/route.ts
  src/links/vendor-review-link.ts

Proceed? [Y/n] y

Installing notification-service@1.2.0...
  Created: src/modules/notification-service/...

Installing vendor-reviews@2.1.0...
  Created: src/modules/vendor-reviews/index.ts
  Created: src/modules/vendor-reviews/service.ts
  ...

Configuration added to mercur.json

Run migrations? [Y/n] y
Running: npx medusa db:migrate

vendor-reviews installed successfully!
```

---

#### `mercur list`

Lists available registry items.

```bash
mercur list [options]

Options:
  --type <type>     Filter by type (module, workflow, api, ui)
  --installed       Show only installed items
  --json            Output as JSON
```

**Example output:**

```
$ mercur list

Available MercurJS Registry Items:

MODULES
  vendor-reviews       Vendor review and rating system
  commission           Commission calculation and tracking
  payouts              Vendor payout management
  seller-onboarding    Vendor registration and approval

WORKFLOWS
  approve-vendor       Multi-step vendor approval workflow
  process-payout       Automated payout processing
  split-order          Order splitting for multi-vendor carts

API ROUTES
  vendor/products      Vendor product management API
  vendor/orders        Vendor order access API
  vendor/analytics     Vendor sales analytics API

UI EXTENSIONS
  vendor-dashboard     Complete vendor panel dashboard
  commission-widget    Admin commission overview widget
  seller-stats         Vendor performance statistics

Use 'mercur info <item>' for details
```

---

#### `mercur diff <item>`

Shows differences between installed and registry versions.

```bash
mercur diff <item> [options]

Options:
  --all    Check all installed items
```

**Example output:**

```
$ mercur diff vendor-reviews

Comparing vendor-reviews (local v2.0.0) vs registry v2.1.0

src/modules/vendor-reviews/service.ts
- export class VendorReviewService extends MedusaService({
+ export class VendorReviewService extends MedusaService({
    Review,
+   ReviewResponse,   // NEW in v2.1.0
  }) {
+   // New method in v2.1.0
+   async respondToReview(reviewId: string, response: string) { ... }
  }

New files in v2.1.0:
  + src/modules/vendor-reviews/models/review-response.ts
  + src/modules/vendor-reviews/migrations/Migration20240601000000.ts

2 files changed, 45 insertions(+), 3 deletions(-)
```

---

#### `mercur update <item...>`

Updates installed items from registry.

```bash
mercur update <item...> [options]

Options:
  --all       Update all installed items
  --backup    Create backup before updating (default: true)
  --dry-run   Preview changes
  --force     Force update even with local modifications
```

**Behavior:**

1. Checks for local modifications
2. Shows diff preview
3. Prompts for confirmation
4. Creates backup to `.mercur-backup/`
5. Applies updates
6. Handles new migrations

---

#### `mercur info <item>`

Shows detailed information about a registry item.

```bash
$ mercur info vendor-reviews

vendor-reviews v2.1.0
Vendor review and rating system for marketplace

Type: module
Author: MercurJS Team
Registry: https://mercurjs.com/registry

Dependencies:
  npm:
    - @medusajs/framework ^2.0.0

Registry Dependencies:
  - notification-service (optional)

Files:
  src/modules/vendor-reviews/
    ├── index.ts
    ├── service.ts
    ├── models/
    │   ├── review.ts
    │   └── review-response.ts
    └── migrations/
        └── Migration20240101000000.ts

  src/api/vendor/reviews/
    ├── route.ts
    └── [id]/route.ts

Related Items:
  - workflow/moderate-review
  - ui/review-widget

Documentation: https://mercurjs.com/docs/modules/vendor-reviews
```

---

## Registry System

### Registry Architecture

```
https://mercurjs.com/registry/
├── registry.json          # Main index of all items
└── r/
    ├── vendor-reviews.json
    ├── commission.json
    ├── approve-vendor.json
    └── ...
```

### Registry Index Schema (`registry.json`)

```json
{
  "$schema": "https://mercurjs.com/schema/registry.json",
  "name": "mercurjs",
  "version": "1.0.0",
  "homepage": "https://mercurjs.com",
  "items": [
    {
      "name": "vendor-reviews",
      "type": "registry:module",
      "title": "Vendor Reviews",
      "description": "Complete vendor review and rating system",
      "version": "2.1.0",
      "categories": ["vendors", "reviews", "marketplace"]
    },
    {
      "name": "approve-vendor",
      "type": "registry:workflow",
      "title": "Vendor Approval Workflow",
      "description": "Multi-step vendor onboarding approval",
      "version": "1.2.0",
      "categories": ["vendors", "onboarding"]
    }
  ]
}
```

### Registry Item Schema (`r/{name}.json`)

```json
{
  "$schema": "https://mercurjs.com/schema/registry-item.json",
  "name": "vendor-reviews",
  "type": "registry:module",
  "title": "Vendor Reviews",
  "description": "Complete vendor review and rating system with moderation",
  "version": "2.1.0",
  "author": {
    "name": "MercurJS Team",
    "url": "https://mercurjs.com"
  },
  "license": "MIT",
  "categories": ["vendors", "reviews", "marketplace"],

  "dependencies": ["@medusajs/framework@^2.0.0"],

  "registryDependencies": ["notification-service"],

  "optionalDependencies": [],

  "files": [
    {
      "path": "modules/vendor-reviews/index.ts",
      "type": "registry:module",
      "target": "src/modules/vendor-reviews/index.ts",
      "content": "// Base64 encoded or URL to raw file"
    },
    {
      "path": "modules/vendor-reviews/service.ts",
      "type": "registry:module",
      "target": "src/modules/vendor-reviews/service.ts"
    },
    {
      "path": "modules/vendor-reviews/models/review.ts",
      "type": "registry:model",
      "target": "src/modules/vendor-reviews/models/review.ts"
    },
    {
      "path": "api/vendor/reviews/route.ts",
      "type": "registry:api",
      "target": "src/api/vendor/reviews/route.ts"
    }
  ],

  "migrations": [
    {
      "path": "modules/vendor-reviews/migrations/Migration20240101000000.ts",
      "target": "src/modules/vendor-reviews/migrations/Migration20240101000000.ts",
      "version": "2.0.0"
    }
  ],

  "links": [
    {
      "path": "links/vendor-review-link.ts",
      "target": "src/links/vendor-review-link.ts"
    }
  ],

  "configTemplate": {
    "modules": {
      "vendor-reviews": {
        "resolve": "./src/modules/vendor-reviews",
        "options": {
          "moderationEnabled": true,
          "autoApprove": false
        }
      }
    }
  },

  "envVars": [
    {
      "name": "REVIEW_MODERATION_WEBHOOK",
      "description": "Webhook URL for review moderation notifications",
      "required": false
    }
  ],

  "docs": "After installation, run migrations with `npx medusa db:migrate`",

  "meta": {
    "medusaVersion": ">=2.0.0",
    "mercurVersion": ">=1.0.0"
  }
}
```

### Registry Item Types

| Type                  | Description                      | Target Directory                              |
| --------------------- | -------------------------------- | --------------------------------------------- |
| `registry:module`     | Full module with service, models | `src/modules/{name}/`                         |
| `registry:workflow`   | Business logic workflow          | `src/workflows/`                              |
| `registry:api`        | API route(s)                     | `src/api/`                                    |
| `registry:subscriber` | Event subscriber                 | `src/subscribers/`                            |
| `registry:job`        | Scheduled job                    | `src/jobs/`                                   |
| `registry:link`       | Module link definition           | `src/links/`                                  |
| `registry:admin`      | Admin panel extension            | `src/admin/`                                  |
| `registry:vendor`     | Vendor panel extension           | `src/vendor/`                                 |
| `registry:widget`     | Widget component                 | `src/admin/widgets/` or `src/vendor/widgets/` |
| `registry:lib`        | Utility library                  | `src/lib/`                                    |
| `registry:script`     | Seed/utility script              | `src/scripts/`                                |

---

## Configuration

### `mercur.json`

Created by `mercur init`, this file tracks configuration and installed items:

```json
{
  "$schema": "https://mercurjs.com/schema/mercur.json",
  "version": "1.0.0",
  "srcDir": "src",

  "aliases": {
    "modules": "@/modules",
    "api": "@/api",
    "workflows": "@/workflows",
    "admin": "@/admin",
    "vendor": "@/vendor",
    "lib": "@/lib"
  },

  "registries": {
    "default": "https://mercurjs.com/registry",
    "@marketplace": "https://marketplace-extensions.com/registry"
  },

  "installed": {
    "vendor-reviews": {
      "version": "2.1.0",
      "installedAt": "2024-01-15T10:30:00Z",
      "registry": "default",
      "files": [
        "src/modules/vendor-reviews/index.ts",
        "src/modules/vendor-reviews/service.ts",
        "src/modules/vendor-reviews/models/review.ts"
      ],
      "checksum": "sha256:abc123..."
    },
    "commission": {
      "version": "1.5.0",
      "installedAt": "2024-01-16T14:20:00Z",
      "registry": "default"
    }
  },

  "preferences": {
    "autoRunMigrations": false,
    "createBackups": true,
    "confirmOverwrite": true
  }
}
```

### Integration with MedusaJS

The CLI works seamlessly with existing MedusaJS configuration:

```typescript
// medusa-config.ts
import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const config = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    // Modules added via 'mercur add' are configured here
    {
      resolve: "./src/modules/vendor-reviews",
      options: {
        moderationEnabled: true,
        autoApprove: false,
      },
    },
    {
      resolve: "./src/modules/commission",
      options: {
        defaultRate: 0.1,
      },
    },
  ],
});

export default config;
```

---

## Directory Structure & File Placement

### Target Directory Mapping

When adding registry items, files are placed according to their type:

```
src/
├── modules/              # registry:module
│   ├── vendor-reviews/
│   │   ├── index.ts
│   │   ├── service.ts
│   │   ├── models/
│   │   │   └── review.ts
│   │   └── migrations/
│   │       └── Migration20240101000000.ts
│   └── commission/
│
├── api/                  # registry:api
│   ├── admin/
│   │   └── reviews/
│   │       └── route.ts
│   ├── store/
│   │   └── reviews/
│   │       └── route.ts
│   └── vendor/           # MercurJS vendor API namespace
│       ├── products/
│       │   └── route.ts
│       └── orders/
│           └── route.ts
│
├── workflows/            # registry:workflow
│   ├── approve-vendor.ts
│   └── process-payout.ts
│
├── subscribers/          # registry:subscriber
│   └── review-created.ts
│
├── jobs/                 # registry:job
│   └── cleanup-reviews.ts
│
├── links/                # registry:link
│   └── vendor-review-link.ts
│
├── admin/                # registry:admin
│   ├── routes/
│   │   └── reviews/
│   │       └── page.tsx
│   └── widgets/
│       └── review-stats.tsx
│
├── vendor/               # registry:vendor (MercurJS convention)
│   ├── routes/
│   │   └── dashboard/
│   │       └── page.tsx
│   └── widgets/
│       └── sales-overview.tsx
│
├── lib/                  # registry:lib
│   └── review-utils.ts
│
└── scripts/              # registry:script
    └── seed-reviews.ts
```

### Module Structure Convention

Every `registry:module` follows MedusaJS conventions:

```
src/modules/{module-name}/
├── index.ts              # Module definition export
├── service.ts            # Main service class
├── models/
│   └── {entity}.ts       # Data models
├── migrations/
│   └── Migration*.ts     # Database migrations
├── loaders/              # Optional loaders
│   └── index.ts
└── __tests__/            # Optional tests
    └── service.spec.ts
```

**Example `index.ts`:**

```typescript
import VendorReviewService from "./service";
import { Module } from "@medusajs/framework/utils";

export const VENDOR_REVIEW_MODULE = "vendor-reviews";

export default Module(VENDOR_REVIEW_MODULE, {
  service: VendorReviewService,
});
```

### API Route Convention

Following MedusaJS file-based routing:

```
src/api/vendor/reviews/
├── route.ts              # GET /vendor/reviews, POST /vendor/reviews
├── [id]/
│   └── route.ts          # GET/PUT/DELETE /vendor/reviews/:id
├── middlewares.ts        # Route-specific middleware (optional)
└── validators.ts         # Zod schemas (optional)
```

---

## Dependency Resolution

### Dependency Types

```typescript
interface RegistryItem {
  // NPM packages - installed via npm/yarn
  dependencies: string[]; // Runtime deps
  devDependencies: string[]; // Development deps
  peerDependencies: Record<string, string>;

  // Other registry items
  registryDependencies: string[]; // Required registry items
  optionalDependencies: string[]; // Optional registry items
}
```

### Resolution Algorithm

```
1. Parse registry item JSON
2. For each registryDependency:
   a. Check if already installed (via mercur.json)
   b. If not installed, fetch dependency item
   c. Recursively resolve its dependencies
   d. Build dependency graph
3. Detect circular dependencies (error if found)
4. Topologically sort for installation order
5. For each item in order:
   a. Install NPM dependencies
   b. Copy registry files
   c. Update mercur.json
```

### Conflict Resolution

When two items require different versions:

```
vendor-reviews@2.1.0 requires notification-service@^1.0.0
commission@1.5.0 requires notification-service@^1.2.0

Resolution: Install notification-service@1.2.x (highest compatible)
```

For breaking conflicts, prompt the user:

```
Dependency conflict detected:

  vendor-reviews@2.1.0 requires old-module@^1.0.0
  commission@1.5.0 requires old-module@^2.0.0

Options:
  1. Install old-module@2.0.0 (may break vendor-reviews)
  2. Skip commission installation
  3. Cancel

Select option [1/2/3]:
```

---

## Code Transformation

### Transformer Pipeline

When copying files from registry to project:

```typescript
const transformerPipeline = [
  transformImportPaths, // Adjust import aliases (@/ paths)
  transformModuleReferences, // Update module resolution paths
  transformTypeImports, // Handle type-only imports
  transformEnvVars, // Replace env var patterns
];
```

### Import Path Transformation

Registry files use standard relative paths, transformed to project aliases:

```typescript
// Registry source:
import { MedusaService } from "@medusajs/framework/utils";
import { ReviewService } from "../vendor-reviews/service";

// Transformed (based on mercur.json aliases):
import { MedusaService } from "@medusajs/framework/utils";
import { ReviewService } from "@/modules/vendor-reviews/service";
```

### Module Name Customization

Allow custom naming during installation:

```bash
mercur add vendor-reviews --name custom-reviews
```

Transforms:

- Directory: `src/modules/custom-reviews/`
- Module constant: `CUSTOM_REVIEWS_MODULE`
- Service class: `CustomReviewsService`

---

## Migration Strategy

### Migration Handling

Migrations are tracked specially because they affect database schema:

```json
{
  "migrations": [
    {
      "path": "modules/vendor-reviews/migrations/Migration20240101000000.ts",
      "target": "src/modules/vendor-reviews/migrations/Migration20240101000000.ts",
      "version": "2.0.0",
      "hash": "sha256:def456..."
    }
  ]
}
```

### Installation Process

```
1. Copy migration files to target directory
2. Register in mercur.json with hash
3. Prompt: "Run migrations now? [y/N]"
4. If yes: Execute `npx medusa db:migrate`
5. If no: Display reminder message
```

### Update Strategy

When updating an item with new migrations:

```
vendor-reviews update: 2.0.0 -> 2.1.0

New migrations detected:
  + Migration20240601000000.ts (adds review_response table)

Options:
  1. Apply new migration files only
  2. View migration diff
  3. Skip migration (manual apply later)

Select [1/2/3]:
```

### Safety Rules

- Never modify existing migration files
- New migrations are additive only
- Track migration state in `mercur.json`
- Provide rollback documentation in item's `docs` field

---

## Versioning Strategy

### Semantic Versioning

Registry items follow semver:

- **Major**: Breaking changes to API/data model
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes

### Version Tracking

```json
{
  "installed": {
    "vendor-reviews": {
      "version": "2.1.0",
      "installedAt": "2024-01-15T10:30:00Z",
      "checksum": "sha256:abc123...",
      "modifiedFiles": ["src/modules/vendor-reviews/service.ts"]
    }
  }
}
```

### Local Modification Tracking

The CLI detects when users modify installed files:

```bash
$ mercur diff vendor-reviews

Local modifications detected:

src/modules/vendor-reviews/service.ts
  Line 45: Added custom validation logic
  Line 78: Modified return type

These changes may be overwritten during update.
Consider extracting customizations to a separate file.
```

---

## Example Usage Flows

### Flow 1: Initial Setup

```bash
# Start with existing Medusa project
cd my-medusa-store

# Initialize MercurJS
npx mercur init

# Browse available items
mercur list

# Add vendor reviews module
mercur add vendor-reviews

# Run migrations
npx medusa db:migrate

# Start development
npm run dev
```

### Flow 2: Adding Multiple Related Items

```bash
# Add commission system with related workflow
mercur add commission workflow/calculate-commission

# The CLI detects the relationship and installs in correct order
# Files created:
#   src/modules/commission/
#   src/workflows/calculate-commission.ts

# Update medusa-config.ts to include new module
```

### Flow 3: Updating an Item

```bash
# Check for updates
mercur diff --all

# Update specific item
mercur update vendor-reviews

# Review shows:
#   - New features added
#   - Your local modifications preserved in backup
#   - New migrations to apply

# After update, run new migrations
npx medusa db:migrate
```

### Flow 4: Using Third-Party Registry

```bash
# Add custom registry
# Edit mercur.json to add:
# "registries": { "@mycompany": "https://internal.mycompany.com/registry" }

# Install from custom registry
mercur add @mycompany/custom-checkout

# Works exactly like official registry items
```

---

## Third-Party Registry Development

### Building Your Own Registry

Organizations can host private registries:

```
my-registry/
├── registry.json          # Registry index
├── src/
│   ├── modules/
│   │   └── custom-module/
│   │       ├── registry.json  # Item metadata
│   │       └── ...files
│   └── workflows/
└── build/
    └── r/                     # Built registry items
        └── custom-module.json
```

### Registry Build Command

```bash
mercur registry:build

> Scanning src/ for registry items...
> Found 5 items
> Building custom-module...
>   - Validating schema
>   - Computing checksums
>   - Generating manifest
> Registry built: build/r/*.json
> Index updated: build/registry.json
```

### Hosting

Registry can be hosted on:

- Static file hosting (S3, CloudFront, Vercel)
- CDN
- Private npm registry with JSON endpoints
- Any HTTP server serving JSON files

---

## CLI Technical Architecture

### Package Structure

```
@mercurjs/cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── init.ts
│   │   ├── add.ts
│   │   ├── list.ts
│   │   ├── diff.ts
│   │   ├── update.ts
│   │   ├── info.ts
│   │   └── registry/
│   │       └── build.ts
│   ├── lib/
│   │   ├── config.ts         # mercur.json handling
│   │   ├── registry.ts       # Registry client
│   │   ├── installer.ts      # File installation
│   │   ├── transformer.ts    # Code transformation
│   │   ├── resolver.ts       # Dependency resolution
│   │   ├── differ.ts         # Diff generation
│   │   └── migrator.ts       # Migration handling
│   └── utils/
│       ├── logger.ts
│       ├── prompts.ts
│       └── fs.ts
├── schemas/
│   ├── mercur.json
│   ├── registry.json
│   └── registry-item.json
└── package.json
```

### Core Dependencies

```json
{
  "dependencies": {
    "commander": "^11.0.0",
    "prompts": "^2.4.0",
    "chalk": "^5.0.0",
    "ora": "^7.0.0",
    "fs-extra": "^11.0.0",
    "glob": "^10.0.0",
    "diff": "^5.0.0",
    "semver": "^7.5.0",
    "zod": "^3.22.0",
    "node-fetch": "^3.3.0"
  }
}
```

---

## Summary

This CLI architecture provides:

1. **Full Code Ownership** - Like shadcn, users get complete source code they can modify
2. **Type Safety** - Full TypeScript support throughout
3. **MedusaJS Compatibility** - Seamlessly extends existing Medusa projects
4. **Flexible Registry** - Supports official and third-party registries
5. **Safe Updates** - Tracks modifications, creates backups, handles migrations carefully
6. **Developer Experience** - Clear commands, helpful prompts, detailed documentation

The approach embraces MedusaJS as the foundation while providing an opinionated, feature-rich marketplace layer that developers fully own and control.

---

## References

- [shadcn/ui CLI Documentation](https://ui.shadcn.com/docs/cli)
- [shadcn/ui Registry Guide](https://ui.shadcn.com/docs/registry)
- [MedusaJS Documentation](https://docs.medusajs.com)
- [MedusaJS Modules Guide](https://docs.medusajs.com/learn/fundamentals/modules)
