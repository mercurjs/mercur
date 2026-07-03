# create-mercur-app

The fastest way to start a new [Mercur](https://mercurjs.com) marketplace project.

## Usage

```bash
npm create mercur-app@latest
# or
bun create mercur-app
# or
pnpm create mercur-app
# or
yarn create mercur-app
```

You can also pass a project name and options directly:

```bash
npm create mercur-app@latest my-marketplace -- --template basic
```

## Options

| Option | Description |
| --- | --- |
| `-t, --template <template>` | Template to use (`basic` or `plugin`) |
| `-c, --cwd <cwd>` | Working directory (defaults to the current directory) |
| `--no-deps` | Skip installing dependencies |
| `--skip-db` | Skip database configuration |
| `--db-connection-string <string>` | PostgreSQL connection string |
| `--db-host <host>` | PostgreSQL host (default `localhost`) |
| `--db-port <port>` | PostgreSQL port (default `5432`) |

## Documentation

Visit [docs.mercurjs.com](https://docs.mercurjs.com) to learn more.
