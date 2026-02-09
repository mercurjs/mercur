import fs from "fs"
import path from "path"
import { VALID_FILE_EXTENSIONS } from "./constants"
import { normalizePath } from "./utils"
import type { BuiltMercurConfig, RouteConfig, MenuItem } from "./types"

type MenuItemResult = {
    import: string
    menuItem: MenuItem
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

function getRoute(file: string, pagesDir: string): string {
    const importPath = normalizePath(file)
    const normalizedPagesDir = normalizePath(pagesDir)

    return importPath
        .replace(normalizedPagesDir, "")
        .replace(/\[\[\*\]\]/g, "*?")
        .replace(/\[\*\]/g, "*")
        .replace(/\(([^\[\]\)]+)\)/g, "$1?")
        .replace(/\[\[([^\]]+)\]\]/g, ":$1?")
        .replace(/\[([^\]]+)\]/g, ":$1")
        .replace(
            new RegExp(
                `/page\\.(${VALID_FILE_EXTENSIONS.map((ext) => ext.slice(1)).join("|")})$`
            ),
            ""
        ) || "/"
}

function hasConfigExport(filePath: string): boolean {
    try {
        const content = fs.readFileSync(filePath, "utf-8")
        return (
            /export\s+(const|let|var)\s+config\b/.test(content) ||
            /export\s*\{[^}]*\bconfig\b[^}]*\}/.test(content)
        )
    } catch {
        return false
    }
}

function getConfigProperties(filePath: string): RouteConfig | null {
    try {
        const content = fs.readFileSync(filePath, "utf-8")

        const hasLabel =
            /\blabel\s*[:=]/.test(content)

        if (!hasLabel) {
            return null
        }

        const hasIcon = /\bicon\s*[:=]/.test(content)

        const rankMatch = content.match(/\brank\s*:\s*(\d+)/)
        const rank = rankMatch ? parseInt(rankMatch[1], 10) : undefined

        const nestedMatch = content.match(/\bnested\s*:\s*["']([^"']+)["']/)
        const nested = nestedMatch ? nestedMatch[1] : undefined

        const translationNsMatch = content.match(/\btranslationNs\s*:\s*["']([^"']+)["']/)
        const translationNs = translationNsMatch ? translationNsMatch[1] : undefined

        return { label: hasLabel, icon: hasIcon, rank, nested, translationNs }
    } catch {
        return null
    }
}

function generateRouteConfigName(index: number): string {
    return `RouteConfig${index}`
}

function generateImport(file: string, index: number): string {
    const importPath = normalizePath(file)
    return `import { config as ${generateRouteConfigName(index)} } from "${importPath}"`
}

function generateMenuItem(
    config: RouteConfig,
    file: string,
    pagesDir: string,
    index: number
): MenuItem {
    const configName = generateRouteConfigName(index)
    return {
        label: `${configName}.label`,
        icon: config.icon ? `${configName}.icon` : undefined,
        path: getRoute(file, pagesDir),
        rank: config.rank,
        nested: config.nested,
        translationNs: config.translationNs
            ? `${configName}.translationNs`
            : undefined,
    }
}

function formatMenuItem(menuItem: MenuItem): string {
    const parts = [
        `        label: ${menuItem.label}`,
        `        icon: ${menuItem.icon || "undefined"}`,
        `        path: "${menuItem.path}"`,
        `        rank: ${menuItem.rank !== undefined ? menuItem.rank : "undefined"}`,
        `        nested: ${menuItem.nested ? `"${menuItem.nested}"` : "undefined"}`,
        `        translationNs: ${menuItem.translationNs || "undefined"}`,
    ]
    return `    {\n${parts.join(",\n")}\n    }`
}

function parseFile(
    file: string,
    pagesDir: string,
    index: number
): MenuItemResult | null {
    if (!hasConfigExport(file)) {
        return null
    }

    const config = getConfigProperties(file)
    if (!config) {
        return null
    }

    return {
        import: generateImport(file, index),
        menuItem: generateMenuItem(config, file, pagesDir, index),
    }
}

export function generateMenuItems({ srcDir }: BuiltMercurConfig): string {
    const pagesDir = path.join(srcDir, "pages")
    const files = crawlPages(pagesDir)

    if (files.length === 0) {
        return `export default { menuItems: [] }`
    }

    let index = 0
    const results: MenuItemResult[] = []

    for (const file of files) {
        const result = parseFile(file, pagesDir, index)
        if (result) {
            results.push(result)
            index++
        }
    }

    if (results.length === 0) {
        return `export default { menuItems: [] }`
    }

    const imports = results.map((r) => r.import)
    const menuItems = results.map((r) => formatMenuItem(r.menuItem))

    return `${imports.join("\n")}

export default {
    menuItems: [
${menuItems.join(",\n")}
    ]
}`
}
