import fs from "fs"
import path from "path"
import {
    normalizePath,
    getParserOptions,
    hasDefaultExport,
    crawlModuleFiles,
} from "./utils"
import {
    parse,
    traverse,
    isArrayExpression,
    isCallExpression,
    isIdentifier,
    isObjectExpression,
    isObjectProperty,
    isStringLiteral,
    isVariableDeclaration,
    isVariableDeclarator,
} from "./babel"
import type { BuiltMercurConfig } from "./types"

type WidgetInfo = {
    zones: string[]
    id?: string
}

type WidgetResult = {
    import: string
    entry: string
}

function extractZones(value: any, zones: string[]): void {
    if (isStringLiteral(value)) {
        zones.push(value.value)
    } else if (isArrayExpression(value)) {
        for (const el of value.elements) {
            if (isStringLiteral(el)) zones.push(el.value)
        }
    }
}

function readWidgetConfig(properties: any[]): WidgetInfo | null {
    const zones: string[] = []
    let id: string | undefined

    for (const prop of properties) {
        if (!isObjectProperty(prop)) continue
        if (isIdentifier(prop.key, { name: "zone" })) {
            extractZones(prop.value, zones)
        }
        if (isIdentifier(prop.key, { name: "id" }) && isStringLiteral(prop.value)) {
            id = prop.value.value
        }
    }

    if (zones.length === 0) return null
    return { zones, id }
}

function getConfigProperties(node: any): any[] | null {
    // `defineWidgetConfig({ ... })` or a bare `{ ... }`.
    if (isCallExpression(node) && node.arguments.length > 0 && isObjectExpression(node.arguments[0])) {
        return node.arguments[0].properties
    }
    if (isObjectExpression(node)) {
        return node.properties
    }
    return null
}

function getWidgetConfig(file: string): WidgetInfo | null {
    try {
        const code = fs.readFileSync(file, "utf-8")
        const ast = parse(code, getParserOptions(file))

        if (!hasDefaultExport(ast)) return null

        let info: WidgetInfo | null = null

        const visit = (declaration: any) => {
            if (info) return
            if (!isVariableDeclaration(declaration)) return
            for (const decl of declaration.declarations) {
                if (
                    isVariableDeclarator(decl) &&
                    isIdentifier(decl.id, { name: "config" })
                ) {
                    const props = getConfigProperties(decl.init)
                    if (props) info = readWidgetConfig(props)
                }
            }
        }

        traverse(ast, {
            ExportNamedDeclaration(p: any) {
                visit(p.node.declaration)
            },
            VariableDeclaration(p: any) {
                visit(p.node)
            },
        })

        return info
    } catch {
        return null
    }
}

function hashPath(relative: string): string {
    let hash = 0
    for (let i = 0; i < relative.length; i++) {
        hash = (hash << 5) - hash + relative.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash).toString(36).slice(0, 6)
}

function widgetId(info: WidgetInfo, file: string, widgetsDir: string): string {
    if (info.id) return info.id
    const relative = normalizePath(path.relative(widgetsDir, file))
    return `Widget-${hashPath(relative)}`
}

function parseWidgetFile(
    file: string,
    widgetsDir: string,
    index: number
): WidgetResult | null {
    const info = getWidgetConfig(file)
    if (!info) return null

    const name = `Widget${index}`
    const importPath = normalizePath(file)
    const zonesLiteral = JSON.stringify(info.zones)
    const id = widgetId(info, file, widgetsDir)

    return {
        import: `import ${name} from "${importPath}"`,
        entry: `    { Component: ${name}, zone: ${zonesLiteral}, widgetId: ${JSON.stringify(
            id
        )} }`,
    }
}

/**
 * Crawl a `src/widgets` directory and return the import statements + inline
 * widget entries. Indices are offset so multiple crawls can share a namespace.
 */
export function collectWidgets(
    srcDir: string,
    startIndex = 0
): { imports: string[]; entries: string[] } {
    const widgetsDir = path.join(srcDir, "widgets")

    let index = startIndex
    const results: WidgetResult[] = []
    for (const file of crawlModuleFiles(widgetsDir)) {
        const result = parseWidgetFile(file, widgetsDir, index)
        if (result) {
            results.push(result)
            index++
        }
    }

    return {
        imports: results.map((r) => r.import),
        entries: results.map((r) => r.entry),
    }
}

export function generateWidgets({
    srcDir,
    pluginExtensions,
}: BuiltMercurConfig): string {
    const { imports, entries: widgetEntries } = collectWidgets(srcDir)

    const pluginDeclarations = pluginExtensions.map(
        (ext, i) =>
            `const __plugin${i} = (await import("${normalizePath(ext)}")).default`
    )
    const pluginSpreads = pluginExtensions.map(
        (_, i) => `    ...(__plugin${i}.widgetModule?.widgets ?? [])`
    )

    const entries = [...widgetEntries, ...pluginSpreads]

    if (imports.length === 0 && pluginDeclarations.length === 0 && entries.length === 0) {
        return `export default { widgets: [] }`
    }

    return `${imports.join("\n")}

${pluginDeclarations.join("\n")}

export default {
    widgets: [
${entries.join(",\n")}
    ]
}`
}
