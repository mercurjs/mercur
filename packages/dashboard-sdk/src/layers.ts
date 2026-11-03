import fs from "fs"
import path from "path"
import { crawlRoutes, parseFile, buildRouteTree, formatRoute } from "./routes"
import { parseMenuItemFile, formatMenuItem } from "./menu-items"
import { collectWidgets } from "./widgets"
import { normalizePath, crawlModuleFiles } from "./utils"
import { LAYOUT_PREFERENCES_FILE, NAVIGATION_FILE, VALID_FILE_EXTENSIONS } from "./constants"
import type { BuiltMercurConfig } from "./types"

/**
 * Where a layer's extensions come from: a prebuilt plugin entry module, or a
 * source folder crawled at build time (the Medusa project's `src/<app>` and the
 * host app's `src`).
 */
export type LayerSource = { entry: string } | { srcDir: string }

export function layerSources({
    pluginExtensions,
    projectDir,
    srcDir,
}: Pick<BuiltMercurConfig, "pluginExtensions" | "projectDir" | "srcDir">): LayerSource[] {
    return [
        ...pluginExtensions.map((entry) => ({ entry })),
        ...(projectDir ? [{ srcDir: projectDir }] : []),
        { srcDir },
    ]
}

function findFile(dir: string, stem: string): string | null {
    for (const ext of VALID_FILE_EXTENSIONS) {
        const file = path.join(dir, `${stem}${ext}`)
        if (fs.existsSync(file)) return file
    }
    return null
}

export const LAYER_KEYS = [
    "routeModule",
    "menuItemModule",
    "widgetModule",
    "customFieldsModule",
    "layoutModule",
    "i18nModule",
    "navigationModule",
    "preferenceModule",
] as const

export type LayerKey = (typeof LAYER_KEYS)[number]

export type CollectedLayer = {
    imports: string[]
    /** Declares `const <name> = { routeModule, menuItemModule, ... }`. */
    declaration: string
    name: string
    nextIndex: number
}

/**
 * Crawls one source folder into the same shape a prebuilt plugin entry exports,
 * so every layer merges the same way. Identifiers carry the layer index so
 * several crawled layers can share one module.
 */
export function collectLayer(
    srcDir: string,
    layer: number,
    startIndex = 0,
    keys: readonly LayerKey[] = LAYER_KEYS
): CollectedLayer {
    const name = `__layer${layer}`
    const routesDir = path.join(srcDir, "routes")
    const wants = (key: LayerKey) => keys.includes(key)

    let index = startIndex
    const imports: string[] = []
    const fields: string[] = []

    if (wants("routeModule") || wants("menuItemModule")) {
        const routeResults: NonNullable<ReturnType<typeof parseFile>>[] = []
        const menuItemResults: NonNullable<ReturnType<typeof parseMenuItemFile>>[] = []

        for (const file of crawlRoutes(routesDir)) {
            if (wants("routeModule")) {
                const route = parseFile(file, routesDir, index)
                if (route) routeResults.push(route)
            }

            if (wants("menuItemModule")) {
                const menuItem = parseMenuItemFile(file, routesDir, index)
                if (menuItem) menuItemResults.push(menuItem)
            }

            index++
        }

        if (wants("routeModule")) {
            const routeTree = buildRouteTree(routeResults)
            imports.push(...routeTree.flatMap((r) => r.imports))
            fields.push(`routeModule: { routes: [
${routeTree.map((r) => formatRoute(r.route)).join(",\n")}
    ] }`)
        }

        if (wants("menuItemModule")) {
            imports.push(...menuItemResults.map((r) => r.import))
            fields.push(`menuItemModule: { menuItems: [
${menuItemResults.map((r) => formatMenuItem(r.menuItem)).join(",\n")}
    ] }`)
        }
    }

    if (wants("widgetModule")) {
        const widgets = collectWidgets(srcDir, index)
        index += widgets.entries.length
        imports.push(...widgets.imports)
        fields.push(`widgetModule: { widgets: [
${widgets.entries.join(",\n")}
    ] }`)
    }

    if (wants("customFieldsModule")) {
        const cfFiles = crawlModuleFiles(path.join(srcDir, "custom-fields"))
        imports.push(
            ...cfFiles.map((file, i) => `import __cf${layer}_${i} from "${normalizePath(file)}"`)
        )
        fields.push(`customFieldsModule: { configs: [
${cfFiles.map((_, i) => `        __cf${layer}_${i}`).join(",\n")}
    ] }`)
    }

    if (wants("layoutModule")) {
        const layoutFiles = crawlModuleFiles(path.join(srcDir, "layouts"))
        imports.push(
            ...layoutFiles.map(
                (file, i) => `import __layout${layer}_${i} from "${normalizePath(file)}"`
            )
        )
        fields.push(`layoutModule: { layouts: [
${layoutFiles.map((_, i) => `        __layout${layer}_${i}`).join(",\n")}
    ] }`)
    }

    const singleFiles: [LayerKey, string | null, string][] = [
        ["i18nModule", findFile(path.join(srcDir, "i18n"), "index"), `__i18n${layer}`],
        ["navigationModule", findFile(srcDir, NAVIGATION_FILE), `__navigation${layer}`],
        ["preferenceModule", findFile(srcDir, LAYOUT_PREFERENCES_FILE), `__preferences${layer}`],
    ]

    for (const [key, file, ident] of singleFiles) {
        if (!wants(key)) continue
        if (file) imports.push(`import ${ident} from "${normalizePath(file)}"`)
        fields.push(`${key}: ${file ? ident : "{}"}`)
    }

    const declaration = `const ${name} = {
${fields.map((field) => `    ${field},`).join("\n")}
}`

    return { imports, declaration, name, nextIndex: index }
}

export type EmittedLayers = {
    /** Import statements and crawled-layer declarations, in layer order. */
    header: string
    /** Identifiers that each evaluate to a layer's entry object, in layer order. */
    names: string[]
}

/**
 * Crawled layers only import what `keys` names. A module that reads, say, only
 * `i18nModule` must not import route files: a route that imports the host
 * package would close an import cycle back into that module.
 */
export function emitLayers(
    config: Pick<BuiltMercurConfig, "pluginExtensions" | "projectDir" | "srcDir">,
    keys: readonly LayerKey[]
): EmittedLayers {
    const lines: string[] = []
    const declarations: string[] = []
    const names: string[] = []
    let index = 0

    layerSources(config).forEach((source, layer) => {
        if ("entry" in source) {
            const name = `__layer${layer}`
            lines.push(`import ${name} from "${normalizePath(source.entry)}"`)
            names.push(name)
            return
        }

        const collected = collectLayer(source.srcDir, layer, index, keys)
        index = collected.nextIndex
        lines.push(...collected.imports)
        declarations.push(collected.declaration)
        names.push(collected.name)
    })

    return { header: [...lines, ...declarations].join("\n"), names }
}

/** `[...(a.key?.list ?? []), ...]` across layers, in order. */
export function spreadLayers(names: string[], key: string, list: string): string {
    return names.map((name) => `    ...(${name}.${key}?.${list} ?? [])`).join(",\n")
}
