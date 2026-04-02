# Mercur

**Open-source AI-native marketplace framework built on MedusaJS v2.**

Mercur provides reusable building blocks for multi-vendor marketplaces: seller management, commissions, payouts, order splitting, vendor portals, and admin dashboards. Code is copied into your project for full ownership — no black-box dependencies.

## Architecture

- **Foundation**: MedusaJS v2 (headless commerce)
- **Language**: TypeScript (strict)
- **Monorepo**: Turborepo with bun
- **Pattern**: Block-based — modules, workflows, API routes, and UI extensions installed via CLI

### Project Structure

```
mercur/
├── apps/docs/              # Documentation site (Mintlify)
├── packages/admin/         # Admin dashboard UI
├── packages/cli/           # @mercurjs/cli — scaffolding, blocks, codegen
├── packages/client/        # @mercurjs/client — typed API client
├── packages/core-plugin/   # @mercurjs/core-plugin — core Medusa plugin
├── packages/dashboard-sdk/ # Vite plugin for dashboard apps
├── packages/registry/      # Official block registry
├── packages/types/         # @mercurjs/types — shared type definitions
├── packages/vendor/        # Vendor portal UI framework
└── templates/basic/        # Starter project template
```

## Documentation

- **Docs**: https://docs.mercurjs.com
- **MCP Server**: https://docs.mercurjs.com/mcp — use with AI agents for documentation search
- **llms.txt**: https://docs.mercurjs.com/llms.txt — machine-readable project summary

## CLI Commands

```bash
# Create a new marketplace project
bunx @mercurjs/cli@latest create my-marketplace

# Add blocks from registry
bunx @mercurjs/cli@latest add <block-name>

# Generate TypeScript types from API routes
bunx @mercurjs/cli@latest codegen

# Search available blocks
bunx @mercurjs/cli@latest search -q "commission"

# View block details
bunx @mercurjs/cli@latest view <block-name>
```

## Block System

Mercur uses a block-based architecture where reusable pieces of functionality are installed into your project:

- **Modules** — data models and business logic (sellers, commissions, offers, reviews)
- **Links** — relationships between modules (e.g., linking sellers to products)
- **Workflows** — multi-step business processes (order splitting, payout calculation)
- **API Routes** — HTTP endpoints for admin, vendor, and storefront APIs
- **Admin Extensions** — UI components for the admin dashboard
- **Vendor Extensions** — UI components for the vendor portal

Install blocks with `mercurjs add`:

```bash
bunx @mercurjs/cli@latest add seller commission payout
```

## Skills

Mercur ships `.claude/skills/` with project templates. Skills provide AI agents with domain-specific patterns for admin UI, forms, tabs, compound components, and code review. They are auto-loaded by Claude Code.

## Configuration Files

- `blocks.json` — project block configuration and path aliases
- `mercur.config.ts` — dashboard/vendor app configuration
- `medusa-config.ts` — MedusaJS configuration

## Getting Started

```bash
bunx @mercurjs/cli@latest create my-marketplace
cd my-marketplace
bun run dev
```

This starts:
- Backend API at `http://localhost:9000`
- Admin Panel at `http://localhost:7000`
- Vendor Panel at `http://localhost:7001`
