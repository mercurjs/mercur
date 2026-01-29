import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import path from 'path'
import fs from 'fs'
import { glob } from 'glob'

export type MercurAppType = 'admin' | 'vendor'

export interface MercurAppOptions {
  /** Application type */
  type: MercurAppType
  /** User's pages directory (relative to project root) */
  pagesDir?: string
  /** Core package name - defaults based on type */
  corePackage?: string
}

const VIRTUAL_MODULE_ID = 'virtual:mercur-routes'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

/**
 * Convert file path to route path
 * - index.tsx -> /
 * - products/index.tsx -> /products
 * - products/[id].tsx -> /products/:id
 * - products/[id]/edit.tsx -> /products/:id/edit
 * - [...slug].tsx -> /*
 */
function filePathToRoutePath(filePath: string): string {
  let route = filePath
    // Remove file extension
    .replace(/\.(tsx|ts|jsx|js)$/, '')
    // Remove index
    .replace(/\/index$/, '')
    .replace(/^index$/, '')
    // Convert [param] to :param
    .replace(/\[\.\.\.(\w+)\]/g, '*') // [...slug] -> *
    .replace(/\[(\w+)\]/g, ':$1') // [id] -> :id

  // Ensure leading slash
  if (!route.startsWith('/')) {
    route = '/' + route
  }

  // Handle root
  if (route === '/') {
    return '/'
  }

  // Remove trailing slash
  return route.replace(/\/$/, '')
}

/**
 * Check if file is a special file (_layout, _error)
 */
function isSpecialFile(fileName: string): { isLayout: boolean; isError: boolean } {
  const baseName = path.basename(fileName, path.extname(fileName))
  return {
    isLayout: baseName === '_layout',
    isError: baseName === '_error',
  }
}

/**
 * Scan directory for page files
 */
async function scanPages(dir: string): Promise<Map<string, string>> {
  const pages = new Map<string, string>()

  if (!fs.existsSync(dir)) {
    return pages
  }

  const files = await glob('**/*.{tsx,ts,jsx,js}', {
    cwd: dir,
    ignore: ['**/_*.*', '**/components/**', '**/hooks/**', '**/utils/**'],
  })

  for (const file of files) {
    const routePath = filePathToRoutePath(file)
    pages.set(routePath, path.join(dir, file))
  }

  return pages
}

/**
 * Scan for layout and error files
 */
async function scanSpecialFiles(dir: string): Promise<{
  layouts: Map<string, string>
  errors: Map<string, string>
}> {
  const layouts = new Map<string, string>()
  const errors = new Map<string, string>()

  if (!fs.existsSync(dir)) {
    return { layouts, errors }
  }

  const files = await glob('**/_*.{tsx,ts,jsx,js}', { cwd: dir })

  for (const file of files) {
    const fullPath = path.join(dir, file)
    const dirPath = path.dirname(file)
    const routePath = dirPath === '.' ? '/' : '/' + dirPath
    const { isLayout, isError } = isSpecialFile(file)

    if (isLayout) {
      layouts.set(routePath, fullPath)
    } else if (isError) {
      errors.set(routePath, fullPath)
    }
  }

  return { layouts, errors }
}

/**
 * Generate route code for virtual module
 */
function generateRoutesCode(
  routes: Map<string, string>,
  layouts: Map<string, string>,
  errors: Map<string, string>
): string {
  const imports: string[] = []
  const routeObjects: string[] = []

  let index = 0

  // Sort routes: static first, then dynamic, then catch-all
  const sortedRoutes = Array.from(routes.entries()).sort(([a], [b]) => {
    const aScore = (a.includes(':') ? 1 : 0) + (a.includes('*') ? 2 : 0)
    const bScore = (b.includes(':') ? 1 : 0) + (b.includes('*') ? 2 : 0)
    if (aScore !== bScore) return aScore - bScore
    return a.localeCompare(b)
  })

  // Generate layout imports
  const layoutImports: string[] = []
  const layoutMap = new Map<string, string>()
  let layoutIndex = 0
  for (const [routePath, filePath] of layouts.entries()) {
    const importName = `Layout${layoutIndex++}`
    layoutImports.push(`import ${importName} from '${filePath}'`)
    layoutMap.set(routePath, importName)
  }

  // Generate error imports
  const errorImports: string[] = []
  const errorMap = new Map<string, string>()
  let errorIndex = 0
  for (const [routePath, filePath] of errors.entries()) {
    const importName = `Error${errorIndex++}`
    errorImports.push(`import ${importName} from '${filePath}'`)
    errorMap.set(routePath, importName)
  }

  // Generate page imports and route objects
  for (const [routePath, filePath] of sortedRoutes) {
    const importName = `Page${index++}`
    imports.push(`import ${importName} from '${filePath}'`)

    // Find matching layout (closest parent)
    let layoutImportName: string | null = null
    let currentPath = routePath
    while (currentPath) {
      if (layoutMap.has(currentPath)) {
        layoutImportName = layoutMap.get(currentPath)!
        break
      }
      // Go up one level
      currentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/'
      if (currentPath === '/') {
        if (layoutMap.has('/')) {
          layoutImportName = layoutMap.get('/')!
        }
        break
      }
    }

    // Find matching error boundary
    let errorImportName: string | null = null
    currentPath = routePath
    while (currentPath) {
      if (errorMap.has(currentPath)) {
        errorImportName = errorMap.get(currentPath)!
        break
      }
      currentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/'
      if (currentPath === '/') {
        if (errorMap.has('/')) {
          errorImportName = errorMap.get('/')!
        }
        break
      }
    }

    const routeObj: Record<string, unknown> = {
      path: routePath === '/' ? '/' : routePath,
      Component: `$$${importName}$$`,
    }

    if (layoutImportName) {
      routeObj.Layout = `$$${layoutImportName}$$`
    }

    if (errorImportName) {
      routeObj.ErrorBoundary = `$$${errorImportName}$$`
    }

    routeObjects.push(
      JSON.stringify(routeObj)
        .replace(/"?\$\$(\w+)\$\$"?/g, '$1') // Remove quotes around component references
    )
  }

  return `
${layoutImports.join('\n')}
${errorImports.join('\n')}
${imports.join('\n')}

export const routes = [
  ${routeObjects.join(',\n  ')}
]

export default routes
`
}

