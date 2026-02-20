import fs from "fs"
import path from "path"
import { VALID_FILE_EXTENSIONS } from "./constants"
import { normalizePath } from "./utils"
import type { BuiltMercurConfig } from "./types"

type Route = {
    Component: string
    path: string
    handle?: string
    loader?: string
    isPublic?: boolean
    children?: Route[]
}


type RouteResult = {
    imports: string[]
    route: Route
}

function getRoute(file: string, pagesDir: string): string {
    const importPath = normalizePath(file)
    const normalizedPagesDir = normalizePath(pagesDir)

    return importPath
        .replace(normalizedPagesDir, "")
        .replace(/\[\[\*\]\]/g, "*?")           // optional splat [[*]]
        .replace(/\[\*\]/g, "*")                // splat [*]
        .replace(/\(([^\[\]\)]+)\)/g, "$1?")    // optional static (foo)
        .replace(/\[\[([^\]]+)\]\]/g, ":$1?")   // optional dynamic [[foo]]
        .replace(/\[([^\]]+)\]/g, ":$1")        // dynamic [foo]
        .replace(
            new RegExp(
                `/page\\.(${VALID_FILE_EXTENSIONS.map((ext) => ext.slice(1)).join("|")})$`
            ),
            ""
        ) || "/"
}

function crawlPages(dir: string, pattern = "page"): string[] {
    const files: string[] = []

    if (!fs.existsSync(dir)) {
        return files
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            files.push(...crawlPages(fullPath, pattern))
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name)
            const baseName = path.basename(entry.name, ext)

            if (baseName === pattern && VALID_FILE_EXTENSIONS.includes(ext)) {
                files.push(fullPath)
            }
        }
    }

    return files
}

function hasDefaultExport(filePath: string): boolean {
    try {
        const content = fs.readFileSync(filePath, "utf-8")
        return (
            /export\s+default\s+/.test(content) ||
            /export\s*\{\s*[^}]*\s+as\s+default\s*[,}]/.test(content)
        )
    } catch {
        return false
    }
}

function hasConfigPublic(filePath: string): boolean {
    try {
        const content = fs.readFileSync(filePath, "utf-8")
        return /export\s+const\s+config\s*=\s*\{[^}]*public\s*:\s*true/.test(content)
    } catch {
        return false
    }
}

function getNamedExports(filePath: string): { hasHandle: boolean; hasLoader: boolean } {
    try {
        const content = fs.readFileSync(filePath, "utf-8")

        const hasHandle =
            /export\s+(const|function|async\s+function)\s+handle\b/.test(content) ||
            /export\s*\{[^}]*\bhandle\b[^}]*\}/.test(content)

        const hasLoader =
            /export\s+(const|function|async\s+function)\s+loader\b/.test(content) ||
            /export\s*\{[^}]*\bloader\b[^}]*\}/.test(content)

        return { hasHandle, hasLoader }
    } catch {
        return { hasHandle: false, hasLoader: false }
    }
}

function generateRouteComponentName(index: number): string {
    return `RouteComponent${index}`
}

function generateHandleName(index: number): string {
    return `RouteHandle${index}`
}

function generateLoaderName(index: number): string {
    return `RouteLoader${index}`
}

function generateImports(
    file: string,
    index: number,
    hasHandle: boolean,
    hasLoader: boolean
): string[] {
    const imports: string[] = []
    const componentName = generateRouteComponentName(index)
    const importPath = normalizePath(file)

    if (!hasHandle && !hasLoader) {
        imports.push(`import ${componentName} from "${importPath}"`)
    } else {
        const namedImports = [
            hasHandle && `handle as ${generateHandleName(index)}`,
            hasLoader && `loader as ${generateLoaderName(index)}`,
        ]
            .filter(Boolean)
            .join(", ")
        imports.push(`import ${componentName}, { ${namedImports} } from "${importPath}"`)
    }

    return imports
}

function generateRouteObject(
    routePath: string,
    index: number,
    hasHandle: boolean,
    hasLoader: boolean,
    isPublic: boolean
): Route {
    return {
        Component: generateRouteComponentName(index),
        path: routePath,
        handle: hasHandle ? generateHandleName(index) : undefined,
        loader: hasLoader ? generateLoaderName(index) : undefined,
        isPublic: isPublic || undefined,
    }
}

function formatRoute(route: Route, indent: string = "    "): string {
    let result = `${indent}{\n`
    result += `${indent}    Component: ${route.Component},\n`
    result += `${indent}    path: "${route.path}"`

    if (route.handle) {
        result += `,\n${indent}    handle: ${route.handle}`
    }

    if (route.loader) {
        result += `,\n${indent}    loader: ${route.loader}`
    }

    if (route.isPublic) {
        result += `,\n${indent}    isPublic: true`
    }

    if (route.children?.length) {
        result += `,\n${indent}    children: [\n`
        result += route.children
            .map((child) => formatRoute(child, indent + "        "))
            .join(",\n")
        result += `\n${indent}    ]`
    }

    result += `\n${indent}}`
    return result
}

function parseFile(file: string, pagesDir: string, index: number): RouteResult | null {
    if (!hasDefaultExport(file)) {
        return null
    }

    const { hasHandle, hasLoader } = getNamedExports(file)
    const isPublic = hasConfigPublic(file)
    const routePath = getRoute(file, pagesDir)

    const imports = generateImports(file, index, hasHandle, hasLoader)
    const route = generateRouteObject(routePath, index, hasHandle, hasLoader, isPublic)

    return {
        imports,
        route,
    }
}

function buildRouteTree(results: RouteResult[]): RouteResult[] {
    const routeMap = new Map<string, RouteResult>()

    const sortedResults = [...results].sort(
        (a, b) => a.route.path.split("/").length - b.route.path.split("/").length
    )

    for (const result of sortedResults) {
        const routePath = result.route.path
        const isParallel = routePath.includes("/@")

        if (isParallel) {
            const parentPath = routePath.split("/@")[0]
            const parent = routeMap.get(parentPath)

            if (parent) {
                parent.route.children = parent.route.children || []
                parent.route.children.push({
                    ...result.route,
                    path: result.route.path.replace("/@", "/"),
                })
                parent.imports.push(...result.imports)
            } else {
                routeMap.set(routePath, result)
            }
        } else {
            routeMap.set(routePath, result)
        }
    }

    return Array.from(routeMap.values())
}

export function generateRoutes({ srcDir }: BuiltMercurConfig): string {
    const pagesDir = path.join(srcDir, "pages")
    const files = crawlPages(pagesDir)

    if (files.length === 0) {
        return `export const customRoutes = []`
    }

    let index = 0
    const results: RouteResult[] = []

    for (const file of files) {
        const result = parseFile(file, pagesDir, index)
        if (result) {
            results.push(result)
            index++
        }
    }

    if (results.length === 0) {
        return `export const customRoutes = []`
    }

    const routeTree = buildRouteTree(results)
    const imports = routeTree.flatMap((result) => result.imports)
    const routes = routeTree.map((result) => formatRoute(result.route))

    return `${imports.join("\n")}

export const customRoutes = [
${routes.join(",\n")}
]`
}
