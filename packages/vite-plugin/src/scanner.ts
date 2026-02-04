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
  type NavExports,
  type NavItem,
} from './types'
import {
  filePathToRoutePath,
  getSpecialFileType,
  getDirectoryRoutePath,
} from './resolver'

/**
 * Detect which exports a page file has
 * Looks for: Component, loader, handle, Breadcrumb, isModal
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

    /**
     * Detect isModal export value
     * Looks for: export const isModal = true/false
     */
    const detectIsModal = (): boolean | undefined => {
      // Match: export const isModal = true
      const trueMatch = /export\s+const\s+isModal\s*=\s*true\b/.test(content)
      if (trueMatch) return true

      // Match: export const isModal = false
      const falseMatch = /export\s+const\s+isModal\s*=\s*false\b/.test(content)
      if (falseMatch) return false

      // Not specified
      return undefined
    }

    const hasComponent = hasExport('Component')

    // Only consider valid pages (must have Component export)
    if (!hasComponent) {
      return null
    }

    const pageExports = {
      hasComponent: true,
      hasLoader: hasExport('loader'),
      hasHandle: hasExport('handle'),
      hasBreadcrumb: hasExport('Breadcrumb'),
      isModal: detectIsModal(),
    }

    return pageExports
  } catch {
    return null
  }
}

function detectNavExports(filePath: string): NavExports | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    const navMatch = /export\s+const\s+nav\s*=\s*(\{[\s\S]*?\n\})/.exec(content)
    if (!navMatch) {
      return { hasNav: false }
    }

    try {
      const navString = navMatch[1]
        .replace(/\/\/.*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')

      const idMatch = /id:\s*["']([^"']+)["']/.exec(navString)
      if (!idMatch) {
        return { hasNav: false }
      }

      const nav: NavItem = { id: idMatch[1] }

      const labelMatch = /label:\s*["']([^"']+)["']/.exec(navString)
      if (labelMatch) nav.label = labelMatch[1]

      const labelKeyMatch = /labelKey:\s*["']([^"']+)["']/.exec(navString)
      if (labelKeyMatch) nav.labelKey = labelKeyMatch[1]

      const iconKeyMatch = /iconKey:\s*["']([^"']+)["']/.exec(navString)
      if (iconKeyMatch) nav.iconKey = iconKeyMatch[1]

      const parentMatch = /parent:\s*["']([^"']+)["']/.exec(navString)
      if (parentMatch) nav.parent = parentMatch[1]

      const sectionMatch = /section:\s*["']([^"']+)["']/.exec(navString)
      if (sectionMatch) nav.section = sectionMatch[1]

      const orderMatch = /order:\s*(\d+)/.exec(navString)
      if (orderMatch) nav.order = parseInt(orderMatch[1], 10)

      const hiddenMatch = /hidden:\s*(true|false)/.exec(navString)
      if (hiddenMatch) nav.hidden = hiddenMatch[1] === 'true'

      return { hasNav: true, nav }
    } catch {
      return { hasNav: false }
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
  const mergedPages = new Map([...base.pages, ...override.pages])

  return {
    pages: mergedPages,
    layouts: new Map([...base.layouts, ...override.layouts]),
    errors: new Map([...base.errors, ...override.errors]),
  }
}

export async function scanNavigation(
  dir: string,
  routePathPrefix: string = ''
): Promise<Map<string, NavItem>> {
  const navItems = new Map<string, NavItem>()

  if (!fs.existsSync(dir)) {
    return navItems
  }

  const files = await glob(PAGE_GLOB_PATTERN, {
    cwd: dir,
    ignore: IGNORED_DIRECTORIES,
  })

  for (const file of files) {
    const absolutePath = path.join(dir, file)
    const navExports = detectNavExports(absolutePath)

    if (navExports?.hasNav && navExports.nav) {
      const routePath = filePathToRoutePath(file)
      const nav = { ...navExports.nav }

      if (!nav.path) {
        nav.path = routePathPrefix + routePath
      }

      navItems.set(nav.id, nav)
    }
  }

  return navItems
}
