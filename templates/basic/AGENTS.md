# Mercur Marketplace Project

**This is a Mercur marketplace project — an open-source AI-native multi-vendor marketplace built on MedusaJS v2.**

## Architecture

- **Foundation**: MedusaJS v2 (headless commerce)
- **Language**: TypeScript (strict)
- **Pattern**: Block-based — modules, workflows, API routes, and UI extensions installed via CLI

### Project Structure

```
├── packages/api/         # Backend API — modules, workflows, links, subscribers
├── apps/admin/           # Admin dashboard — operator panel
├── apps/vendor/          # Vendor portal — seller dashboard
└── blocks.json           # Block configuration and registry aliases
```

## Documentation

- **Docs**: https://docs.mercurjs.com
- **MCP Server**: https://docs.mercurjs.com/mcp — connect your AI agent for documentation search
- **llms.txt**: https://docs.mercurjs.com/llms.txt — machine-readable project summary

## CLI Commands

```bash
# Add blocks from the Mercur registry
mercurjs add <block-name>

# Search available blocks
mercurjs search -q "commission"

# Generate TypeScript types from API routes
mercurjs codegen

# Start development server
bun run dev
```

## Block System

Mercur uses reusable blocks installed into your project:

- **Modules** — data models and business logic (sellers, commissions, offers)
- **Links** — relationships between modules
- **Workflows** — multi-step business processes (order splitting, payouts)
- **API Routes** — HTTP endpoints for admin, vendor, and storefront
- **Admin Extensions** — UI components for the admin dashboard
- **Vendor Extensions** — UI components for the vendor portal

Install blocks:

```bash
mercurjs add seller commission payout
```

## Skills

This project includes `.claude/skills/` with domain-specific patterns for:
- Admin and vendor UI (pages, forms, tabs)
- Block discovery and installation
- Code review and UI conformance

Skills are auto-loaded by Claude Code. See `CLAUDE.md` for the full workflow guide.

## Configuration Files

- `blocks.json` — block configuration and registry path aliases
- `packages/api/medusa-config.ts` — MedusaJS configuration
- `apps/admin/vite.config.ts` — admin dashboard build config
- `apps/vendor/vite.config.ts` — vendor portal build config

## Getting Started

```bash
bun run dev
```

This starts:
- Backend API at `http://localhost:9000`
- Admin Panel at `http://localhost:7000`
- Vendor Panel at `http://localhost:7001`
