import type { ScannedFiles, ResolvedRoute } from './types'
import { findClosestMatch } from './resolver'

interface GeneratedImport {
  name: string
  path: string
}

/**
 * Sort routes: static first, then dynamic, then catch-all
 */
function sortRoutes(routes: [string, string][]): [string, string][] {
  return routes.sort(([a], [b]) => {
    const scoreA = (a.includes(':') ? 1 : 0) + (a.includes('*') ? 2 : 0)
    const scoreB = (b.includes(':') ? 1 : 0) + (b.includes('*') ? 2 : 0)

    if (scoreA !== scoreB) {
      return scoreA - scoreB
    }

    return a.localeCompare(b)
  })
}

/**
 * Generate import statements from a list of imports
 */
function generateImportStatements(imports: GeneratedImport[], useNamedExport?: string): string {
  return imports
    .map(({ name, path }) =>
      useNamedExport
        ? `import { ${useNamedExport} as ${name} } from '${path}'`
        : `import ${name} from '${path}'`
    )
    .join('\n')
}

/**
 * Generate imports for layouts
 */
function generateLayoutImports(
  layouts: Map<string, string>
): { imports: GeneratedImport[]; nameMap: Map<string, string> } {
  const imports: GeneratedImport[] = []
  const nameMap = new Map<string, string>()

  let index = 0
  for (const [routePath, filePath] of layouts.entries()) {
    const name = `Layout${index++}`
    imports.push({ name, path: filePath })
    nameMap.set(routePath, name)
  }

  return { imports, nameMap }
}

/**
 * Generate imports for error boundaries
 */
function generateErrorImports(
  errors: Map<string, string>
): { imports: GeneratedImport[]; nameMap: Map<string, string> } {
  const imports: GeneratedImport[] = []
  const nameMap = new Map<string, string>()

  let index = 0
  for (const [routePath, filePath] of errors.entries()) {
    const name = `ErrorBoundary${index++}`
    imports.push({ name, path: filePath })
    nameMap.set(routePath, name)
  }

  return { imports, nameMap }
}

/**
 * Generate imports for pages
 */
function generatePageImports(
  pages: Map<string, string>
): { imports: GeneratedImport[]; routeToName: Map<string, string> } {
  const imports: GeneratedImport[] = []
  const routeToName = new Map<string, string>()

  const sortedRoutes = sortRoutes(Array.from(pages.entries()))

  let index = 0
  for (const [routePath, filePath] of sortedRoutes) {
    const name = `Page${index++}`
    imports.push({ name, path: filePath })
    routeToName.set(routePath, name)
  }

  return { imports, routeToName }
}

/**
 * Resolve routes with their layouts and error boundaries
 */
function resolveRoutes(
  pages: Map<string, string>,
  layoutMap: Map<string, string>,
  errorMap: Map<string, string>,
  pageNameMap: Map<string, string>
): ResolvedRoute[] {
  const routes: ResolvedRoute[] = []
  const sortedRoutes = sortRoutes(Array.from(pages.entries()))

  for (const [routePath, filePath] of sortedRoutes) {
    const layoutName = findClosestMatch(routePath, layoutMap)
    const errorName = findClosestMatch(routePath, errorMap)

    routes.push({
      path: routePath,
      filePath,
      source: 'user', // Will be set correctly in plugin
      layoutPath: layoutName || undefined,
      errorPath: errorName || undefined,
    })
  }

  return routes
}

/**
 * Serialize a route object to JavaScript code
 * Uses $$ markers for component references that get unquoted
 */
function serializeRouteObject(
  routePath: string,
  pageName: string,
  layoutName?: string,
  errorName?: string
): string {
  const obj: Record<string, unknown> = {
    path: routePath,
    Component: `$$${pageName}$$`,
  }

  if (layoutName) {
    obj.Layout = `$$${layoutName}$$`
  }

  if (errorName) {
    obj.ErrorBoundary = `$$${errorName}$$`
  }

  // Serialize and remove quotes around $$ markers
  return JSON.stringify(obj).replace(/"?\$\$(\w+)\$\$"?/g, '$1')
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
  const { imports: pageImports, routeToName: pageNameMap } =
    generatePageImports(pages)

  // Generate route objects
  const sortedRoutes = sortRoutes(Array.from(pages.entries()))
  const routeObjects = sortedRoutes.map(([routePath]) => {
    const pageName = pageNameMap.get(routePath)!
    const layoutName = findClosestMatch(routePath, layoutNameMap) || undefined
    const errorName = findClosestMatch(routePath, errorNameMap) || undefined

    return serializeRouteObject(routePath, pageName, layoutName, errorName)
  })

  // Combine all imports
  // Pages use named export { Component }, layouts and errors use default export
  const allImports = [
    generateImportStatements(layoutImports),
    generateImportStatements(errorImports),
    generateImportStatements(pageImports, 'Component'),
  ]
    .filter(Boolean)
    .join('\n')

  return `${allImports}

export const routes = [
  ${routeObjects.join(',\n  ')}
]

export default routes
`
}
