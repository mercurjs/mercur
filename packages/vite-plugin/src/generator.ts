import type { ScannedFiles, PageInfo, PageExports, NavItem, NavSection } from './types'
import { findClosestMatch } from './resolver'

interface GeneratedImport {
  name: string
  path: string
  namedExports?: string[]  // For importing multiple named exports
}

interface PageImportInfo {
  componentName: string
  loaderName?: string
  handleName?: string
  breadcrumbName?: string
  filePath: string
  exports: PageExports
}

/**
 * Sort routes: static first, then dynamic, then catch-all
 * Also sorts by path depth (shallower first)
 */
function sortRoutes<T>(routes: [string, T][]): [string, T][] {
  return routes.sort(([a], [b]) => {
    // First by dynamic/catch-all score
    const scoreA = (a.includes(':') ? 1 : 0) + (a.includes('*') ? 2 : 0)
    const scoreB = (b.includes(':') ? 1 : 0) + (b.includes('*') ? 2 : 0)

    if (scoreA !== scoreB) {
      return scoreA - scoreB
    }

    // Then by path depth
    const depthA = a.split('/').length
    const depthB = b.split('/').length
    if (depthA !== depthB) {
      return depthA - depthB
    }

    // Finally alphabetically
    return a.localeCompare(b)
  })
}

/**
 * Generate import statements for layouts (default export)
 */
function generateLayoutImports(
  layouts: Map<string, string>
): { imports: string[]; nameMap: Map<string, string> } {
  const imports: string[] = []
  const nameMap = new Map<string, string>()

  let index = 0
  for (const [routePath, filePath] of layouts.entries()) {
    const name = `Layout${index++}`
    imports.push(`import ${name} from '${filePath}'`)
    nameMap.set(routePath, name)
  }

  return { imports, nameMap }
}

/**
 * Generate import statements for error boundaries (default export)
 */
function generateErrorImports(
  errors: Map<string, string>
): { imports: string[]; nameMap: Map<string, string> } {
  const imports: string[] = []
  const nameMap = new Map<string, string>()

  let index = 0
  for (const [routePath, filePath] of errors.entries()) {
    const name = `ErrorBoundary${index++}`
    imports.push(`import ${name} from '${filePath}'`)
    nameMap.set(routePath, name)
  }

  return { imports, nameMap }
}

/**
 * Generate import statements for pages
 * Imports Component and optionally loader, handle, Breadcrumb
 */
function generatePageImports(
  pages: Map<string, PageInfo>
): { imports: string[]; pageInfoMap: Map<string, PageImportInfo> } {
  const imports: string[] = []
  const pageInfoMap = new Map<string, PageImportInfo>()

  const sortedRoutes = sortRoutes(Array.from(pages.entries()))

  let index = 0
  for (const [routePath, pageInfo] of sortedRoutes) {
    const { filePath, exports } = pageInfo
    const baseIndex = index++

    // Build list of named exports to import
    const namedImports: string[] = []
    const importInfo: PageImportInfo = {
      componentName: `Page${baseIndex}`,
      filePath,
      exports,
    }

    // Component is always imported
    namedImports.push(`Component as Page${baseIndex}`)

    // Optionally import loader
    if (exports.hasLoader) {
      importInfo.loaderName = `loader${baseIndex}`
      namedImports.push(`loader as loader${baseIndex}`)
    }

    // Optionally import handle
    if (exports.hasHandle) {
      importInfo.handleName = `handle${baseIndex}`
      namedImports.push(`handle as handle${baseIndex}`)
    }

    // Optionally import Breadcrumb
    if (exports.hasBreadcrumb) {
      importInfo.breadcrumbName = `Breadcrumb${baseIndex}`
      namedImports.push(`Breadcrumb as Breadcrumb${baseIndex}`)
    }

    imports.push(`import { ${namedImports.join(', ')} } from '${filePath}'`)
    pageInfoMap.set(routePath, importInfo)
  }

  return { imports, pageInfoMap }
}

/**
 * Serialize a route object to JavaScript code
 * Uses $$ markers for references that get unquoted
 */
