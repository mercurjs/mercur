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

      for (const [route] of merged.pages) {
        const isUserRoute = user.pages.has(route)
        const isCoreRoute = core.pages.has(route)
        const isOverride = isUserRoute && isCoreRoute

        const source = isUserRoute ? 'user' : 'core'
        const suffix = isOverride ? ' (override)' : ''

        console.log(`  ${route} → ${source}${suffix}`)
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
