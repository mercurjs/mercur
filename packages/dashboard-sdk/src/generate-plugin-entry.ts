import path from "path"
import { crawlRoutes, parseFile, buildRouteTree, formatRoute } from "./routes"
import { parseMenuItemFile, formatMenuItem } from "./menu-items"
import { normalizePath } from "./utils"
import { VALID_FILE_EXTENSIONS } from "./constants"
import fs from "fs"

function findI18nIndex(srcDir: string): string | null {
    const i18nDir = path.join(srcDir, "i18n")
    if (!fs.existsSync(i18nDir)) return null

    for (const ext of VALID_FILE_EXTENSIONS) {
        const filePath = path.join(i18nDir, `index${ext}`)
        if (fs.existsSync(filePath)) return filePath
    }

    return null
}

/**
 * Generates a plugin entry module for a given source directory (e.g. src/vendor).
 * Scans routes, menu items, and i18n — outputs a single module string
 * that exports default `{ routeModule, menuItemModule, i18nModule }`.
 */
export function generatePluginEntryModule(srcDir: string): string {
    const routesDir = path.join(srcDir, "routes")
    const files = crawlRoutes(routesDir)

    let index = 0
    const routeResults: ReturnType<typeof parseFile>[] = []
    const menuItemResults: ReturnType<typeof parseMenuItemFile>[] = []

    for (const file of files) {
        const route = parseFile(file, routesDir, index)
        if (route) {
            routeResults.push(route)
        }

        const menuItem = parseMenuItemFile(file, routesDir, index)
        if (menuItem) {
            menuItemResults.push(menuItem)
        }

        index++
    }

    const routeTree = buildRouteTree(routeResults.filter(Boolean) as any[])
    const routeImports = routeTree.flatMap((r) => r.imports)
    const routes = routeTree.map((r) => formatRoute(r.route))

    const menuItemImports = menuItemResults
        .filter(Boolean)
        .map((r) => r!.import)
    const menuItems = menuItemResults
        .filter(Boolean)
        .map((r) => formatMenuItem(r!.menuItem))

    // i18n
    const i18nFile = findI18nIndex(srcDir)
    const i18nImport = i18nFile
        ? `import i18nResources from "${normalizePath(i18nFile)}"`
        : ""
    const i18nValue = i18nFile ? "i18nResources" : "{}"

    const allImports = [...routeImports, ...menuItemImports]
    if (i18nImport) allImports.push(i18nImport)

    return `// Auto-generated plugin extensions entry
${allImports.join("\n")}

const routeModule = {
    routes: [
${routes.join(",\n")}
    ]
}

const menuItemModule = {
    menuItems: [
${menuItems.join(",\n")}
    ]
}

const plugin = {
    routeModule,
    menuItemModule,
    i18nModule: ${i18nValue},
}

export default plugin
`
}
