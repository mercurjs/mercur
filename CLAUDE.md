# Mercur

Open source marketplace platform built on MedusaJS. Follows a shadcn-like CLI approach where code is copied directly into projects for full ownership.

## Project Structure

```
mercur/
├── packages/
│   ├── cli/              # @mercurjs/cli - CLI tool
│   └── registry/         # Official block registry
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

### CLI Commands
- `mercurjs create` - Create new Mercur project
- `mercurjs init` - Initialize existing project
- `mercurjs add <block>` - Add blocks from registry
- `mercurjs search` - Search available blocks
- `mercurjs diff` - Check for updates
- `mercurjs build` - Build custom registry

## Architecture

- **Foundation**: MedusaJS v2 (headless commerce)
- **Language**: TypeScript
- **Monorepo**: Turborepo
- **Package Manager**: npm

## Development

### CLI Package (`packages/cli`)
- Entry: `src/index.ts`
- Commands: `src/commands/`
- Utils: `src/utils/`
- Telemetry: `src/telemetry/`

### Registry Package (`packages/registry`)
- Blocks: `src/block-*/`
- Built output: `r/*.json`
- Config: `registry.json`

## Configuration Files

- `blocks.json` - Project configuration with path aliases
- `registry.json` - Registry definition with block metadata
- `medusa-config.ts` - MedusaJS configuration

## Supported Deployment Vendors
- Medusa Cloud
- Railway
- Render
- Fly.io
- Heroku
- DigitalOcean
- Koyeb