function serializeRouteObject(
  routePath: string,
  pageInfo: PageImportInfo,
  layoutName?: string,
  errorName?: string
): string {
  const parts: string[] = []

  // Path
  parts.push(`path: ${JSON.stringify(routePath)}`)

  // Component (always present)
  parts.push(`Component: ${pageInfo.componentName}`)

  // Loader (optional)
  if (pageInfo.loaderName) {
    parts.push(`loader: ${pageInfo.loaderName}`)
  }

  // Handle (optional)
  if (pageInfo.handleName) {
    parts.push(`handle: ${pageInfo.handleName}`)
  }

  // Breadcrumb (optional)
  if (pageInfo.breadcrumbName) {
    parts.push(`Breadcrumb: ${pageInfo.breadcrumbName}`)
  }

  // Layout (optional, from closest _layout.tsx)
  if (layoutName) {
    parts.push(`Layout: ${layoutName}`)
  }

  // ErrorBoundary (optional, from closest _error.tsx)
  if (errorName) {
    parts.push(`ErrorBoundary: ${errorName}`)
  }

  // isModal (optional, explicit modal declaration)
  if (pageInfo.exports.isModal !== undefined) {
    parts.push(`isModal: ${pageInfo.exports.isModal}`)
  }

  return `{ ${parts.join(', ')} }`
}

/**
 * Generate the complete routes module code
 */
export function generateRoutesCode(scannedFiles: ScannedFiles): string {
  const { pages, layouts, errors } = scannedFiles

  // Generate all imports
  const { imports: layoutImports, nameMap: layoutNameMap } =
    generateLayoutImports(layouts)
  const { imports: errorImports, nameMap: errorNameMap } =
    generateErrorImports(errors)
  const { imports: pageImports, pageInfoMap } =
    generatePageImports(pages)

  // Generate route objects
  const sortedRoutes = sortRoutes(Array.from(pages.entries()))
  const routeObjects = sortedRoutes.map(([routePath]) => {
    const pageInfo = pageInfoMap.get(routePath)!
    const layoutName = findClosestMatch(routePath, layoutNameMap) || undefined
    const errorName = findClosestMatch(routePath, errorNameMap) || undefined

    return serializeRouteObject(routePath, pageInfo, layoutName, errorName)
  })

  // Combine all imports
  const allImports = [
    ...layoutImports,
    ...errorImports,
    ...pageImports,
  ].filter(Boolean).join('\n')

  return `${allImports}

export const routes = [
  ${routeObjects.join(',\n  ')}
]

export default routes
`
}

export function generateNavigationCode(
  items: Map<string, NavItem>,
  sections: NavSection[]
): string {
  const sortedSections = [...sections].sort((a, b) => (a.order || 50) - (b.order || 50))
  const sortedItems = [...items.values()].sort((a, b) => (a.order || 50) - (b.order || 50))

  const sectionObjects = sortedSections.map(section => {
    const parts: string[] = []
    parts.push(`id: ${JSON.stringify(section.id)}`)
    if (section.label) parts.push(`label: ${JSON.stringify(section.label)}`)
    if (section.labelKey) parts.push(`labelKey: ${JSON.stringify(section.labelKey)}`)
    if (section.order !== undefined) parts.push(`order: ${section.order}`)
    return `{ ${parts.join(', ')} }`
  })

  const itemObjects = sortedItems.map(item => {
    const parts: string[] = []
    parts.push(`id: ${JSON.stringify(item.id)}`)
    if (item.label) parts.push(`label: ${JSON.stringify(item.label)}`)
    if (item.labelKey) parts.push(`labelKey: ${JSON.stringify(item.labelKey)}`)
    if (item.iconKey) parts.push(`iconKey: ${JSON.stringify(item.iconKey)}`)
    if (item.path) parts.push(`path: ${JSON.stringify(item.path)}`)
    if (item.parent) parts.push(`parent: ${JSON.stringify(item.parent)}`)
    if (item.section) parts.push(`section: ${JSON.stringify(item.section)}`)
    if (item.order !== undefined) parts.push(`order: ${item.order}`)
    if (item.hidden !== undefined) parts.push(`hidden: ${item.hidden}`)
    return `  ${parts.join(', ')}`
  })

  return `export const sections = [
  ${sectionObjects.join(',\n  ')}
]

export const items = [
  { ${itemObjects.join(' },\n  { ')} }
]

export default { sections, items }
`
}

