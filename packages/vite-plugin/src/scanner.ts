import path from 'path'
import fs from 'fs'
import { glob } from 'glob'
import {
  PAGE_GLOB_PATTERN,
  SPECIAL_FILE_GLOB_PATTERN,
  IGNORED_DIRECTORIES,
  type ScannedFiles,
  type PageExports,
  type PageInfo,
} from './types'
import {
  filePathToRoutePath,
  getSpecialFileType,
  getDirectoryRoutePath,
} from './resolver'

/**
 * Detect which exports a page file has
 * Looks for: Component, loader, handle, Breadcrumb
 */
function detectPageExports(filePath: string): PageExports | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Patterns for different export styles
    const hasExport = (name: string): boolean => {
      // export { X as Name } or export { Name }
      const reExportBraces = new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`)
      // export const/function/class Name
      const reExportDirect = new RegExp(`export\\s+(const|function|class)\\s+${name}\\b`)
      // export default (only for layouts)
      const reExportDefault = name === 'default' ? /export\s+default\b/ : null

      return reExportBraces.test(content) ||
             reExportDirect.test(content) ||
             (reExportDefault?.test(content) ?? false)
    }

    const hasComponent = hasExport('Component')

    // Only consider valid pages (must have Component export)
    if (!hasComponent) {
      return null
    }

    return {
      hasComponent: true,
      hasLoader: hasExport('loader'),
      hasHandle: hasExport('handle'),
      hasBreadcrumb: hasExport('Breadcrumb'),
    }
  } catch {
    return null
  }
}

/**
 * Scan directory for page files
 * Returns a map of route path -> PageInfo (with exports detection)
 * Only includes files that export 'Component'
 */
export async function scanPages(dir: string): Promise<Map<string, PageInfo>> {
  const pages = new Map<string, PageInfo>()

  if (!fs.existsSync(dir)) {
    return pages
  }

  const files = await glob(PAGE_GLOB_PATTERN, {
    cwd: dir,
    ignore: IGNORED_DIRECTORIES,
  })

  for (const file of files) {
    const absolutePath = path.join(dir, file)
    const exports = detectPageExports(absolutePath)

    // Only include files that have Component export
    if (!exports) {
      continue
    }

    const routePath = filePathToRoutePath(file)
    pages.set(routePath, {
      filePath: absolutePath,
      exports,
    })
  }

  return pages
}

/**
 * Scan directory for special files (_layout, _error)
 * Returns maps of route path -> absolute file path for each type
 */
export async function scanSpecialFiles(dir: string): Promise<{
  layouts: Map<string, string>
  errors: Map<string, string>
}> {
  const layouts = new Map<string, string>()
  const errors = new Map<string, string>()

  if (!fs.existsSync(dir)) {
    return { layouts, errors }
  }

  const files = await glob(SPECIAL_FILE_GLOB_PATTERN, { cwd: dir })

  for (const file of files) {
    const absolutePath = path.join(dir, file)
    const routePath = getDirectoryRoutePath(file)
    const fileType = getSpecialFileType(file)

    if (fileType === 'layout') {
      layouts.set(routePath, absolutePath)
    } else if (fileType === 'error') {
      errors.set(routePath, absolutePath)
    }
  }

  return { layouts, errors }
}

/**
 * Scan a directory for all files (pages, layouts, errors)
 */
export async function scanDirectory(dir: string): Promise<ScannedFiles> {
  const [pages, { layouts, errors }] = await Promise.all([
    scanPages(dir),
    scanSpecialFiles(dir),
  ])

  return { pages, layouts, errors }
}

/**
 * Merge two ScannedFiles objects
 * Second argument (override) takes priority
 */
export function mergeScannedFiles(
  base: ScannedFiles,
  override: ScannedFiles
): ScannedFiles {
  // For pages, override completely replaces base (user pages override core)
  const mergedPages = new Map([...base.pages, ...override.pages])

  return {
    pages: mergedPages,
    layouts: new Map([...base.layouts, ...override.layouts]),
    errors: new Map([...base.errors, ...override.errors]),
  }
}
