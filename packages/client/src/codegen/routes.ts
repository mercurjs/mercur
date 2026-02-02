import path from "path";
import { API_DIR, ROUTE_FILE_PATTERN } from "./constants";
import { pathExists, recursiveReadDir } from "./fs";
import { normalizeApiPath, normalizePathSep } from "./path";
import type { RouteInfo } from "../types";

/**
 * Get all API routes from src/api directory
 */
export async function getRoutes(rootDir: string = process.cwd()): Promise<RouteInfo[]> {
    const apiDir = path.join(rootDir, API_DIR);

    const exists = await pathExists(apiDir);
    if (!exists) {
        return [];
    }

    const files = await recursiveReadDir(apiDir, {
        pathnameFilter: (pathname) => ROUTE_FILE_PATTERN.test(pathname),
        ignorePartFilter: (part) => part.startsWith("_") || part === "node_modules",
    });

    const routes: RouteInfo[] = files.map((filePath) => {
        const relativePath = path.relative(apiDir, filePath);
        const route = normalizeApiPath(normalizePathSep(relativePath));

        return {
            filePath: normalizePathSep(path.relative(rootDir, filePath)),
            route,
        };
    });

    return routes;
}
