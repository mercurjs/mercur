# Mercur CLI

## Overview

The `@mercurjs/cli` is a TypeScript-based command-line tool built with Bun for managing code "blocks" across registries. It provides project scaffolding, component installation, and registry management capabilities.

---

## Directory Structure

```
/src
├── index.ts           # Main entry point (Commander.js setup)
├── commands/          # 8 CLI commands
│   ├── add.ts         # Add blocks to project
│   ├── build.ts       # Build registry from source
│   ├── create.ts      # Scaffold new project
│   ├── diff.ts        # Compare local vs registry versions
│   ├── info.ts        # Display project information
│   ├── init.ts        # Initialize blocks.json config
│   ├── search.ts      # Search registry blocks
│   └── view.ts        # View block details
├── preflights/        # Pre-execution validation
├── registry/          # Registry system (fetch, resolve, build)
├── schema/            # Zod validation schemas
└── utils/             # Utility functions and helpers
```

---

## Commands

### `init` - Initialize Configuration

**File:** `src/commands/init.ts`

Creates and manages `blocks.json` configuration file for the project.

**Options:**
| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `-d, --defaults` | Use default configuration values |
| `-c, --cwd` | Set working directory |
| `-s, --silent` | Suppress output |

**Flow:**
1. Validates project directory exists
2. Detects existing config (update) or creates new
3. Prompts for import aliases (workflows, api, links, modules, vendor, admin, lib)
4. Resolves aliases using tsconfig-paths
5. Writes `blocks.json`

---

### `add` - Add Blocks to Project

**File:** `src/commands/add.ts`

Installs blocks from registries into the project.

**Usage:** `mercur add <block-names...>`

**Options:**
| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip confirmation |
| `-o, --overwrite` | Overwrite existing files |
| `-c, --cwd` | Working directory |
| `-s, --silent` | Suppress output |

**Flow:**
1. Validates config exists (prompts init if missing)
2. Resolves registry tree with dependencies
3. Performs topological sort for correct ordering
4. Transforms imports to match local config
5. Writes files (prompts on conflicts)
6. Installs npm dependencies
7. Displays block documentation

---

### `create` - Create New Project

**File:** `src/commands/create.ts`

Scaffolds a new Mercur project with template, dependencies, and database.

**Usage:** `mercur create [project-name]`

**Options:**
| Flag | Description |
|------|-------------|
| `-t, --template` | Template choice (`basic` or `registry`) |
| `-y, --yes` | Skip prompts |
| `--no-deps` | Skip dependency installation |
| `--skip-db` | Skip database setup |
| `--db-connection-string` | Use existing database connection |

**Flow:**
1. Prompts for project name and template
2. Creates project directory
3. Downloads template from GitHub as tar.gz
4. Installs dependencies (auto-detects package manager)
5. Sets up PostgreSQL database with migrations/seeding
6. Manages `.env` files
7. Shows next steps

---

### `build` - Build Registry

**File:** `src/commands/build.ts`

Builds a registry from source files into distributable JSON files.

**Usage:** `mercur build [registry-path]`

**Options:**
| Flag | Description |
|------|-------------|
| `-o, --output` | Output directory (default: `./registry`) |
| `-c, --cwd` | Working directory |
| `-v, --verbose` | Verbose output |

**Flow:**
1. Reads `registry.json` source
2. For each item, recursively resolves imports using ts-morph
3. Deduplicates files and dependencies
4. Validates against schema
5. Writes individual `{name}.json` files

---

### `search` - Search Registry

**File:** `src/commands/search.ts`

Searches blocks in registries by name or description.

**Usage:** `mercur search -q <query>`

**Options:**
| Flag | Description |
|------|-------------|
| `-q, --query` | Search query string |
| `-r, --registry` | Registry to search (default: `@mercurjs`) |

**Output:** JSON array of matching items

---

### `view` - View Block Details

**File:** `src/commands/view.ts`

Displays detailed information about specific blocks.

**Usage:** `mercur view <block-names...>`

**Output:** JSON with full block definitions

---

### `diff` - Check for Updates

**File:** `src/commands/diff.ts`

Compares installed blocks with registry versions.

**Usage:** `mercur diff <block-names...>`

**Output:** Color-coded diff (green=added, red=removed)

---

### `info` - Project Information

**File:** `src/commands/info.ts`

Displays project configuration and environment details.

**Output:** JSON with config and project info

---

## Registry System Architecture

### Core Components

#### Fetcher (`src/registry/fetcher.ts`)
- Fetches registry items from URLs or local files
- Implements request caching
- Handles HTTP errors with context

#### Builder (`src/registry/builder.ts`)
- Constructs registry URLs with templating (`{name}` placeholder)
- Expands environment variables (`${VAR}` syntax)
- Manages headers and query parameters

#### Resolver (`src/registry/resolver.ts`)
- Main resolution logic with dependency handling
- **Topological sort** for correct dependency ordering
- **Circular dependency detection** using SHA256 hashing
- **Deduplication** with last-one-wins policy

