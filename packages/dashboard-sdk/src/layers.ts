import fs from "fs"
import path from "path"
import { crawlRoutes, parseFile, buildRouteTree, formatRoute } from "./routes"
import { parseMenuItemFile, formatMenuItem } from "./menu-items"
import { collectWidgets } from "./widgets"
import { collectGates } from "./gates"
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
export function collectLayer(srcDir: string, layer: number, startIndex = 0): CollectedLayer {
    const name = `__layer${layer}`
    const routesDir = path.join(srcDir, "routes")

    let index = startIndex
    const routeResults: NonNullable<ReturnType<typeof parseFile>>[] = []
    const menuItemResults: NonNullable<ReturnType<typeof parseMenuItemFile>>[] = []

    for (const file of crawlRoutes(routesDir)) {
        const route = parseFile(file, routesDir, index)
        if (route) routeResults.push(route)

        const menuItem = parseMenuItemFile(file, routesDir, index)
        if (menuItem) menuItemResults.push(menuItem)

        index++
    }

    const routeTree = buildRouteTree(routeResults)
    const routeImports = routeTree.flatMap((r) => r.imports)
    const routes = routeTree.map((r) => formatRoute(r.route))

    const menuItemImports = menuItemResults.map((r) => r.import)
    const menuItems = menuItemResults.map((r) => formatMenuItem(r.menuItem))

    const widgets = collectWidgets(srcDir, index)
    index += widgets.entries.length

    const gates = collectGates(srcDir, index)
    index += gates.entries.length

    const cfFiles = crawlModuleFiles(path.join(srcDir, "custom-fields"))
    const cfImports = cfFiles.map(
        (file, i) => `import __cf${layer}_${i} from "${normalizePath(file)}"`
    )
    const cfRefs = cfFiles.map((_, i) => `        __cf${layer}_${i}`)

    const layoutFiles = crawlModuleFiles(path.join(srcDir, "layouts"))
    const layoutImports = layoutFiles.map(
        (file, i) => `import __layout${layer}_${i} from "${normalizePath(file)}"`
    )
    const layoutRefs = layoutFiles.map((_, i) => `        __layout${layer}_${i}`)

    const i18nFile = findFile(path.join(srcDir, "i18n"), "index")
    const i18nName = `__i18n${layer}`
    const navigationFile = findFile(srcDir, NAVIGATION_FILE)
    const navigationName = `__navigation${layer}`
    const preferencesFile = findFile(srcDir, LAYOUT_PREFERENCES_FILE)
    const preferencesName = `__preferences${layer}`

    const imports = [
        ...routeImports,
        ...menuItemImports,
        ...widgets.imports,
        ...gates.imports,
        ...cfImports,
        ...layoutImports,
        ...(i18nFile ? [`import ${i18nName} from "${normalizePath(i18nFile)}"`] : []),
        ...(navigationFile
            ? [`import ${navigationName} from "${normalizePath(navigationFile)}"`]
            : []),
        ...(preferencesFile
            ? [`import ${preferencesName} from "${normalizePath(preferencesFile)}"`]
            : []),
    ]

    const declaration = `const ${name} = {
    routeModule: { routes: [
${routes.join(",\n")}
    ] },
    menuItemModule: { menuItems: [
${menuItems.join(",\n")}
    ] },
    widgetModule: { widgets: [
${widgets.entries.join(",\n")}
    ] },
    gateModule: { gates: [
${gates.entries.join(",\n")}
    ] },
    customFieldsModule: { configs: [
${cfRefs.join(",\n")}
    ] },
    layoutModule: { layouts: [
${layoutRefs.join(",\n")}
    ] },
    i18nModule: ${i18nFile ? i18nName : "{}"},
    navigationModule: ${navigationFile ? navigationName : "{}"},
    preferenceModule: ${preferencesFile ? preferencesName : "{}"},
}`

    return { imports, declaration, name, nextIndex: index }
}

export type EmittedLayers = {
    /** Import statements and crawled-layer declarations, in layer order. */
    header: string
    /** Identifiers that each evaluate to a layer's entry object, in layer order. */
    names: string[]
}

export function emitLayers(config: Pick<BuiltMercurConfig, "pluginExtensions" | "projectDir" | "srcDir">): EmittedLayers {
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

        const collected = collectLayer(source.srcDir, layer, index)
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
