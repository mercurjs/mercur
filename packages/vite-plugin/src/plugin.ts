import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import path from 'path'
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

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
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

      // Invalidate virtual module on file changes
      const invalidateModule = () => {
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }

      server.watcher.on('add', (addedFile) => {
        if (addedFile.startsWith(userPagesDir)) {
          logger.pageAdded(addedFile)
          invalidateModule()
        }
      })

      server.watcher.on('unlink', (removedFile) => {
        if (removedFile.startsWith(userPagesDir)) {
          logger.pageRemoved(removedFile)
          invalidateModule()
        }
      })
    },
  }
}
