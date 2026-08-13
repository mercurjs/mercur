import type * as Vite from "vite";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { getFileExports } from "./utils";
import {
    RESOLVED_ROUTES_MODULE,
    RESOLVED_WIDGETS_MODULE,
    RESOLVED_NAVIGATION_MODULE,
    RESOLVED_CUSTOM_FIELDS_MODULE,
} from "./constants";
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

function isWidgetFile(file: string): boolean {
    return normalizeSep(file).includes("/src/widgets/");
}

function isNavigationFile(file: string): boolean {
    const basename = path.basename(file, path.extname(file));
    return basename === "_navigation";
}

function isCustomFieldFile(file: string): boolean {
    return normalizeSep(file).includes("/src/custom-fields/");
}

function normalizeSep(file: string): string {
    return file.replace(/\\/g, "/");
}

const UI_MODULE_KEYS = ["admin_ui", "vendor_ui"];

// `@medusajs/dashboard` declares `virtual:medusa/*` imports that are resolved
// upstream by `@medusajs/admin-vite-plugin`. Mercur replaces those modules at
// bundle time, so the runtime never actually loads them — but esbuild's
// dependency scanner still walks `@medusajs/dashboard/dist/app.mjs` and fails
// on the unresolved specifiers. Stubbing them keeps the scan happy.
const MEDUSA_VIRTUAL_MODULES = [
    "virtual:medusa/displays",
    "virtual:medusa/forms",
    "virtual:medusa/i18n",
    "virtual:medusa/layouts",
    "virtual:medusa/cell-renderers",
    "virtual:medusa/menu-items",
    "virtual:medusa/routes",
    "virtual:medusa/widgets",
    "virtual:medusa/links",
];

function isMedusaVirtualModule(id: string): boolean {
    return MEDUSA_VIRTUAL_MODULES.includes(id);
}

// Only force-prebundle deps that actually resolve from the app. Consuming apps
// (e.g. templates) may not declare optional deps like `i18next` or
// `@medusajs/dashboard` directly, and Vite warns for every unresolved entry in
// `optimizeDeps.include`.
function filterResolvableDeps(specifiers: string[], fromDir: string): string[] {
    const require = createRequire(path.join(fromDir, "noop.js"));
    return specifiers.filter((specifier) => {
        try {
            require.resolve(specifier);
            return true;
        } catch {
            return false;
        }
    });
}

function resolveMedusaVirtualModule(id: string): string {
    return "\0" + id;
}

function isResolvedMedusaVirtualModule(id: string): boolean {
    return id.startsWith("\0virtual:medusa/");
}

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

function trimTrailingSlashes(value: string): string {
    let end = value.length;

    while (end > 0 && value.charCodeAt(end - 1) === 47) {
        end -= 1;
    }

    return end === value.length ? value : value.slice(0, end);
}

