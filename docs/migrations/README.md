# Migration Guides

Operational migration guides for upgrading between Mercur versions.

## Available Profiles

| Profile | From | To | Status |
|---------|------|----|--------|
| [mercur-1.x-to-2.0](./mercur-1.x-to-2.0/README.md) | 1.x | 2.0 | Active |

## Structure

Each profile is a self-contained directory:

```text
<profile>/
  README.md       # complete migration guide
  dashboards.md   # custom dashboard code porting (only if needed)
```

## Adding a New Profile

1. Create a directory under `docs/migrations/` named `<source>-to-<target>/`
2. Start with `README.md` as the main guide
3. Add supporting docs as needed
4. Add to the table above
5. Update public docs in `apps/docs/` if user-facing
