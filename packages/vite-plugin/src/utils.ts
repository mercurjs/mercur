import type { ScannedFiles } from './types'

/**
 * Create a prefixed logger for the plugin
 */
export function createLogger(pluginName: string) {
  const prefix = `[${pluginName}]`

  return {
    info: (message: string) => console.log(`${prefix} ${message}`),
    routes: (
      merged: ScannedFiles,
      user: ScannedFiles,
      core: ScannedFiles
    ) => {
      const totalRoutes = merged.pages.size
      const userRoutes = user.pages.size
      const coreRoutes = core.pages.size
      const overrides = Array.from(merged.pages.keys()).filter(
        route => user.pages.has(route) && core.pages.has(route)
      ).length

      console.log(`  Routes: ${totalRoutes} total (${coreRoutes} core, ${userRoutes} user, ${overrides} overrides)`)

      for (const [route, pageInfo] of merged.pages) {
        const isUserRoute = user.pages.has(route)
        const isCoreRoute = core.pages.has(route)
        const isOverride = isUserRoute && isCoreRoute

        const source = isUserRoute ? 'user' : 'core'
        const suffix = isOverride ? ' (override)' : ''

        // Show detected exports
        const exports = []
        if (pageInfo.exports.hasLoader) exports.push('loader')
        if (pageInfo.exports.hasHandle) exports.push('handle')
        if (pageInfo.exports.hasBreadcrumb) exports.push('Breadcrumb')
        const exportsStr = exports.length > 0 ? ` [${exports.join(', ')}]` : ''

        console.log(`  ${route} → ${source}${suffix}${exportsStr}`)
      }

      console.log('')
    },
    pageAdded: (filePath: string) => {
      console.log(`${prefix} Page added: ${filePath}`)
    },
    pageRemoved: (filePath: string) => {
      console.log(`${prefix} Page removed: ${filePath}`)
    },
  }
}

/**
 * Create empty ScannedFiles object
 */
export function emptyScannedFiles(): ScannedFiles {
  return {
    pages: new Map(),
    layouts: new Map(),
    errors: new Map(),
  }
}
