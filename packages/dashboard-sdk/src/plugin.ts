import type * as Vite from "vite"
import path from "path"
import fs from "fs"
import { getParserOptions } from "./utils"
import {
    parse,
    traverse,
    isIdentifier,
    isCallExpression,
    isObjectExpression,
    isObjectProperty,
    isStringLiteral,
    isArrayExpression,
    isMemberExpression,
} from "./babel"
import { RESOLVED_ROUTES_MODULE } from "./constants"
import { isVirtualModule, resolveVirtualModule, loadVirtualModule } from "./virtual-modules"
import type { MercurConfig, BuiltMercurConfig } from "./types"

function isPageFile(file: string): boolean {
    const basename = path.basename(file, path.extname(file))
    return basename === "page"
}

const UI_MODULE_KEYS = [
    "admin_ui",
    "vendor_ui",
]

function findNodeModulesRoot(configDir: string): string {
    // Walk up from configDir to find the nearest node_modules
    let dir = configDir
    while (dir !== path.dirname(dir)) {
        const candidate = path.join(dir, "node_modules")
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            return candidate
        }
        dir = path.dirname(dir)
    }
    return path.join(configDir, "node_modules")
}

function resolvePluginRoot(resolve: string, configDir: string, nodeModulesRoot: string): string | null {
    try {
        if (resolve.startsWith(".")) {
            const resolved = path.resolve(configDir, resolve)
            if (fs.existsSync(resolved)) {
                return fs.realpathSync(resolved)
            }
            return null
        }

        // Check in node_modules, following symlinks for workspace packages
        const packagePath = path.join(nodeModulesRoot, resolve)
        if (!fs.existsSync(packagePath)) {
            return null
        }

        // Follow symlinks (handles workspace/linked packages)
        return fs.realpathSync(packagePath)
    } catch {
        return null
    }
}

function resolvePluginExtensions(
    plugins: any[],
    configDir: string,
): string[] {
    const nodeModulesRoot = findNodeModulesRoot(configDir)
    const extensions: string[] = []
    const appTypes = ["admin", "vendor"] as const

    for (const plugin of plugins) {
        const resolve = typeof plugin === "string"
            ? plugin
            : plugin?.resolve

        if (!resolve || typeof resolve !== "string") continue

        const pluginRoot = resolvePluginRoot(resolve, configDir, nodeModulesRoot)
        if (!pluginRoot) continue

        for (const appType of appTypes) {
            const extFile = path.join(pluginRoot, '.medusa/server/src', appType, 'index.js')
            if (fs.existsSync(extFile)) {
                extensions.push(extFile)
            }
        }
    }

    return extensions
}

function extractStringFromNode(node: any, configDir: string): string | null {
    if (isStringLiteral(node)) {
        return node.value
    }

    // Handle path.join(__dirname, 'relative') or path.resolve(__dirname, 'relative')
    if (
        isCallExpression(node) &&
        isMemberExpression(node.callee) &&
        isIdentifier(node.callee.object, { name: "path" }) &&
        isIdentifier(node.callee.property) &&
        (node.callee.property.name === "join" || node.callee.property.name === "resolve")
    ) {
        const args = node.arguments
        if (args.length >= 2 && isIdentifier(args[0], { name: "__dirname" })) {
            const parts = args.slice(1)
                .filter((a: any) => isStringLiteral(a))
                .map((a: any) => a.value)
            if (parts.length > 0) {
                return path.resolve(configDir, ...parts)
            }
        }
    }

    return null
}

function extractObjectProperties(node: any): any[] | null {
    if (isObjectExpression(node)) {
        return node.properties
    }
    return null
}

