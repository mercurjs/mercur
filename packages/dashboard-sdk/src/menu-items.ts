import fs from "fs"
import { VALID_FILE_EXTENSIONS } from "./constants"
import { normalizePath, getParserOptions } from "./utils"
import {
    parse,
    traverse,
    isIdentifier,
    isNumericLiteral,
    isObjectProperty,
    isStringLiteral,
    isVariableDeclaration,
    isVariableDeclarator,
    isCallExpression,
    isObjectExpression,
    isBooleanLiteral,
} from "./babel"
import { emitLayers, spreadLayers } from "./layers"
import type { BuiltMercurConfig } from "./types"

type MenuItemConfig = {
    label: boolean
    icon?: boolean
    rank?: number
    nested?: string
    group?: string
    translationNs?: string
    permissions?: boolean
    requireAll?: boolean
}

type MenuItem = {
    label: string
    icon?: string
    path: string
    rank?: number
    nested?: string
    group?: string
    translationNs?: string
    permissions?: string
    requireAll?: boolean
}

type MenuItemResult = {
    import: string
    menuItem: MenuItem
}

function getRoute(file: string, routesDir: string): string {
    const importPath = normalizePath(file)
    const normalizedRoutesDir = normalizePath(routesDir)

    return importPath
        .replace(normalizedRoutesDir, "")
        .replace(/\[\[\*\]\]/g, "*?")
        .replace(/\[\*\]/g, "*")
        .replace(/\(([^[\])]+)\)/g, "$1?")
        .replace(/\[\[([^\]]+)\]\]/g, ":$1?")
        .replace(/\[([^\]]+)\]/g, ":$1")
        .replace(
            new RegExp(
                `/page\\.(${VALID_FILE_EXTENSIONS.map((ext) => ext.slice(1)).join("|")})$`
            ),
            ""
        ) || "/"
}

function getConfigObjectProperties(
    path: any
): any[] | null {
    if (isVariableDeclarator(path.node)) {
        const decl = isIdentifier(path.node.id, { name: "config" }) ? path.node : null
        if (!decl) return null

        if (
            isCallExpression(decl.init) &&
            decl.init.arguments.length > 0 &&
            isObjectExpression(decl.init.arguments[0])
        ) {
            return decl.init.arguments[0].properties
        }
        if (isObjectExpression(decl.init)) {
            return decl.init.properties
        }
        return null
    }

    const declaration = path.node.declaration
    if (isVariableDeclaration(declaration)) {
        const configDecl = declaration.declarations.find(
            (d: any) => isVariableDeclarator(d) && isIdentifier(d.id, { name: "config" })
        )
        if (
            configDecl &&
            isCallExpression(configDecl.init) &&
            configDecl.init.arguments.length > 0 &&
            isObjectExpression(configDecl.init.arguments[0])
        ) {
            return configDecl.init.arguments[0].properties
        }

        // Also handle direct object expression (no wrapper call)
        const directDecl = declaration.declarations.find(
            (d: any) => isVariableDeclarator(d) && isIdentifier(d.id, { name: "config" })
        )
        if (directDecl && isObjectExpression(directDecl.init)) {
            return directDecl.init.properties
        }
    }

    return null
}

