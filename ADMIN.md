# Mercur UI - Admin Panel Framework Research

A comprehensive guide to building a Vite-based admin panel framework with file-based routing, pre-built pages, and user customization support.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How Similar Projects Work](#how-similar-projects-work)
   - [Medusa Admin](#medusa-admin)
   - [VitePress](#vitepress)
4. [Implementation Guide](#implementation-guide)
   - [Package Structure](#package-structure)
   - [Core Package](#core-package)
   - [Vite Plugin](#vite-plugin)
   - [CLI (Optional)](#cli-optional)
5. [Virtual Modules](#virtual-modules)
6. [Route Resolution](#route-resolution)
7. [User Experience](#user-experience)

---

## Overview

### Goals

- **File-based routing**: Users add `src/pages/products/[id]/page.tsx` and get `/products/:id` route
- **Pre-built pages**: Auth, products, customers, discounts pages included by default
- **Override mechanism**: Users can override built-in pages by creating their own
- **Configuration**: `mercur.config.ts` for title, description, theme settings
- **Zero-config start**: Works out of the box with empty Vite React project

### User Experience

```
my-project/
├── src/
│   └── pages/
│       └── products/
│           └── page.tsx      ← Overrides built-in products page
├── mercur.config.ts          ← User configuration
├── vite.config.ts            ← Uses @mercur/vite-plugin
└── package.json
```

User gets these routes automatically:
- `/auth/login` (built-in)
- `/products` (user override)
- `/products/:id` (built-in)
- `/customers` (built-in)
- `/discounts` (built-in)

---

## Architecture

### High-Level Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         User's Project                           │
├──────────────────────────────────────────────────────────────────┤
│  src/                                                            │
│  ├── pages/                    ← User's custom/override pages    │
│  │   └── products/                                               │
│  │       └── page.tsx          ← Overrides built-in products     │
│  └── ...                                                         │
│  mercur.config.ts              ← User's config                   │
│  vite.config.ts                ← Uses your plugin                │
├──────────────────────────────────────────────────────────────────┤
│                         Your Framework                           │
├──────────────────────────────────────────────────────────────────┤
│  @mercurjs/dashboard           ← Built-in pages (admin+vendor)   │
│  @mercurjs/vite-plugin         ← Route scanning, virtual modules │
│  @mercurjs/cli                 ← CLI wrapper (optional)          │
│  create-mercur                 ← Project scaffolding             │
└──────────────────────────────────────────────────────────────────┘
```

### Package Responsibilities

| Package | Purpose | Required |
|---------|---------|----------|
| `@mercurjs/dashboard` | Built-in pages (admin + vendor), components, styles, app shell | Yes |
| `@mercurjs/vite-plugin` | Route scanning, virtual modules, config loading | Yes |
| `@mercurjs/cli` | Wrapper CLI (`mercur dev/build`) | Optional |
| `create-mercur` | Project scaffolding (`npm create mercur`) | Optional |

---

## How Similar Projects Work

### Medusa Admin

Medusa uses `@medusajs/admin-vite-plugin` to scan and generate routes.

#### Route Scanning

Location: `packages/admin/admin-vite-plugin/src/routes/generate-routes.ts`

```typescript
// Scans for page files
crawl(`${source}/routes`, "page", { min: 1 })
```

#### Path Conversion

Location: `packages/admin/admin-vite-plugin/src/routes/helpers.ts`

```typescript
export function getRoute(file: string): string {
  const importPath = normalizePath(file)
  return importPath
    .replace(/.*\/admin\/(routes)/, "")       // Remove prefix
    .replace(/\[([^\]]+)\]/g, ":$1")          // [id] → :id
    .replace(/\/page\.(tsx|ts|jsx|js)$/, "")  // Remove /page.tsx
}
```

**Examples:**
| File Path | Route |
|-----------|-------|
| `src/admin/routes/custom/page.tsx` | `/custom` |
| `src/admin/routes/products/[id]/page.tsx` | `/products/:id` |

#### Config Helpers

Location: `packages/admin/admin-sdk/src/config/utils.ts`

```typescript
function createConfigHelper<TConfig>(config: TConfig): TConfig {
  return {
    ...config,
    // Tricks Fast Refresh into treating config as React component
    $$typeof: Symbol.for("react.memo"),
  }
}

export function defineRouteConfig(config: RouteConfig) {
  return createConfigHelper(config)
}

export function defineWidgetConfig(config: WidgetConfig) {
  return createConfigHelper(config)
}
```

#### Route Config Type

```typescript
export interface RouteConfig {
  label?: string              // Sidebar display label
  icon?: ComponentType        // Icon component
  nested?: NestedRoutePosition // Where to nest: "/orders", "/products"
}
```

#### Virtual Modules

```typescript
// Virtual module IDs
virtual:medusa/routes      // Route definitions
virtual:medusa/widgets     // Widget definitions
virtual:medusa/menu-items  // Sidebar navigation
```

#### AST Parsing for Exports

Medusa uses Babel to parse files and extract named exports:

```typescript
async function hasNamedExports(ast, file) {
  let hasHandle = false
  let hasLoader = false

  traverse(ast, {
    ExportNamedDeclaration(path) {
      const declaration = path.node.declaration
      if (declaration?.type === "VariableDeclaration") {
        declaration.declarations.forEach((decl) => {
          if (decl.id.name === "handle") hasHandle = true
          if (decl.id.name === "loader") hasLoader = true
        })
      }
    }
  })

  return { hasHandle, hasLoader }
}
```

---

### VitePress

VitePress transforms Markdown files to Vue components and uses virtual modules extensively.

#### Virtual Module IDs

```typescript
export const SITE_DATA_ID = '@siteData'
export const SITE_DATA_REQUEST_PATH = '/@siteData'

export function resolveAliases() {
  return {
    'vitepress': '/client/index.js',
    'vitepress/theme': '/theme-default/index.js',
    '@theme': userThemeDir || defaultThemeDir,
  }
}
```

#### Main Plugin Structure

```typescript
export function createVitePressPlugin(): Plugin[] {
  return [
    {
      name: 'vitepress',

      resolveId(id) {
        if (id === SITE_DATA_ID) {
          return SITE_DATA_REQUEST_PATH
        }
        if (id.startsWith('@theme')) {
          return id.replace('@theme', themeDir)
        }
      },

      load(id) {
        if (id === SITE_DATA_REQUEST_PATH) {
          if (isProduction && !ssr) {
            return `export default window.__VP_SITE_DATA__`
          }
          return `export default ${JSON.stringify(siteData)}`
        }
      },

      transform(code, id) {
        if (id.endsWith('.md')) {
          return markdownToVue(code, id, config)
        }
      }
    },
    rewritesPlugin(),
    dynamicRoutesPlugin(),
    localSearchPlugin(),
    staticDataPlugin(),
  ]
}
```

#### Markdown → Vue Transformation

```typescript
export function markdownToVue(src: string, file: string): MarkdownCompileResult {
  // 1. Parse frontmatter
  const { content, data: frontmatter } = matter(src)

  // 2. Render markdown to HTML
  const { html, headers, links } = md.render(content)

  // 3. Build page data
  const pageData = {
    title: frontmatter.title || inferTitle(headers),
    description: frontmatter.description,
    frontmatter,
    headers,
    relativePath: file,
  }

  // 4. Assemble Vue component
  const vueSrc = `
<script setup>
const __pageData = ${JSON.stringify(pageData)}
</script>

<template>
  <div class="vp-doc">${html}</div>
</template>
`

  return { vueSrc, pageData }
}
```

#### Dynamic Routes

```typescript
const defined = /\[(\w+?)\]/g  // matches [id], [slug]

async function resolveDynamicRoutes(routes: string[]) {
  const resolved = []

  for (const route of routes) {
    // Find .paths.ts file
    const pathsFile = route.replace('.md', '.paths.ts')
    const { paths } = await loadModule(pathsFile)

    for (const { params, content } of await paths()) {
      resolved.push({
        route: route.replace(/\[(\w+)\]/g, (_, key) => params[key]),
        params,
        content
      })
    }
  }

  return resolved
}
```

#### Why VitePress Has Its Own CLI

VitePress needs a CLI because it does **more than bundling**:

1. **SSG (Static Site Generation)** - Renders every page to static HTML
2. **Two-phase build** - Runs Vite twice (client + SSR)
3. **Post-processing** - Sitemaps, font preloads, search indexes
4. **Config layer** - Has its own config format on top of Vite

```
vitepress build
      │
      ▼
┌─────────────────────────────┐
│ 1. Resolve VitePress config │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│ 2. Vite Build #1: Client    │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│ 3. Vite Build #2: SSR       │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│ 4. Render pages to HTML     │
└─────────────────────────────┘
      │
      ▼
┌─────────────────────────────┐
│ 5. Generate sitemap, etc.   │
└─────────────────────────────┘
```

---

## Implementation Guide

### Package Structure

```
packages/
├── dashboard/                   # @mercurjs/dashboard - Admin & Vendor UI
│   ├── src/
│   │   ├── admin/               # Admin panel pages
│   │   │   ├── auth/
│   │   │   │   └── login/page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── components/
│   │   │   │           ├── product-general-section.tsx
│   │   │   │           ├── product-media-section.tsx
│   │   │   │           └── ...
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   └── customers/
│   │   │       └── page.tsx
│   │   │
│   │   ├── vendor/              # Vendor panel pages
│   │   │   ├── auth/
│   │   │   │   └── login/page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── components/
│   │   │   │           ├── product-general-section.tsx
│   │   │   │           └── ...
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── shared/              # Shared between admin & vendor
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── layouts/         # Layout components (TwoColumnPage, etc.)
│   │   │   ├── hooks/           # Shared hooks (useProduct, etc.)
│   │   │   └── styles/          # Base styles
│   │   │       └── globals.css
│   │   │
│   │   └── app.tsx              # App shell
│   └── package.json
│
├── vite-plugin/                 # @mercurjs/vite-plugin
│   ├── src/
│   │   ├── index.ts             # Main plugin export
│   │   ├── plugins/
│   │   │   ├── config-plugin.ts
│   │   │   ├── routes-plugin.ts
│   │   │   └── styles-plugin.ts
│   │   ├── scanner.ts           # File scanner
│   │   ├── generator.ts         # Code generator
│   │   └── types.ts
│   └── package.json
│
├── cli/                         # @mercurjs/cli (Optional)
│   ├── src/
│   │   ├── index.ts
│   │   └── commands/
│   └── package.json
│
└── create-mercur/               # Project scaffolding
    └── ...
```

---

### Core Package

#### Built-in Page Example

```tsx
// packages/core/src/pages/products/page.tsx
import { Container, DataTable } from '@mercur/ui'

export default function ProductsPage() {
  return (
    <Container>
      <h1>Products</h1>
      <DataTable columns={[...]} data={[...]} />
    </Container>
  )
}

// Route metadata
export const route = {
  label: 'Products',
  icon: 'package',
  sidebar: true,
}
```

#### App Shell

```tsx
// packages/core/src/app.tsx
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useRoutes } from 'virtual:mercur/routes'
import { useConfig } from 'virtual:mercur/config'
import 'virtual:mercur/styles'

export function MercurApp() {
  const routes = useRoutes()
  const config = useConfig()

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={routes} />
    </QueryClientProvider>
  )
}
```

#### Entry Point

```tsx
// packages/core/src/main.tsx
import { createRoot } from 'react-dom/client'
import { MercurApp } from './app'

createRoot(document.getElementById('root')!).render(<MercurApp />)
```

---

### Vite Plugin

#### Main Plugin Export

```typescript
// packages/vite-plugin/src/index.ts
import type { Plugin } from 'vite'
import { configPlugin } from './plugins/config-plugin'
import { routesPlugin } from './plugins/routes-plugin'
import { stylesPlugin } from './plugins/styles-plugin'
import { entryPlugin } from './plugins/entry-plugin'

export interface MercurPluginOptions {
  /** Path to user's pages directory @default 'src/pages' */
  pagesDir?: string
  /** Path to config file @default 'mercur.config.ts' */
  configFile?: string
}

export function mercur(options: MercurPluginOptions = {}): Plugin[] {
  const resolved = {
    pagesDir: options.pagesDir ?? 'src/pages',
    configFile: options.configFile ?? 'mercur.config.ts',
  }

  return [
    configPlugin(resolved),   // Load mercur.config.ts
    routesPlugin(resolved),   // Scan & merge routes
    stylesPlugin(resolved),   // Inject styles
    entryPlugin(resolved),    // Provide entry point
  ]
}

export default mercur
```

#### Config Plugin

```typescript
// packages/vite-plugin/src/plugins/config-plugin.ts
import type { Plugin } from 'vite'
import { loadConfigFromFile } from 'vite'
import path from 'path'

const VIRTUAL_CONFIG_ID = 'virtual:mercur/config'
const RESOLVED_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID

export function configPlugin(options: ResolvedOptions): Plugin {
  let userConfig: MercurConfig = {}
  let root: string

  return {
    name: 'mercur:config',

    configResolved(config) {
      root = config.root
    },

    async buildStart() {
      const configPath = path.resolve(root, options.configFile)

      try {
        const result = await loadConfigFromFile(
          { command: 'serve', mode: 'development' },
          configPath
        )
        userConfig = result?.config ?? {}
      } catch {
        userConfig = {}
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_CONFIG_ID) {
        return RESOLVED_CONFIG_ID
      }
    },

    load(id) {
      if (id === RESOLVED_CONFIG_ID) {
        return `
          const config = ${JSON.stringify(userConfig)};
          export default config;
          export function useConfig() { return config; }
        `
      }
    },

    handleHotUpdate({ file, server }) {
      if (file.endsWith(options.configFile)) {
        server.restart()
      }
    },
  }
}
```

#### Routes Plugin

```typescript
// packages/vite-plugin/src/plugins/routes-plugin.ts
import type { Plugin } from 'vite'
import { scanPages, type PageFile } from '../scanner'
import { generateRoutesCode } from '../generator'
import path from 'path'

const VIRTUAL_ROUTES_ID = 'virtual:mercur/routes'
const RESOLVED_ROUTES_ID = '\0' + VIRTUAL_ROUTES_ID

const BUILTIN_PAGES_DIR = path.dirname(
  require.resolve('@mercur/core/package.json')
) + '/src/pages'

export function routesPlugin(options: ResolvedOptions): Plugin {
  let root: string
  let userPages: PageFile[] = []
  let builtinPages: PageFile[] = []

  return {
    name: 'mercur:routes',

    configResolved(config) {
      root = config.root
    },

    async buildStart() {
      // 1. Scan built-in pages from @mercur/core
      builtinPages = await scanPages(BUILTIN_PAGES_DIR, {
        prefix: '@mercur/core/src/pages',
      })

      // 2. Scan user's pages
      const userPagesDir = path.resolve(root, options.pagesDir)
      userPages = await scanPages(userPagesDir, {
        prefix: options.pagesDir,
      })
    },

    resolveId(id) {
      if (id === VIRTUAL_ROUTES_ID) {
        return RESOLVED_ROUTES_ID
      }
    },

    load(id) {
      if (id === RESOLVED_ROUTES_ID) {
        const mergedPages = mergePages(builtinPages, userPages)
        return generateRoutesCode(mergedPages)
      }
    },

    configureServer(server) {
      const userPagesDir = path.resolve(root, options.pagesDir)

      server.watcher.on('all', async (event, filePath) => {
        if (filePath.startsWith(userPagesDir) && filePath.endsWith('.tsx')) {
          userPages = await scanPages(userPagesDir, {
            prefix: options.pagesDir,
          })

          const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
        }
      })
    },
  }
}

function mergePages(builtin: PageFile[], user: PageFile[]): PageFile[] {
  const routeMap = new Map<string, PageFile>()

  // Add built-in pages first
  for (const page of builtin) {
    routeMap.set(page.route, page)
  }

  // User pages override built-in
  for (const page of user) {
    routeMap.set(page.route, page)
  }

  return Array.from(routeMap.values())
}
```

#### Page Scanner

```typescript
// packages/vite-plugin/src/scanner.ts
import { fdir } from 'fdir'
import path from 'path'
import fs from 'fs/promises'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

export interface PageFile {
  filePath: string
  importPath: string
  route: string
  meta?: RouteMeta
}

export interface RouteMeta {
  label?: string
  icon?: string
  sidebar?: boolean
}

export async function scanPages(
  dir: string,
  options: { prefix: string }
): Promise<PageFile[]> {
  try {
    await fs.access(dir)
  } catch {
    return []
  }

  const crawler = new fdir()
    .withFullPaths()
    .filter((path) => path.endsWith('page.tsx') || path.endsWith('page.ts'))
    .crawl(dir)

  const files = await crawler.withPromise()
  const pages: PageFile[] = []

  for (const filePath of files) {
    const relativePath = path.relative(dir, filePath)
    const route = filePathToRoute(relativePath)
    const importPath = `${options.prefix}/${relativePath}`.replace(/\\/g, '/')
    const meta = await extractRouteMeta(filePath)

    pages.push({ filePath, importPath, route, meta })
  }

  return pages
}

function filePathToRoute(filePath: string): string {
  return '/' + filePath
    .replace(/\\/g, '/')
    .replace(/\/page\.(tsx|ts)$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')
    .replace(/^\/+/, '')
}

async function extractRouteMeta(filePath: string): Promise<RouteMeta | undefined> {
  const code = await fs.readFile(filePath, 'utf-8')

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    })

    let meta: RouteMeta | undefined

    traverse(ast, {
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration

        if (declaration?.type === 'VariableDeclaration') {
          for (const decl of declaration.declarations) {
            if (
              decl.id.type === 'Identifier' &&
              decl.id.name === 'route' &&
              decl.init?.type === 'ObjectExpression'
            ) {
              meta = extractObjectLiteral(decl.init)
            }
          }
        }
      },
    })

    return meta
  } catch {
    return undefined
  }
}
```

#### Code Generator

```typescript
// packages/vite-plugin/src/generator.ts
import type { PageFile } from './scanner'

export function generateRoutesCode(pages: PageFile[]): string {
  const imports: string[] = []
  const routes: string[] = []

  pages.forEach((page, index) => {
    const componentName = `Page${index}`

    imports.push(`import ${componentName} from '${page.importPath}'`)

    routes.push(`{
      path: "${page.route}",
      element: <${componentName} />,
      ${page.meta ? `handle: ${JSON.stringify(page.meta)},` : ''}
    }`)
  })

  return `
import { createBrowserRouter } from 'react-router-dom'
${imports.join('\n')}

const routes = [
  ${routes.join(',\n  ')}
]

const router = createBrowserRouter(routes)

export function useRoutes() {
  return router
}

export default routes
`
}
```

#### Styles Plugin

```typescript
// packages/vite-plugin/src/plugins/styles-plugin.ts
import type { Plugin } from 'vite'
import path from 'path'
import fs from 'fs/promises'

const VIRTUAL_STYLES_ID = 'virtual:mercur/styles'
const RESOLVED_STYLES_ID = '\0' + VIRTUAL_STYLES_ID

export function stylesPlugin(options: ResolvedOptions): Plugin {
  let root: string

  return {
    name: 'mercur:styles',

    configResolved(config) {
      root = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_STYLES_ID) {
        return RESOLVED_STYLES_ID
      }
    },

    async load(id) {
      if (id === RESOLVED_STYLES_ID) {
        const coreStylesPath = require.resolve('@mercur/core/src/styles/globals.css')

        const userStylesPath = path.resolve(root, 'src/styles/globals.css')
        let userStyles = ''

        try {
          userStyles = await fs.readFile(userStylesPath, 'utf-8')
        } catch {}

        return `
          @import '${coreStylesPath}';
          ${userStyles}
        `
      }
    },
  }
}
```

#### Entry Plugin

```typescript
// packages/vite-plugin/src/plugins/entry-plugin.ts
import type { Plugin } from 'vite'

export function entryPlugin(options: ResolvedOptions): Plugin {
  return {
    name: 'mercur:entry',

    config() {
      return {
        optimizeDeps: {
          include: ['@mercur/core', 'react-router-dom', '@tanstack/react-query'],
        },
      }
    },

    transformIndexHtml(html) {
      if (!html.includes('src/main.tsx') && !html.includes('@mercur/core')) {
        return html.replace(
          '</body>',
          `<script type="module" src="@mercur/core/src/main.tsx"></script></body>`
        )
      }
      return html
    },
  }
}
```

---

### CLI (Optional)

```typescript
// packages/cli/src/index.ts
#!/usr/bin/env node
import { cac } from 'cac'
import { createServer, build, preview } from 'vite'
import { resolveConfig } from './config'

const cli = cac('mercur')

cli
  .command('[root]', 'Start dev server')
  .alias('dev')
  .action(async (root) => {
    const config = await resolveConfig(root)
    const server = await createServer(config)
    await server.listen()
    server.printUrls()
  })

cli
  .command('build [root]', 'Build for production')
  .action(async (root) => {
    const config = await resolveConfig(root, 'build')
    await build(config)
  })

cli
  .command('preview [root]', 'Preview production build')
  .action(async (root) => {
    const config = await resolveConfig(root, 'preview')
    const server = await preview(config)
    server.printUrls()
  })

cli.help()
cli.version('0.1.0')
cli.parse()
```

```typescript
// packages/cli/src/config.ts
import { loadConfigFromFile, mergeConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mercur from '@mercur/vite-plugin'

export async function resolveConfig(
  root = process.cwd(),
  command: 'serve' | 'build' | 'preview' = 'serve'
): Promise<UserConfig> {
  const userConfig = await loadConfigFromFile(
    { command, mode: command === 'build' ? 'production' : 'development' },
    undefined,
    root
  )

  const baseConfig: UserConfig = {
    root,
    plugins: [react(), mercur()],
  }

  return mergeConfig(baseConfig, userConfig?.config ?? {})
}
```

---

## Virtual Modules

### What Are Virtual Modules?

Virtual modules are modules that don't exist on disk but are generated at build time by Vite plugins.

### Pattern

```typescript
const VIRTUAL_ID = 'virtual:my-module'
const RESOLVED_ID = '\0' + VIRTUAL_ID  // \0 prefix marks as virtual

export function myPlugin(): Plugin {
  return {
    name: 'my-plugin',

    resolveId(id) {
      if (id === VIRTUAL_ID) {
        return RESOLVED_ID
      }
    },

    load(id) {
      if (id === RESOLVED_ID) {
        return `export default { /* generated content */ }`
      }
    },
  }
}
```

### Virtual Modules in Mercur

| Module | Purpose |
|--------|---------|
| `virtual:mercur/config` | User's `mercur.config.ts` as module |
| `virtual:mercur/routes` | Generated route definitions |
| `virtual:mercur/styles` | Combined styles (core + user) |

### TypeScript Support

```typescript
// packages/vite-plugin/src/client.d.ts
declare module 'virtual:mercur/config' {
  const config: MercurConfig
  export default config
  export function useConfig(): MercurConfig
}

declare module 'virtual:mercur/routes' {
  import type { RouteObject } from 'react-router-dom'
  const routes: RouteObject[]
  export default routes
  export function useRoutes(): ReturnType<typeof createBrowserRouter>
}

declare module 'virtual:mercur/styles' {}
```

---

## Route Resolution

### Override Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Route Resolution Flow                     │
└─────────────────────────────────────────────────────────────┘

1. Scan @mercur/core/src/pages/
   ┌──────────────────────────────┐
   │  /auth/login    → LoginPage  │
   │  /products      → ProductsPage│
   │  /products/:id  → ProductPage │
   │  /customers     → CustomersPage│
   │  /discounts     → DiscountsPage│
   └──────────────────────────────┘
                │
                ▼
2. Scan user's src/pages/
   ┌──────────────────────────────┐
   │  /products      → MyProductsPage │  ← User override
   │  /settings      → SettingsPage   │  ← User addition
   └──────────────────────────────┘
                │
                ▼
3. Merge (user wins)
   ┌──────────────────────────────┐
   │  /auth/login    → LoginPage      │  (built-in)
   │  /products      → MyProductsPage │  (USER OVERRIDE)
   │  /products/:id  → ProductPage    │  (built-in)
   │  /customers     → CustomersPage  │  (built-in)
   │  /discounts     → DiscountsPage  │  (built-in)
   │  /settings      → SettingsPage   │  (user added)
   └──────────────────────────────┘
                │
                ▼
4. Generate virtual:mercur/routes
```

### Path Conversion Examples

| File Path | Route |
|-----------|-------|
| `products/page.tsx` | `/products` |
| `products/[id]/page.tsx` | `/products/:id` |
| `products/[id]/edit/page.tsx` | `/products/:id/edit` |
| `auth/login/page.tsx` | `/auth/login` |

---

## User Experience

### User's vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mercur from '@mercur/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    mercur({
      pagesDir: 'src/pages',
      configFile: 'mercur.config.ts',
    }),
  ],
})
```

### User's mercur.config.ts

```typescript
import { defineConfig } from '@mercur/vite-plugin'

