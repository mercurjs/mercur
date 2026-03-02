# Mercur CLI

Add blocks (admin UI pages, vendor UI pages, workflows, modules, and more) from the Mercur registry to your project.

## Prerequisites

- Node.js v20 or higher

## Installation

Using npx (recommended):

```bash
npx @mercurjs/cli@canary <command>
```

Or install globally:

```bash
npm install -g @mercurjs/cli@canary
```

Any package manager works:

```bash
pnpm add -g @mercurjs/cli@canary
yarn global add @mercurjs/cli@canary
bun add -g @mercurjs/cli@canary
```

Or install locally as a dev dependency:

```bash
npm install -D @mercurjs/cli@canary
```

## Quick Start

**Create a new project:**

```bash
# Create a new Mercur project
npx @mercurjs/cli@canary create

# Create with a specific template
npx @mercurjs/cli@canary create my-mercur --template basic
```

**Or add blocks to an existing project:**

```bash
# Initialize your project
npx @mercurjs/cli@canary init

# Add a block from the registry
npx @mercurjs/cli@canary add product-review

# Search for available blocks
npx @mercurjs/cli@canary search --query product
```

---

## Commands

### `create`

Create a new Mercur project with the selected template.

```bash
npx @mercurjs/cli@canary create [name] [options]
```

**Arguments:**

| Argument | Description                                                  |
| -------- | ------------------------------------------------------------ |
| `name`   | Name of your project (optional, will prompt if not provided) |

**Options:**

| Option                            | Description                            | Default           |
| --------------------------------- | -------------------------------------- | ----------------- |
| `-t, --template <template>`       | Template to use: `basic` or `registry` | -                 |
| `-c, --cwd <path>`                | Working directory                      | Current directory |
| `-y, --yes`                       | Skip confirmation prompt               | `true`            |
| `--no-deps`                       | Skip installing dependencies           | `false`           |
| `--skip-db`                       | Skip database configuration            | `false`           |
| `--db-connection-string <string>` | PostgreSQL connection string           | -                 |

**Examples:**

```bash
# Interactive project creation
npx @mercurjs/cli@canary create

# Create with a specific name and template
npx @mercurjs/cli@canary create my-marketplace --template basic

# Create without database setup
npx @mercurjs/cli@canary create my-mercur --skip-db

# Create with a specific database connection
npx @mercurjs/cli@canary create my-mercur --db-connection-string "postgresql://user:pass@localhost:5432/mydb"
```

---

### `init`

Initialize your project and create a `blocks.json` configuration file.

```bash
npx @mercurjs/cli@canary init [options]
```

**Options:**

| Option             | Description               | Default           |
| ------------------ | ------------------------- | ----------------- |
| `-y, --yes`        | Skip confirmation prompt  | `true`            |
| `-d, --defaults`   | Use default configuration | `false`           |
| `-c, --cwd <path>` | Working directory         | Current directory |
| `-s, --silent`     | Mute output               | `false`           |

**Examples:**

```bash
# Interactive initialization
npx @mercurjs/cli@canary init

# Non-interactive with defaults
npx @mercurjs/cli@canary init --defaults

# Initialize in a specific directory
npx @mercurjs/cli@canary init --cwd ./my-project
```

---

### `add`

Add blocks to your project from the registry.

```bash
npx @mercurjs/cli@canary add <blocks...> [options]
```

**Arguments:**

| Argument | Description                              |
| -------- | ---------------------------------------- |
| `blocks` | Names of blocks to add (space-separated) |

**Options:**

| Option             | Description              | Default           |
| ------------------ | ------------------------ | ----------------- |
| `-y, --yes`        | Skip confirmation prompt | `false`           |
| `-o, --overwrite`  | Overwrite existing files | `false`           |
| `-c, --cwd <path>` | Working directory        | Current directory |
| `-s, --silent`     | Mute output              | `false`           |

**Examples:**

```bash
# Add a single block
npx @mercurjs/cli@canary add product-review

# Add multiple blocks
npx @mercurjs/cli@canary add product-review order-tracking wishlist

# Add with overwrite
npx @mercurjs/cli@canary add product-review --overwrite

# Add to a specific directory
npx @mercurjs/cli@canary add product-review --cwd ./my-project
```

---

### `search`

Search blocks from registries by name or description.

```bash
npx @mercurjs/cli@canary search [options]
```

**Options:**

| Option                      | Description             | Default           |
| --------------------------- | ----------------------- | ----------------- |
| `-q, --query <query>`       | Search query string     | -                 |
| `-r, --registry <registry>` | Registry to search from | `@mercurjs`       |
| `-c, --cwd <path>`          | Working directory       | Current directory |

**Examples:**

```bash
# Search for blocks with "product" in name or description
npx @mercurjs/cli@canary search --query product

# Search a custom registry
npx @mercurjs/cli@canary search --query review --registry @my-registry
```

---

### `view`

View detailed information about specific blocks from the registry.

```bash
npx @mercurjs/cli@canary view <blocks...> [options]
```

**Arguments:**

| Argument | Description                               |
| -------- | ----------------------------------------- |
| `blocks` | Names of blocks to view (space-separated) |

**Options:**

| Option             | Description       | Default           |
| ------------------ | ----------------- | ----------------- |
| `-c, --cwd <path>` | Working directory | Current directory |

**Examples:**

```bash
# View a block's details
npx @mercurjs/cli@canary view product-review

# View multiple blocks
npx @mercurjs/cli@canary view product-review order-tracking
```

---

### `diff`

