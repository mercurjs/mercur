import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'
import { SPECIAL_FILES, type MercurAppType } from './types'

// Create require for ESM compatibility
const require = createRequire(import.meta.url)

/**
 * Convert file path to route path
 *
 * @example
 * filePathToRoutePath('index.tsx') // '/'
 * filePathToRoutePath('products/index.tsx') // '/products'
 * filePathToRoutePath('products/[id].tsx') // '/products/:id'
 * filePathToRoutePath('products/[id]/edit.tsx') // '/products/:id/edit'
 * filePathToRoutePath('[...slug].tsx') // '/*'
 */
export function filePathToRoutePath(filePath: string): string {
  let route = filePath
    // Remove file extension
    .replace(/\.(tsx|ts|jsx|js)$/, '')
    // Remove index
    .replace(/\/index$/, '')
    .replace(/^index$/, '')
    // Convert [...param] to * (catch-all)
    .replace(/\[\.\.\.(\w+)\]/g, '*')
    // Convert [param] to :param
    .replace(/\[(\w+)\]/g, ':$1')

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
export function getSpecialFileType(
  fileName: string
): 'layout' | 'error' | null {
  const baseName = path.basename(fileName, path.extname(fileName))

  if (baseName === SPECIAL_FILES.LAYOUT) {
    return 'layout'
  }
  if (baseName === SPECIAL_FILES.ERROR) {
    return 'error'
  }

  return null
}

/**
 * Get route path for a directory (used for layouts/errors)
 */
export function getDirectoryRoutePath(filePath: string): string {
  const dirPath = path.dirname(filePath)
  return dirPath === '.' ? '/' : '/' + dirPath
}

/**
 * Resolve core package pages directory
 */
export function resolveCorePackagePages(corePackage: string): string | null {
  try {
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
export function getDefaultCorePackage(type: MercurAppType): string {
  const packages: Record<MercurAppType, string> = {
    admin: '@mercurjs/core-admin',
    vendor: '@mercurjs/core-vendor',
  }
  return packages[type]
}

/**
 * Find closest matching path from a map
 * Used to find layout/error for a given route
 *
 * @example
 * // layouts: { '/': Layout0, '/products': Layout1 }
 * findClosestMatch('/products/123', layouts) // 'Layout1'
 * findClosestMatch('/orders/123', layouts) // 'Layout0'
 */
export function findClosestMatch(
  routePath: string,
  map: Map<string, string>
): string | null {
  let currentPath = routePath

  while (currentPath) {
    if (map.has(currentPath)) {
      return map.get(currentPath)!
    }

    // Go up one level
    const lastSlash = currentPath.lastIndexOf('/')
    if (lastSlash <= 0) {
      // Check root
      if (map.has('/')) {
        return map.get('/')!
      }
      break
    }

    currentPath = currentPath.substring(0, lastSlash) || '/'
  }

  return null
}