export default defineConfig({
  title: 'My Admin Panel',
  description: 'Powered by Mercur UI',

  theme: {
    primaryColor: '#3b82f6',
    darkMode: true,
  },

  sidebar: {
    logo: '/logo.svg',
    items: [
      { path: '/products', visible: true },
      { path: '/customers', visible: true },
      { path: '/discounts', visible: false },
    ],
  },

  auth: {
    loginPath: '/auth/login',
    redirectAfterLogin: '/products',
  },
})
```

### User's Custom Page (Override)

```tsx
// src/pages/products/page.tsx
// Overrides built-in products page

export default function CustomProductsPage() {
  return (
    <div>
      <h1>My Custom Products Page</h1>
    </div>
  )
}

export const route = {
  label: 'My Products',
  icon: 'box',
  sidebar: true,
}
```

---

## Comparison: Medusa vs VitePress vs Mercur

| Aspect | Medusa Admin | VitePress | Mercur (Proposed) |
|--------|-------------|-----------|-------------------|
| Source files | `page.tsx` | `.md` | `page.tsx` |
| Transform | TSX → Route | MD → Vue SFC | TSX → Route |
| Config export | `defineRouteConfig()` | Frontmatter | `export const route` |
| Params syntax | `[id]/page.tsx` | `[id].md` | `[id]/page.tsx` |
| Virtual modules | `virtual:medusa/*` | `@siteData`, `@theme` | `virtual:mercur/*` |
| Data loading | React Query | `.data.ts` loaders | React Query |
| AST parser | Babel | markdown-it | Babel |
| Override system | Widgets only | Themes | Full page + Composable sections |

---

## Composable Page Sections

### Philosophy

All core pages export their individual sections as composable components. This allows users to:

1. **Full Override** - Replace the entire page with custom implementation
2. **Partial Override** - Import and reuse specific sections while customizing others
3. **Automatic Updates** - Sections come from npm package, so bug fixes and patches are applied via `npm update`

### How It Works

Each page in `@mercurjs/dashboard` exports:
- A default component (the full page)
- Individual section components as named exports

```
@mercurjs/dashboard/
├── admin/
│   └── products/
│       └── [id]/
│           └── page.tsx    # Exports ProductDetail + all sections
└── vendor/
    └── products/
        └── [id]/
            └── page.tsx    # Exports ProductDetail + all sections
```

### Page Export Structure

```tsx
// @mercurjs/dashboard/vendor/products/[id]/page.tsx

// Individual sections - exported for composability
export { ProductGeneralSection } from "./components/product-general-section"
export { ProductMediaSection } from "./components/product-media-section"
export { ProductOptionSection } from "./components/product-option-section"
export { ProductVariantSection } from "./components/product-variant-section"
export { ProductSalesChannelSection } from "./components/product-sales-channel-section"
export { ProductShippingProfileSection } from "./components/product-shipping-profile-section"
export { ProductOrganizationSection } from "./components/product-organization-section"
export { ProductAttributeSection } from "./components/product-attribute-section"

// Layout components
export { TwoColumnPage } from "../../../components/layout/pages"

// Hooks
export { useProduct } from "../../../hooks/api/products"

// Constants
export { PRODUCT_DETAIL_FIELDS } from "./constants"

// Default export - the full page
export { ProductDetail as default } from "./product-detail"
```

### Override Patterns

#### Pattern 1: Full Page Override

Replace the entire page with your own implementation:

```tsx
// src/pages/vendor/products/[id]/page.tsx
export default function CustomProductDetail() {
  return (
    <div>
      <h1>My Completely Custom Product Page</h1>
      {/* Your custom implementation */}
    </div>
  )
}
```

#### Pattern 2: Partial Override - Reorder Sections

Import sections and arrange them differently:

```tsx
// src/pages/vendor/products/[id]/page.tsx
import { useParams } from "react-router-dom"
import {
  ProductGeneralSection,
  ProductMediaSection,
  ProductVariantSection,
  ProductOrganizationSection,
  TwoColumnPage,
  useProduct,
  PRODUCT_DETAIL_FIELDS,
} from "@mercurjs/dashboard/vendor/products/[id]/page"

