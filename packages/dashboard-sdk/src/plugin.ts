import type * as Vite from "vite";
import path from "path";
import fs from "fs";
import { getFileExports } from "./utils";
import { RESOLVED_ROUTES_MODULE } from "./constants";
import {
    isVirtualModule,
    resolveVirtualModule,
    loadVirtualModule,
} from "./virtual-modules";
import type { MercurConfig, BuiltMercurConfig } from "./types";

function isRouteFile(file: string): boolean {
    const basename = path.basename(file, path.extname(file));
    return basename === "page";
}

const UI_MODULE_KEYS = ["admin_ui", "vendor_ui"];

function findNodeModulesRoot(configDir: string): string {
    // Walk up from configDir to find the nearest node_modules
    let dir = configDir;
    while (dir !== path.dirname(dir)) {
        const candidate = path.join(dir, "node_modules");
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            return candidate;
        }
        dir = path.dirname(dir);
    }
    return path.join(configDir, "node_modules");
}

function resolvePluginRoot(
    resolve: string,
    configDir: string,
    nodeModulesRoot: string,
): string | null {
    try {
        if (resolve.startsWith(".")) {
            const resolved = path.resolve(configDir, resolve);
            if (fs.existsSync(resolved)) {
                return fs.realpathSync(resolved);
            }
            return null;
        }

        // Check in node_modules, following symlinks for workspace packages
        const packagePath = path.join(nodeModulesRoot, resolve);
        if (!fs.existsSync(packagePath)) {
            return null;
        }

        // Follow symlinks (handles workspace/linked packages)
        return fs.realpathSync(packagePath);
    } catch {
        return null;
    }
}

function resolvePluginExtensions(plugins: any[], configDir: string, appType: "admin" | "vendor"): string[] {
    const nodeModulesRoot = findNodeModulesRoot(configDir);
    const extensions: string[] = [];

    for (const plugin of plugins) {
        const resolve = typeof plugin === "string" ? plugin : plugin?.resolve;

        if (!resolve || typeof resolve !== "string") continue;

        const pluginRoot = resolvePluginRoot(resolve, configDir, nodeModulesRoot);
        if (!pluginRoot) continue;

        const extFile = path.join(
            pluginRoot,
            ".medusa/server/src",
            appType,
            "index.mjs",
        );
        if (fs.existsSync(extFile)) {
            extensions.push(extFile);
        }
    }

    return extensions;
}

async function loadMedusaConfig(
    medusaConfigPath: string,
    root: string,
): Promise<{ base?: string; pluginExtensions: string[] }> {
    try {
        const mod = await getFileExports(medusaConfigPath);
        const medusaConfig = mod.default ?? mod;

        const modules = medusaConfig?.modules ?? {};
        const configDir = path.dirname(medusaConfigPath);

        let base: string | undefined;
        let appType: "admin" | "vendor" = "admin";

        for (const key of UI_MODULE_KEYS) {
            const value = modules[key];
            if (!value || typeof value !== "object" || !value.options?.appDir)
                continue;

            const appDir = path.resolve(configDir, value.options.appDir);

            if (appDir === root) {
                base = value.options.path;
                appType = key === "vendor_ui" ? "vendor" : "admin";
                break;
            }
        }

        const plugins =
            medusaConfig?.plugins?.filter(
                (plugin: { resolve: string }) =>
                    plugin.resolve !== "@medusajs/draft-order",
            ) ?? [];
        const pluginExtensions = resolvePluginExtensions(plugins, configDir, appType);

        return { base, pluginExtensions };
    } catch {
        return { pluginExtensions: [] };
    }
}

export function mercurDashboardPlugin(pluginConfig: MercurConfig): Vite.Plugin {
    let root: string;
    let config: BuiltMercurConfig;

    return {
        name: "@mercurjs/dashboard-sdk",
        async config(viteConfig) {
            root = viteConfig.root || process.cwd();

            const medusaConfigPath = path.resolve(
                root,
                pluginConfig.medusaConfigPath,
            );
            const { base, pluginExtensions } = await loadMedusaConfig(
                medusaConfigPath,
                root,
            );

            const srcDir = path.join(root, "src");
            const backendUrl = pluginConfig.backendUrl ?? "http://localhost:9000";

            config = {
                ...pluginConfig,
                backendUrl,
                base,
                root,
                srcDir,
                pluginExtensions,
            };

            return {
                base: config.base,
                define: {
                    __BACKEND_URL__: JSON.stringify(config.backendUrl),
                    __BASE__: JSON.stringify(config.base || "/"),
                },
                optimizeDeps: {
                    exclude: [
                        "virtual:mercur/config",
                        "virtual:mercur/routes",
                        "virtual:mercur/components",
                        "virtual:mercur/menu-items",
                        "virtual:mercur/i18n",
                        "virtual:medusa/routes",
                        "virtual:medusa/menu-items",
                        "virtual:medusa/i18n",
                        "virtual:medusa/widgets",
                        "virtual:medusa/forms",
                        "virtual:medusa/displays",
                        "virtual:medusa/links",
                    ],
                    include: [
                        "react",
                        "react/jsx-runtime",
                        "react-dom/client",
                        "react-router-dom",
                        "react-i18next",
                        "@medusajs/ui",
                        "@medusajs/dashboard",
                        "@mercurjs/client",
                        "@tanstack/react-query",
                    ],
                },
            };
        },
        configResolved(resolvedConfig) {
            root = resolvedConfig.root;
        },
        resolveId(id) {
            if (isVirtualModule(id)) {
                return resolveVirtualModule(id);
            }
            return null;
        },
        load(id) {
            return loadVirtualModule({ cwd: root, id, mercurConfig: config });
        },
        configureServer(server) {
            const handleRouteChange = (file: string) => {
                if (!isRouteFile(file)) return;

                const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_MODULE);
                if (mod) {
                    server.moduleGraph.invalidateModule(mod);
                    server.ws.send({ type: "full-reload" });
                }
            };

            server.watcher.on("add", handleRouteChange);
            server.watcher.on("unlink", handleRouteChange);
        },
        handleHotUpdate({ file, server }) {
            if (isRouteFile(file)) {
                const mod = server.moduleGraph.getModuleById(RESOLVED_ROUTES_MODULE);
                if (mod) {
                    server.moduleGraph.invalidateModule(mod);
                }
            }
        },
    };
}
