import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import path from 'path'
import fs from 'fs'
import {
  VIRTUAL_MODULE_ID,
  RESOLVED_VIRTUAL_MODULE_ID,
  type MercurAppOptions,
} from './types'
import { resolveCorePackagePages, getDefaultCorePackage } from './resolver'
import { scanDirectory, mergeScannedFiles } from './scanner'
import { generateRoutesCode } from './generator'
import { createLogger, emptyScannedFiles } from './utils'

/**
 * Check if file is a page file (index.tsx/ts/jsx/js)
 */
function isPageFile(filePath: string): boolean {
  return /index\.(tsx?|jsx?)$/.test(filePath)
}

/**
 * Mercur App Vite Plugin
 *
 * Provides file-based routing with automatic route generation.
 * Supports both admin and vendor applications.
 *
 * Features:
 * - File-based routing (like Next.js)
 * - Automatic route generation from pages directory
 * - Layout support via _layout.tsx files
 * - Error boundaries via _error.tsx files
 * - User pages override core package pages
 * - HMR support for page changes
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

  const pluginName = `mercur-${type}`
  const logger = createLogger(pluginName)

  let config: ResolvedConfig
  let userPagesDir: string
  let corePagesDir: string | null

  return {
    name: `vite-plugin-${pluginName}`,
    enforce: 'pre',

    configResolved(resolvedConfig) {
      config = resolvedConfig
      userPagesDir = path.resolve(config.root, pagesDir)
      corePagesDir = resolveCorePackagePages(corePackage)
    },

    resolveId(id, importer) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }

      // Handle page import redirects
      // When core-admin imports a page, check if user has an override
      if (!importer || !corePagesDir) {
        return null
      }

      // Check if this is a page import from core-admin
      // Core imports look like: ../../pages/products/product-list or @pages/products
      let pagePath: string | null = null

      // Handle relative imports from core-admin (../../pages/*)
      if (id.startsWith('../../pages/') || id.startsWith('../pages/') || id.startsWith('./pages/')) {
        // Check if importer is within core-admin
        if (importer.includes(corePagesDir) || importer.includes('/core-admin/')) {
          // Extract page path: ../../pages/products/product-list -> products/product-list
          pagePath = id.replace(/^\.\.\/\.\.\/pages\/|^\.\.\/pages\/|^\.\/pages\//, '')
        }
      }

      // Handle aliased imports (@pages/*)
      if (id.startsWith('@pages/')) {
        pagePath = id.replace('@pages/', '')
      }

      if (!pagePath) {
        return null
      }

      // Check for user override
      // Try different file patterns
      const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js']

      for (const ext of extensions) {
        const userFilePath = path.join(userPagesDir, pagePath + ext)
        if (fs.existsSync(userFilePath)) {
          // Log override only once at startup (not for every import resolution)
          if (config.command === 'serve') {
            console.log(`[${pluginName}] Override: ${pagePath} → user`)
          }
          return userFilePath
        }
      }

      return null
    },

    async load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) {
        return null
      }

      // Scan user pages (priority)
      const userFiles = await scanDirectory(userPagesDir)

      // Scan core pages (fallback)
      let coreFiles = emptyScannedFiles()
      if (corePagesDir) {
        coreFiles = await scanDirectory(corePagesDir)
      }

      // Merge: user pages override core pages
      const mergedFiles = mergeScannedFiles(coreFiles, userFiles)

      // Log discovered routes in dev mode
      if (config.command === 'serve') {
        logger.routes(mergedFiles, userFiles, coreFiles)
      }

      return generateRoutesCode(mergedFiles)
    },

    configureServer(server: ViteDevServer) {
      // Watch user pages directory for changes
      server.watcher.add(userPagesDir)

      // Invalidate virtual module when routes change (add/remove files)
      const invalidateVirtualModule = (reason: string) => {
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          console.log(`[${pluginName}] Routes changed (${reason}), reloading...`)
          server.ws.send({ type: 'full-reload' })
        }
      }

      // Handle file additions - new routes need full reload
      server.watcher.on('add', (addedFile) => {
        if (addedFile.startsWith(userPagesDir) && isPageFile(addedFile)) {
          logger.pageAdded(addedFile)
          invalidateVirtualModule('page added')
        }
      })

      // Handle file removals - removed routes need full reload
      server.watcher.on('unlink', (removedFile) => {
        if (removedFile.startsWith(userPagesDir) && isPageFile(removedFile)) {
          logger.pageRemoved(removedFile)
          invalidateVirtualModule('page removed')
        }
      })
    },

    // Handle HMR for user page files
    handleHotUpdate({ file, modules }) {
      // Check if changed file is a user page override
      if (file.startsWith(userPagesDir) && isPageFile(file)) {
        // Let Vite handle HMR normally - React Fast Refresh will pick this up
        return modules
      }
    },
  }
}