export default function CustomProductDetail() {
  const { id } = useParams()
  const { product, isLoading } = useProduct(id!, { fields: PRODUCT_DETAIL_FIELDS })

  if (isLoading || !product) return <div>Loading...</div>

  return (
    <TwoColumnPage data={product}>
      <TwoColumnPage.Main>
        {/* Reordered: Media first, then General */}
        <ProductMediaSection product={product} />
        <ProductGeneralSection product={product} />
        <ProductVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ProductOrganizationSection product={product} />
        {/* Removed other sidebar sections */}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
```

#### Pattern 3: Partial Override - Add Custom Sections

Mix core sections with your own custom sections:

```tsx
// src/pages/vendor/products/[id]/page.tsx
import { useParams } from "react-router-dom"
import {
  ProductGeneralSection,
  ProductMediaSection,
  ProductVariantSection,
  TwoColumnPage,
  useProduct,
  PRODUCT_DETAIL_FIELDS,
} from "@mercurjs/dashboard/vendor/products/[id]/page"

// Your custom section
function ProductAnalyticsSection({ product }) {
  return (
    <div className="analytics-section">
      <h2>Product Analytics</h2>
      <p>Views: {product.metadata?.views || 0}</p>
      <p>Conversion Rate: {product.metadata?.conversion || "N/A"}</p>
    </div>
  )
}

export default function CustomProductDetail() {
  const { id } = useParams()
  const { product, isLoading } = useProduct(id!, { fields: PRODUCT_DETAIL_FIELDS })

  if (isLoading || !product) return <div>Loading...</div>

  return (
    <TwoColumnPage data={product}>
      <TwoColumnPage.Main>
        <ProductGeneralSection product={product} />
        <ProductMediaSection product={product} />
        <ProductVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        {/* Your custom section alongside core sections */}
        <ProductAnalyticsSection product={product} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
```

#### Pattern 4: Wrap a Section

Extend a core section with additional functionality:

```tsx
// src/pages/vendor/products/[id]/page.tsx
import {
  ProductGeneralSection as CoreProductGeneralSection,
  // ... other imports
} from "@mercurjs/dashboard/vendor/products/[id]/page"

// Wrap the core section with additional UI
function ProductGeneralSection({ product }) {
  return (
    <div>
      <div className="custom-badge">Featured Product</div>
      <CoreProductGeneralSection product={product} />
      <div className="custom-footer">Last updated: {product.updated_at}</div>
    </div>
  )
}

export default function CustomProductDetail() {
  // ... use your wrapped section
}
```

### Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| **Automatic Bug Fixes** | Core sections receive fixes via `npm update` |
| **Selective Customization** | Override only what you need, keep the rest |
| **Reduced Maintenance** | Less custom code to maintain |
| **Upgrade Path** | New features in sections are automatically available |
| **Type Safety** | All exports are fully typed |

### Comparison with Full Copy Approach

| Aspect | Composable Sections | Full Copy (shadcn-style) |
|--------|---------------------|--------------------------|
| Bug fixes | Automatic via npm | Manual copy-paste |
| New features | Automatic | Manual |
| Customization | High (section-level) | Complete |
| Maintenance | Low | High |
| Bundle size | Shared | Duplicated |
| Version lock | No | Yes |

### Section Component Contract

All section components follow a consistent interface:

```tsx
interface SectionProps<T> {
  // The data object (product, order, customer, etc.)
  data: T
  // Optional: Additional configuration
  config?: SectionConfig
  // Optional: Override default actions
  actions?: SectionActions
}

// Example
interface ProductSectionProps {
  product: Product
  config?: {
    showEditButton?: boolean
    collapsible?: boolean
  }
  actions?: {
    onEdit?: () => void
    onDelete?: () => void
  }
}
```

### Exported Utilities

Each page module also exports useful utilities:

```tsx
import {
  // Hooks
  useProduct,
  useUpdateProduct,
  useDeleteProduct,

  // Constants
  PRODUCT_DETAIL_FIELDS,
  PRODUCT_LIST_FIELDS,

  // Types
  type Product,
  type ProductFormData,

  // Validation schemas
  productSchema,

  // Layout components
  TwoColumnPage,
  SingleColumnPage,

} from "@mercurjs/dashboard/vendor/products/[id]/page"
```

---

## Next Steps

1. **Start with the Vite plugin** - Get route scanning and virtual modules working
2. **Add core pages** - Build built-in pages in `@mercur/core`
3. **Test override behavior** - Ensure user pages properly override built-in
4. **Add config support** - Implement `mercur.config.ts` loading
5. **Optional: Add CLI** - If you want `mercur dev` instead of `vite`
6. **Optional: Add scaffolding** - `npm create mercur`

---

## Dependencies

```json
{
  "@mercurjs/vite-plugin": {
    "dependencies": {
      "fdir": "^6.0.0",
      "@babel/parser": "^7.23.0",
      "@babel/traverse": "^7.23.0"
    },
    "peerDependencies": {
      "vite": "^5.0.0"
    }
  },
  "@mercurjs/dashboard": {
    "dependencies": {
      "react-router-dom": "^6.20.0",
      "@tanstack/react-query": "^5.0.0"
    },
    "peerDependencies": {
      "react": "^18.0.0",
      "react-dom": "^18.0.0"
    }
  }
}
```
