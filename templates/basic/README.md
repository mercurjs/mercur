# Mercur Basic Template

This template comes configured with the bare minimum to get started building your marketplace with Mercur.

## Quick Start

To spin up this template locally, follow these steps:

### Clone

If you've already cloned this repo, skip to [Development](#development).

### Development

1. First [clone the repo](#clone) if you have not done so already

2. Copy the example environment variables:

```bash
cd my-project
cp packages/api/.env.template packages/api/.env
```

3. Update the `.env` file with your database connection string and other required variables:

```
DATABASE_URL=postgres://user:password@localhost:5432/mercur
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
COOKIE_SECRET=your-super-secret-cookie-key
```

4. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

5. Open `http://localhost:9000` to access the Medusa backend
6. Open `http://localhost:7000` to access the admin dashboard
6. Open `http://localhost:7001` to access the vendor dashboard

That's it! Follow the on-screen instructions to login and create your first admin user.

## What's Inside

This monorepo includes the following packages and apps:

### Apps and Packages

- `packages/api` - The Medusa backend with all marketplace functionality
- `apps/admin` - Admin dashboard customizations
- `apps/vendor` - Vendor portal customizations

### Project Structure

```
├── apps/
│   ├── admin/          # Admin dashboard extensions
│   └── vendor/         # Vendor portal extensions
├── packages/
│   └── api/            # Medusa backend
│       ├── src/
│       │   ├── admin/       # Admin UI extensions
│       │   ├── api/         # Custom API routes
│       │   ├── jobs/        # Background jobs
│       │   ├── links/       # Module links
│       │   ├── modules/     # Custom modules
│       │   ├── scripts/     # CLI scripts
│       │   ├── subscribers/ # Event subscribers
│       │   └── workflows/   # Business workflows
│       └── medusa-config.ts
├── blocks.json         # Mercur blocks configuration
├── package.json
└── turbo.json
```

### Utilities

This project has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Turborepo](https://turborepo.dev/) for monorepo management
- [Prettier](https://prettier.io) for code formatting

## How It Works

The Mercur basic template is built on top of [Medusa](https://medusajs.com) and is pre-configured for marketplace functionality.

### Modules

Custom modules allow you to extend the core functionality. See the [Modules](https://docs.medusajs.com/learn/fundamentals/modules) docs for details.

### Workflows

Workflows define multi-step business processes. See the [Workflows](https://docs.medusajs.com/learn/fundamentals/workflows) docs for details.

### API Routes

Custom API routes expose HTTP endpoints. See the [API Routes](https://docs.medusajs.com/learn/fundamentals/api-routes) docs for details.

### Links

Links define relationships between modules. See the [Links](https://docs.medusajs.com/learn/fundamentals/links) docs for details.

## Adding Blocks

You can extend your project with pre-built blocks using the Mercur CLI:

```bash
npx @mercurjs/cli add block-name
```

Configure your block sources in `blocks.json`:

```json
{
  "aliases": {
    "workflows": "packages/api/src/workflows",
    "links": "packages/api/src/links",
    "api": "packages/api/src/api",
    "modules": "packages/api/src/modules"
  },
  "registries": {}
}
```

## Build

To build all apps and packages:

```bash
npm run build
```

## Questions

If you have any issues or questions start a [GitHub discussion](https://github.com/mercurjs/mercur/discussions).