async function loadMedusaConfig(
    medusaConfigPath: string,
    root: string,
    options: {
        isDevelopment: boolean;
        vendorUrl?: string;
    },
): Promise<{
    base?: string;
    pluginExtensions: string[];
    vendorAppUrl?: string;
}> {
    const configDir = path.dirname(medusaConfigPath);

    try {
        // Medusa configs assume they execute from their own directory — `medusa` itself
        // runs them that way (loadEnv(process.cwd()), cwd-relative module resolution).
        // We load the config from a panel's directory, so emulate Medusa's cwd for the
        // duration of the import.
        const previousCwd = process.cwd();
        let mod: Awaited<ReturnType<typeof getFileExports>>;
        process.chdir(configDir);
        try {
            mod = await getFileExports(medusaConfigPath);
        } finally {
            process.chdir(previousCwd);
        }
        const medusaConfig = mod.default ?? mod;

        const modules = medusaConfig?.modules ?? {};

        let base: string | undefined;
        let appType: "admin" | "vendor" = "admin";
        let vendorAppUrl: string | undefined;

        const vendorModule = modules.vendor_ui;
        const vendorPath = vendorModule?.options?.path ?? "/seller";

        if (options.vendorUrl) {
            vendorAppUrl = trimTrailingSlashes(options.vendorUrl);
        } else if (options.isDevelopment) {
            const vendorHost =
                vendorModule?.options?.viteDevServerHost ?? "localhost";
            const vendorPort =
                vendorModule?.options?.viteDevServerPort ?? 7001;

            vendorAppUrl = `http://${vendorHost}:${vendorPort}${vendorPath}`;
        } else {
            vendorAppUrl = vendorPath;
        }

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

        return { base, pluginExtensions, vendorAppUrl };
    } catch (error) {
        // Don't fail the build — but never fail silently either: without the Medusa config
        // the panel is built with base "/" and no plugin extensions, and a panel served
        // under a sub-path (e.g. /dashboard) would then request assets that 404.
        console.warn(
            `[@mercurjs/dashboard-sdk] Could not load the Medusa config from "${medusaConfigPath}": ` +
                `${error instanceof Error ? error.message : String(error)}. ` +
                `Building with base "/" and no plugin extensions — if this panel is served ` +
                `under a sub-path (e.g. /dashboard), its assets will not resolve.`,
        );
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
            const isDevelopment =
                (viteConfig.mode || process.env.NODE_ENV || "development") !==
                "production";

            const medusaConfigPath = path.resolve(
                root,
                pluginConfig.medusaConfigPath,
            );
            const { base, pluginExtensions, vendorAppUrl } = await loadMedusaConfig(
                medusaConfigPath,
                root,
                {
                    isDevelopment,
                    vendorUrl: pluginConfig.vendorUrl,
                },
            );

            const srcDir = path.join(root, "src");
            const backendUrl = pluginConfig.backendUrl ?? "http://localhost:9000";
            const imageLimit = pluginConfig.imageLimit ?? 2 * 1024 * 1024;

            config = {
                ...pluginConfig,
                backendUrl,
                base,
                root,
                srcDir,
                pluginExtensions,
                imageLimit,
            };

            return {
                base: config.base,
                define: {
                    __BACKEND_URL__: JSON.stringify(config.backendUrl),
                    __BASE__: JSON.stringify(config.base || "/"),
                    __VENDOR_URL__: JSON.stringify(vendorAppUrl || ""),
                },
                resolve: {
                    dedupe: ["i18next", "react-i18next", "react", "react-dom"],
                },
                optimizeDeps: {
                    exclude: [
                        "virtual:mercur/config",
                        "virtual:mercur/routes",
                        "virtual:mercur/menu-items",
                        "virtual:mercur/i18n",
                        "virtual:mercur/widgets",
                        "virtual:mercur/navigation",
                        "virtual:mercur/custom-fields",
                        ...MEDUSA_VIRTUAL_MODULES,
                    ],
                    include: filterResolvableDeps(
                        [
                            "react",
                            "react/jsx-runtime",
                            "react-dom/client",
                            "react-router-dom",
                            "react-i18next",
                            "i18next",
                            "@medusajs/ui",
                            "@medusajs/dashboard",
                            "@mercurjs/client",
                            "@tanstack/react-query",
                        ],
                        root,
                    ),
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
            if (isMedusaVirtualModule(id)) {
                return resolveMedusaVirtualModule(id);
            }
            return null;
        },
        load(id) {
            if (isResolvedMedusaVirtualModule(id)) {
                return "export default {}";
            }
            return loadVirtualModule({ id, mercurConfig: config });
        },
        configureServer(server) {
            const invalidate = (moduleId: string, reload: boolean) => {
                const mod = server.moduleGraph.getModuleById(moduleId);
                if (mod) {
                    server.moduleGraph.invalidateModule(mod);
                    if (reload) server.ws.send({ type: "full-reload" });
                }
            };

            const handleChange = (file: string) => {
                if (isRouteFile(file)) invalidate(RESOLVED_ROUTES_MODULE, true);
                if (isWidgetFile(file)) invalidate(RESOLVED_WIDGETS_MODULE, true);
                if (isNavigationFile(file)) invalidate(RESOLVED_NAVIGATION_MODULE, true);
                if (isCustomFieldFile(file)) invalidate(RESOLVED_CUSTOM_FIELDS_MODULE, true);
            };

            server.watcher.on("add", handleChange);
            server.watcher.on("unlink", handleChange);
        },
        handleHotUpdate({ file, server }) {
            const invalidate = (moduleId: string) => {
                const mod = server.moduleGraph.getModuleById(moduleId);
                if (mod) server.moduleGraph.invalidateModule(mod);
            };

            if (isRouteFile(file)) invalidate(RESOLVED_ROUTES_MODULE);
            if (isWidgetFile(file)) invalidate(RESOLVED_WIDGETS_MODULE);
            if (isNavigationFile(file)) invalidate(RESOLVED_NAVIGATION_MODULE);
            if (isCustomFieldFile(file)) invalidate(RESOLVED_CUSTOM_FIELDS_MODULE);
        },
    };
}
