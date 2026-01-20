# Registry Source Files

This directory contains the source files for your registry blocks. Each block should be organized in its own directory.

> Learn more about building blocks in the [Mercur documentation](https://docs.mercurjs.com).

## Block Structure

Each block directory should follow this structure:

```
src/
└── my-block/
    ├── modules/      # Custom modules with data models and services
    ├── links/        # Module link definitions
    ├── workflows/    # Business workflow definitions
    └── api/          # Custom API route handlers
```

## Creating a New Block

1. Create a new directory under `src/` with your block name
2. Add the necessary subdirectories for your block's functionality
3. Register your block in `registry.json`

## Block Components

### Modules

Modules contain your data models and business logic. Each module should have:

- `models/` - Data model definitions
- `service.ts` - Service class with business methods
- `index.ts` - Module export and registration

### Links

Links define relationships between modules from different packages.

### Workflows

Workflows define multi-step business processes with compensation logic.

### API Routes

API routes expose HTTP endpoints for your block's functionality.