#### Parser (`src/registry/parser.ts`)
- Parses `@registry/block-name` format
- Regex: `@[a-zA-Z0-9](?:[a-zA-Z0-9-_]*[a-zA-Z0-9])?/(.+)`

### Data Flow

```
User Input (block names)
       ↓
Parse Registry Namespace
       ↓
Build URLs (templating + env vars)
       ↓
Fetch JSON (with caching)
       ↓
Resolve Dependencies (recursive)
       ↓
Topological Sort
       ↓
Deduplicate Files
       ↓
Return: { files, dependencies, docs }
```

---

## Configuration Schema

### `blocks.json` Structure

```typescript
{
  aliases: {
    workflows: string,    // e.g., "@/workspace/packages/api/src/workflows"
    api: string,          // e.g., "@/workspace/packages/api/src/api"
    links: string,        // e.g., "@/workspace/packages/api/src/links"
    modules: string,      // e.g., "@/workspace/packages/api/src/modules"
    vendor: string,       // e.g., "@/workspace/apps/vendor/src/pages"
    admin: string,        // e.g., "@/workspace/apps/admin/src/pages"
    lib: string           // e.g., "@/workspace/packages/api/src/lib"
  },
  registries: {
    "@mercurjs": "https://...",
    "@custom": {
      url: "https://...",
      params: { /* query params */ },
      headers: { "Authorization": "Bearer ${API_TOKEN}" }
    }
  }
}
```

### Built-in Registry

- **Name:** `@mercurjs`
- **URL:** GitHub raw content from `mercurjs/mercur` repository

---

## Registry Item Schema

```typescript
{
  name: string,
  type: "registry:workflow" | "registry:api" | "registry:link" |
        "registry:module" | "registry:vendor" | "registry:admin" | "registry:lib",
  title?: string,
  author?: string,
  description?: string,
  dependencies?: string[],        // npm packages
  devDependencies?: string[],
  registryDependencies?: string[], // other registry items
  files: [{
    path: string,
    content: string,
    type: string,
    target?: string              // explicit target path
  }],
  docs?: string,
  meta?: Record<string, any>
}
```

---

## Utility Functions

### Configuration (`src/utils/get-config.ts`)
- `getConfig()` - Load and validate `blocks.json`
- `resolveConfigPaths()` - Resolve aliases via tsconfig-paths
- `createConfig()` - Create config with defaults

### File Operations (`src/utils/update-files.ts`)
- `updateFiles()` - Create/update project files
- Handles conflicts with user prompts
- Returns arrays: created, updated, skipped, declined

### Import Transformation (`src/utils/transform-import.ts`)
- `transformImports()` - Transform imports using ts-morph
- Maps standard aliases to configured paths
- Only processes `.ts` and `.tsx` files

### Dependencies (`src/utils/update-dependencies.ts`)
- `updateDependencies()` - Install npm packages
- Supports: npm, yarn, pnpm, bun, deno
- Auto-detects package manager

### Database (`src/utils/create-db.ts`)
- `setupDatabase()` - Create PostgreSQL database
- `runMigrations()` - Execute migrations
- `seedDatabase()` - Run seed scripts

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `commander` | CLI framework |
| `zod` | Schema validation |
| `ts-morph` | TypeScript AST manipulation |
| `tsconfig-paths` | Path alias resolution |
| `cosmiconfig` | Configuration loading |
| `prompts` | Interactive CLI prompts |
| `ora` | Spinner/progress UI |
| `kleur` | Terminal colors |
| `execa` | Command execution |
| `pg` | PostgreSQL client |
| `tar` | Archive extraction |
| `diff` | File comparison |
| `@antfu/ni` | Package manager detection |

---

## Error Handling

### Custom Error Classes (`src/registry/errors.ts`)

| Error Code | Description |
|------------|-------------|
| `NotFound` | Registry item not found (404) |
| `Unauthorized` | Authentication required (401) |
| `Forbidden` | Access denied (403) |
| `FetchError` | Network/HTTP error |
| `NotConfigured` | Registry not configured |
| `LocalFileError` | Local file read error |
| `ParseError` | JSON parse error |
| `MissingEnvironmentVariables` | Required env vars not set |
| `InvalidNamespace` | Invalid registry namespace |
| `ConfigMissingError` | blocks.json not found |
| `ConfigParseError` | Invalid blocks.json |

Each error includes:
- Error code and status
- Context information
- Actionable suggestion

---

## Architecture Patterns

### Command Pattern
Each command is a standalone Commander command with:
- Input validation (Zod)
- Preflight checks
- Configuration loading
- Error handling with suggestions

### Configuration-Driven
- All behavior driven by `blocks.json`
- Support for multiple registries
- Environment variable expansion

### Recursive Resolution
- Files reference other files via imports
- Registry items reference other items
- Both resolved recursively with cycle detection

### Transformation Pipeline
```
Raw Registry Item → Transform Imports → Write to Disk
```

---

## Development Notes

### Running Locally
```bash
bun src/index.ts --help
bun src/index.ts add <block-name>
bun src/index.ts create my-project
```

### Building Registry
```bash
bun src/index.ts build ./registry.json -o ./dist
```

### Type Checking
```bash
bun run typecheck
```