/**
 * Resolve core package pages directory
 */
function resolveCorePackagePages(corePackage: string): string | null {
  try {
    // Try to resolve the package
    const packagePath = require.resolve(`${corePackage}/package.json`)
    const packageDir = path.dirname(packagePath)

    // Check for src/pages (development) or dist/pages (built)
    const srcPages = path.join(packageDir, 'src', 'pages')
    const distPages = path.join(packageDir, 'dist', 'pages')

    if (fs.existsSync(srcPages)) {
      return srcPages
    }
    if (fs.existsSync(distPages)) {
      return distPages
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get default core package based on app type
 */
function getDefaultCorePackage(type: MercurAppType): string {
  return type === 'admin' ? '@mercurjs/core-admin' : '@mercurjs/core-vendor'
}

/**
 * Mercur App Vite Plugin
 *
 * Provides file-based routing with automatic route generation.
 * Supports both admin and vendor applications.
 *
 * @example
 * // vite.config.ts
 * import { mercurApp } from '@mercurjs/vite-plugin'
 *
 * export default {
 *   plugins: [
 *     mercurApp({ type: 'admin' })
 *   ]
 * }
 */
export function mercurApp(options: MercurAppOptions): Plugin {
  const {
    type,
    pagesDir = 'src/pages',
    corePackage = getDefaultCorePackage(type),
  } = options

  let config: ResolvedConfig
  let userPagesDir: string
  let corePagesDir: string | null
  const pluginName = `mercur-${type}`

  return {
    name: `vite-plugin-${pluginName}`,
    enforce: 'pre',

    configResolved(resolvedConfig) {
      config = resolvedConfig
      userPagesDir = path.resolve(config.root, pagesDir)
      corePagesDir = resolveCorePackagePages(corePackage)
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        // Scan user pages (priority)
        const userPages = await scanPages(userPagesDir)
        const { layouts: userLayouts, errors: userErrors } = await scanSpecialFiles(userPagesDir)

        // Scan core pages (fallback)
        let corePages = new Map<string, string>()
        let coreLayouts = new Map<string, string>()
        let coreErrors = new Map<string, string>()

        if (corePagesDir) {
          corePages = await scanPages(corePagesDir)
          const coreSpecial = await scanSpecialFiles(corePagesDir)
          coreLayouts = coreSpecial.layouts
          coreErrors = coreSpecial.errors
        }

        // Merge: user pages override core pages
        const mergedPages = new Map([...corePages, ...userPages])
        const mergedLayouts = new Map([...coreLayouts, ...userLayouts])
        const mergedErrors = new Map([...coreErrors, ...userErrors])

        // Log discovered routes in dev mode
        if (config.command === 'serve') {
          console.log(`\n[${pluginName}] Routes discovered:`)
          for (const [route] of mergedPages) {
            const isOverride = userPages.has(route) && corePages.has(route)
            const source = userPages.has(route) ? 'user' : 'core'
            console.log(`  ${route} → ${source}${isOverride ? ' (override)' : ''}`)
          }
          console.log('')
        }

        return generateRoutesCode(mergedPages, mergedLayouts, mergedErrors)
      }
    },

    configureServer(server: ViteDevServer) {
      // Watch user pages directory for changes
      server.watcher.add(userPagesDir)

      // Invalidate virtual module on file changes
      const invalidate = () => {
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }

      server.watcher.on('add', (addedFile) => {
        if (addedFile.startsWith(userPagesDir)) {
          console.log(`[${pluginName}] Page added: ${addedFile}`)
          invalidate()
        }
      })

      server.watcher.on('unlink', (removedFile) => {
        if (removedFile.startsWith(userPagesDir)) {
          console.log(`[${pluginName}] Page removed: ${removedFile}`)
          invalidate()
        }
      })
    },
  }
}