async function loadMedusaConfig(medusaConfigPath: string, root: string): Promise<{ base?: string; pluginExtensions: string[] }> {
    try {
        const code = fs.readFileSync(medusaConfigPath, "utf-8")
        const ast = parse(code, getParserOptions(medusaConfigPath))
        const configDir = path.dirname(medusaConfigPath)

        const result: { properties: any[] | null } = { properties: null }

        traverse(ast, {
            // Handle: export default defineConfig({ ... })
            ExportDefaultDeclaration(nodePath: any) {
                const decl = nodePath.node.declaration
                if (isCallExpression(decl) && decl.arguments.length > 0) {
                    result.properties = extractObjectProperties(decl.arguments[0])
                }
            },
            // Handle: module.exports = defineConfig({ ... }) or module.exports = { ... }
            AssignmentExpression(nodePath: any) {
                const left = nodePath.node.left
                if (
                    isMemberExpression(left) &&
                    isIdentifier(left.object, { name: "module" }) &&
                    isIdentifier(left.property, { name: "exports" })
                ) {
                    const right = nodePath.node.right
                    if (isCallExpression(right) && right.arguments.length > 0) {
                        result.properties = extractObjectProperties(right.arguments[0])
                    } else if (isObjectExpression(right)) {
                        result.properties = right.properties as any[]
                    }
                }
            },
        })

        const configObjectProperties = result.properties

        if (!configObjectProperties) {
            return { pluginExtensions: [] }
        }

        let base: string | undefined

        // Extract modules
        const modulesProp = configObjectProperties.find(
            (p: any) => isObjectProperty(p) && isIdentifier(p.key, { name: "modules" })
        )

        if (modulesProp && isObjectProperty(modulesProp) && isObjectExpression(modulesProp.value)) {
            for (const key of UI_MODULE_KEYS) {
                const uiProp = modulesProp.value.properties.find(
                    (p: any) => isObjectProperty(p) && isIdentifier(p.key, { name: key })
                )

                if (!uiProp || !isObjectProperty(uiProp) || !isObjectExpression(uiProp.value)) continue

                const optionsProp = uiProp.value.properties.find(
                    (p: any) => isObjectProperty(p) && isIdentifier(p.key, { name: "options" })
                )

                if (!optionsProp || !isObjectProperty(optionsProp) || !isObjectExpression(optionsProp.value)) continue

                const appDirProp = optionsProp.value.properties.find(
                    (p: any) => isObjectProperty(p) && isIdentifier(p.key, { name: "appDir" })
                )

                if (!appDirProp || !isObjectProperty(appDirProp)) continue

                const appDir = extractStringFromNode(appDirProp.value, configDir)
                if (!appDir) continue

                const resolvedAppDir = path.isAbsolute(appDir)
                    ? appDir
                    : path.resolve(configDir, appDir)

                if (resolvedAppDir === root) {
                    const pathProp = optionsProp.value.properties.find(
                        (p: any) => isObjectProperty(p) && isIdentifier(p.key, { name: "path" })
                    )

                    if (pathProp && isObjectProperty(pathProp) && isStringLiteral(pathProp.value)) {
                        base = pathProp.value.value
                    }
                    break
                }
            }
        }

        // Extract plugins
        const plugins: any[] = []
        const pluginsProp = configObjectProperties.find(
            (p: any) => isObjectProperty(p) && isIdentifier(p.key, { name: "plugins" })
        )

        if (pluginsProp && isObjectProperty(pluginsProp) && isArrayExpression(pluginsProp.value)) {
            for (const element of pluginsProp.value.elements) {
                if (!element) continue

                if (isObjectExpression(element)) {
                    const resolveProp = element.properties.find(
                        (p: any) => isObjectProperty(p) && isIdentifier(p.key, { name: "resolve" })
                    )
                    if (resolveProp && isObjectProperty(resolveProp) && isStringLiteral(resolveProp.value)) {
                        plugins.push({ resolve: resolveProp.value.value })
                    }
                } else if (isStringLiteral(element)) {
                    plugins.push({ resolve: element.value })
                }
            }
        }

        const pluginExtensions = resolvePluginExtensions(plugins, configDir)

        return { base, pluginExtensions }
    } catch {
        return { pluginExtensions: [] }
    }
}

export function mercurDashboardPlugin(pluginConfig: MercurConfig): Vite.Plugin {
    let root: string
    let config: BuiltMercurConfig

    return {
        name: "@mercurjs/dashboard-sdk",
        async config(viteConfig) {
            root = viteConfig.root || process.cwd()

            const medusaConfigPath = path.resolve(root, pluginConfig.medusaConfigPath)
            const { base, pluginExtensions } = await loadMedusaConfig(medusaConfigPath, root)

            const srcDir = path.join(root, "src")
            const backendUrl = pluginConfig.backendUrl ?? "http://localhost:9000"

            config = {
                ...pluginConfig,
                backendUrl,
                base,
                root,
                srcDir,
                pluginExtensions,
            }

            return {
                base: config.base,
                define: {
                    "__BACKEND_URL__": JSON.stringify(config.backendUrl),
                    "__BASE__": JSON.stringify(config.base || "/"),
                },
                optimizeDeps: {
                    include: pluginExtensions,
                    exclude: ['virtual:mercur/config', 'virtual:mercur/routes', 'virtual:mercur/components', 'virtual:mercur/menu-items', 'virtual:mercur/i18n']
                },
            }
        },
        configResolved(resolvedConfig) {
            root = resolvedConfig.root
        },
        resolveId(id) {
            if (isVirtualModule(id)) {
                return resolveVirtualModule(id)
            }
            return null
        },
        load(id) {
            return loadVirtualModule({ cwd: root, id, mercurConfig: config })
        },
        configureServer(server) {
            const handlePageChange = (file: string) => {
                if (!isPageFile(file)) return

                const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_MODULE)
                if (mod) {
                    server.moduleGraph.invalidateModule(mod)
                    server.ws.send({ type: "full-reload" })
                }
            }

            server.watcher.on("add", handlePageChange)
            server.watcher.on("unlink", handlePageChange)
        },
        handleHotUpdate({ file, server }) {
            if (isPageFile(file)) {
                const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_MODULE)
                if (mod) {
                    server.moduleGraph.invalidateModule(mod)
                }
            }
        },
    }
}
