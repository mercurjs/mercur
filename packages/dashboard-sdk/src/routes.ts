import fs from "fs"
import path from "path"
import { VALID_FILE_EXTENSIONS } from "./constants"
import { normalizePath, getParserOptions, hasDefaultExport } from "./utils"
import {
    parse,
    traverse,
    isBooleanLiteral,
    isIdentifier,
    isObjectProperty,
    isVariableDeclaration,
    isVariableDeclarator,
} from "./babel"
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

function hasConfigPublic(ast: any): boolean {
    let found = false

    traverse(ast, {
        ExportNamedDeclaration(path: any) {
            const declaration = path.node.declaration
            if (!isVariableDeclaration(declaration)) return

            for (const decl of declaration.declarations) {
                if (
                    isVariableDeclarator(decl) &&
                    isIdentifier(decl.id, { name: "config" }) &&
                    decl.init?.type === "ObjectExpression"
                ) {
                    const publicProp = decl.init.properties.find(
                        (prop) =>
                            isObjectProperty(prop) &&
                            isIdentifier(prop.key, { name: "public" }) &&
                            isBooleanLiteral(prop.value, { value: true })
                    )
                    if (publicProp) {
                        found = true
                    }
                }
            }
        },
    })

    return found
}

function getNamedExports(ast: any): { hasHandle: boolean; hasLoader: boolean } {
    let hasHandle = false
    let hasLoader = false

    traverse(ast, {
        ExportNamedDeclaration(path: any) {
            const declaration = path.node.declaration

            if (declaration?.type === "VariableDeclaration") {
                declaration.declarations.forEach((decl: any) => {
                    if (decl.id.type === "Identifier" && decl.id.name === "handle") {
                        hasHandle = true
                    }
                    if (decl.id.type === "Identifier" && decl.id.name === "loader") {
                        hasLoader = true
                    }
                })
            }

            if (declaration?.type === "FunctionDeclaration" && declaration.id?.name === "loader") {
                hasLoader = true
            }

            if (declaration?.type === "FunctionDeclaration" && declaration.id?.name === "handle") {
                hasHandle = true
            }
        },
    })

    return { hasHandle, hasLoader }
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
        isPublic,
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
    try {
        const code = fs.readFileSync(file, "utf-8")
        const ast = parse(code, getParserOptions(file))

        if (!hasDefaultExport(ast)) {
            return null
        }

        const { hasHandle, hasLoader } = getNamedExports(ast)
        const isPublic = hasConfigPublic(ast)
        const routePath = getRoute(file, pagesDir)

        const imports = generateImports(file, index, hasHandle, hasLoader)
        const route = generateRouteObject(routePath, index, hasHandle, hasLoader, isPublic)

        return {
            imports,
            route,
        }
    } catch {
        return null
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
                parent.route.children = parent.route.children ?? []
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

export function generateRoutes({ srcDir, pluginExtensions }: BuiltMercurConfig): string {
    const pagesDir = path.join(srcDir, "pages")

    let index = 0
    const results: RouteResult[] = []

    // App's own pages
    for (const file of crawlPages(pagesDir)) {
        const result = parseFile(file, pagesDir, index)
        if (result) {
            results.push(result)
            index++
        }
    }

    // Plugin extension imports (CJS modules — use namespace import)
    const pluginImports = pluginExtensions.map((ext, i) =>
        `import * as __pluginRaw${i} from "${normalizePath(ext)}"`
    )
    const pluginUnwraps = pluginExtensions.map((_, i) =>
        `const __plugin${i} = __pluginRaw${i}.default ?? __pluginRaw${i}`
    )
    const pluginSpreads = pluginExtensions.map((_, i) =>
        `    ...(__plugin${i}.routeModule?.routes ?? [])`
    )

    const routeTree = buildRouteTree(results)
    const appImports = routeTree.flatMap((r) => r.imports)
    const appRoutes = routeTree.map((r) => formatRoute(r.route))

    const allImports = [...appImports, ...pluginImports, ...pluginUnwraps]
    const allRoutes = [...appRoutes, ...pluginSpreads]

    if (allImports.length === 0 && allRoutes.length === 0) {
        return `export const customRoutes = []`
    }

    return `${allImports.join("\n")}

export const customRoutes = [
${allRoutes.join(",\n")}
]`
}