Check for updates by comparing local files against the registry.

```bash
npx @mercurjs/cli@canary diff <blocks...> [options]
```

**Arguments:**

| Argument | Description                               |
| -------- | ----------------------------------------- |
| `blocks` | Names of blocks to diff (space-separated) |

**Options:**

| Option             | Description       | Default           |
| ------------------ | ----------------- | ----------------- |
| `-c, --cwd <path>` | Working directory | Current directory |

**Examples:**

```bash
# Check if a block has updates
npx @mercurjs/cli@canary diff product-review

# Check multiple blocks for updates
npx @mercurjs/cli@canary diff product-review order-tracking
```

---

### `build`

Build the registry from a `registry.json` file.

```bash
npx @mercurjs/cli@canary build [registry] [options]
```

**Arguments:**

| Argument   | Description                | Default           |
| ---------- | -------------------------- | ----------------- |
| `registry` | Path to registry.json file | `./registry.json` |

**Options:**

| Option                | Description                          | Default           |
| --------------------- | ------------------------------------ | ----------------- |
| `-o, --output <path>` | Destination directory for JSON files | `./r`             |
| `-c, --cwd <path>`    | Working directory                    | Current directory |
| `-v, --verbose`       | Verbose output                       | `false`           |

**Examples:**

```bash
# Build with defaults
npx @mercurjs/cli@canary build

# Build with custom paths
npx @mercurjs/cli@canary build ./my-registry.json --output ./dist/registry

# Build with verbose output
npx @mercurjs/cli@canary build --verbose
```

---

### `info`

Get information about your project and configuration.

```bash
npx @mercurjs/cli@canary info [options]
```

**Options:**

| Option             | Description       | Default           |
| ------------------ | ----------------- | ----------------- |
| `-c, --cwd <path>` | Working directory | Current directory |

**Examples:**

```bash
# Get project info
npx @mercurjs/cli@canary info

# Get info for a specific directory
npx @mercurjs/cli@canary info --cwd ./my-project
```

---

## Configuration

The CLI uses a `blocks.json` file for configuration. This file is created when you run `init`.

### Example `blocks.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/mercurjs/mercur/new/packages/registry/schema/registry.json",
  "aliases": {
    "workflows": "packages/api/src/workflows",
    "api": "packages/api/src/api",
    "links": "packages/api/src/links",
    "modules": "packages/api/src/modules",
    "vendor": "apps/vendor/src/pages",
    "admin": "apps/admin/src/pages",
    "lib": "packages/api/src/lib"
  }
}
```

### Configuration Options

| Option                | Type     | Description                           |
| --------------------- | -------- | ------------------------------------- |
| `$schema`             | `string` | JSON schema URL for validation        |
| `aliases.workflows`   | `string` | Import alias for workflows directory  |
| `aliases.api`         | `string` | Import alias for API routes directory |
| `aliases.links`       | `string` | Import alias for links directory      |
| `aliases.modules`     | `string` | Import alias for modules directory    |
| `aliases.vendor`      | `string` | Import alias for vendor panel pages   |
| `aliases.admin`       | `string` | Import alias for admin panel pages    |
| `aliases.lib`         | `string` | Import alias for lib directory        |
| `registries`          | `object` | Custom registry configurations        |

### Custom Registries

You can add custom registries to your `blocks.json`:

```json
{
  "aliases": {
    "workflows": "packages/api/src/workflows",
    "api": "packages/api/src/api",
    "links": "packages/api/src/links",
    "modules": "packages/api/src/modules",
    "vendor": "apps/vendor/src/pages",
    "admin": "apps/admin/src/pages",
    "lib": "packages/api/src/lib"
  },
  "registries": {
    "@my-registry": "https://my-registry.com/blocks/{name}.json",
    "@private": {
      "url": "https://private-registry.com/blocks/{name}.json",
      "headers": {
        "Authorization": "Bearer ${MY_AUTH_TOKEN}"
      }
    }
  }
}
```

---

## Features

- **Project Scaffolding**: Create new Mercur projects with templates
- **Automatic Dependency Resolution**: When adding a block, the CLI automatically downloads any dependencies it requires
- **Import Transformation**: Automatically transforms imports to use your configured path aliases
- **Package Manager Detection**: Detects your package manager (npm, pnpm, yarn, bun) and installs dependencies automatically
- **TypeScript Support**: Full TypeScript support
- **Database Setup**: Automatic PostgreSQL database creation and migration
- **File Conflict Handling**: Prompts for confirmation before overwriting existing files
- **Diff Preview**: Shows colorized diff output when checking for updates
- **Custom Registries**: Support for multiple registries with authentication

---

## Examples

### Creating a New Marketplace

```bash
# Create a new project
npx @mercurjs/cli@canary create my-marketplace

# Follow the prompts to:
# 1. Select a template (basic or registry)
# 2. Configure database connection
# 3. Install dependencies
```

### Adding Blocks to an Existing Project

```bash
# Initialize the CLI in your project
npx @mercurjs/cli@canary init

# Search for available blocks
npx @mercurjs/cli@canary search --query product

# Add blocks
npx @mercurjs/cli@canary add product-review order-tracking
```

### Checking for Updates

```bash
# See what changed in a block
npx @mercurjs/cli@canary diff product-review

# Update by overwriting
npx @mercurjs/cli@canary add product-review --overwrite
```

### Building a Custom Registry

```bash
# Create a registry.json file with your blocks
# Then build the registry
npx @mercurjs/cli@canary build --verbose

# Output will be in ./registry directory
```

---

## License

MIT