function processConfigProperties(
    properties: any[]
): MenuItemConfig | null {
    const hasProperty = (name: string) =>
        properties.some(
            (prop) => isObjectProperty(prop) && isIdentifier(prop.key, { name })
        )

    const hasLabel = hasProperty("label")
    if (!hasLabel) {
        return null
    }

    const hasIcon = hasProperty("icon")

    const nested = properties.find(
        (prop) => isObjectProperty(prop) && isIdentifier(prop.key, { name: "nested" })
    )
    let nestedValue: string | undefined
    if (nested && isObjectProperty(nested) && isStringLiteral(nested.value)) {
        nestedValue = nested.value.value
    }

    const group = properties.find(
        (prop) => isObjectProperty(prop) && isIdentifier(prop.key, { name: "group" })
    )
    let groupValue: string | undefined
    if (group && isObjectProperty(group) && isStringLiteral(group.value)) {
        groupValue = group.value.value
    }

    const translationNs = properties.find(
        (prop) => isObjectProperty(prop) && isIdentifier(prop.key, { name: "translationNs" })
    )
    let translationNsValue: string | undefined
    if (translationNs && isObjectProperty(translationNs) && isStringLiteral(translationNs.value)) {
        translationNsValue = translationNs.value.value
    }

    const rank = properties.find(
        (prop) => isObjectProperty(prop) && isIdentifier(prop.key, { name: "rank" })
    )
    let rankValue: number | undefined
    if (rank && isObjectProperty(rank) && isNumericLiteral(rank.value)) {
        rankValue = rank.value.value
    }

    const requireAll = properties.find(
        (prop) => isObjectProperty(prop) && isIdentifier(prop.key, { name: "requireAll" })
    )
    let requireAllValue: boolean | undefined
    if (requireAll && isObjectProperty(requireAll) && isBooleanLiteral(requireAll.value)) {
        requireAllValue = requireAll.value.value
    }

    return {
        label: hasLabel,
        icon: hasIcon,
        rank: rankValue,
        nested: nestedValue,
        group: groupValue,
        translationNs: translationNsValue,
        // Referenced by identifier at runtime rather than extracted here, so
        // the array may be computed instead of a string-literal list.
        permissions: hasProperty("permissions"),
        requireAll: requireAllValue,
    }
}

function getRouteConfig(file: string): MenuItemConfig | null {
    try {
        const code = fs.readFileSync(file, "utf-8")
        const ast = parse(code, getParserOptions(file))

        let config: MenuItemConfig | null = null
        let configFound = false

        traverse(ast, {
            VariableDeclarator(path: any) {
                if (configFound) return
                const properties = getConfigObjectProperties(path)
                if (!properties) return
                config = processConfigProperties(properties)
                if (config) configFound = true
            },
            ExportNamedDeclaration(path: any) {
                if (configFound) return
                const properties = getConfigObjectProperties(path)
                if (!properties) return
                config = processConfigProperties(properties)
                if (config) configFound = true
            },
        })

        return config
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
    config: MenuItemConfig,
    file: string,
    routesDir: string,
    index: number
): MenuItem {
    const configName = generateRouteConfigName(index)
    return {
        label: `${configName}.label`,
        icon: config.icon ? `${configName}.icon` : undefined,
        path: getRoute(file, routesDir),
        rank: config.rank,
        nested: config.nested,
        group: config.group,
        translationNs: config.translationNs
            ? `${configName}.translationNs`
            : undefined,
        permissions: config.permissions
            ? `${configName}.permissions`
            : undefined,
        requireAll: config.requireAll,
    }
}

export function formatMenuItem(menuItem: MenuItem): string {
    const parts = [
        `        label: ${menuItem.label}`,
        `        icon: ${menuItem.icon || "undefined"}`,
        `        path: "${menuItem.path}"`,
        `        rank: ${menuItem.rank !== undefined ? menuItem.rank : "undefined"}`,
        `        nested: ${menuItem.nested ? `"${menuItem.nested}"` : "undefined"}`,
        `        group: ${menuItem.group ? JSON.stringify(menuItem.group) : "undefined"}`,
        `        translationNs: ${menuItem.translationNs || "undefined"}`,
        `        permissions: ${menuItem.permissions || "undefined"}`,
        `        requireAll: ${menuItem.requireAll !== undefined ? menuItem.requireAll : "undefined"}`,
    ]
    return `    {\n${parts.join(",\n")}\n    }`
}

export function parseMenuItemFile(
    file: string,
    routesDir: string,
    index: number
): MenuItemResult | null {
    const config = getRouteConfig(file)
    if (!config) {
        return null
    }

    return {
        import: generateImport(file, index),
        menuItem: generateMenuItem(config, file, routesDir, index),
    }
}

/** Later layers win: a menu item at a path already declared replaces it. */
export function generateMenuItems(config: BuiltMercurConfig): string {
    const { header, names } = emitLayers(config)

    return `${header}

const byPath = new Map()
for (const item of [
${spreadLayers(names, "menuItemModule", "menuItems")}
]) {
    byPath.set(item.path, item)
}

export default { menuItems: [...byPath.values()] }`
}
