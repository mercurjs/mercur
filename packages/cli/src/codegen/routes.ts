import path from "path";
import { ROUTE_FILE_PATTERN } from "./constants";
import { pathExists, recursiveReadDir } from "./fs";
import { normalizeApiPath, normalizePathSep } from "./path";

export interface RouteInfo {
    filePath: string;
    route: string;
}

/**
 * Get all API routes from src/api directory
 */
export async function getRoutes(apiDir: string): Promise<RouteInfo[]> {
    const exists = await pathExists(apiDir);
    if (!exists) {
        return [];
    }

    const files = await recursiveReadDir(apiDir, {
        pathnameFilter: (pathname) => ROUTE_FILE_PATTERN.test(pathname),
        ignorePartFilter: (part) => part.startsWith("_") || part === "node_modules",
    });

    return files.map((filePath) => {
        const relativePath = path.relative(apiDir, filePath);
        return {
            filePath: normalizePathSep(relativePath),
            route: normalizeApiPath(normalizePathSep(relativePath)),
        };
    });
}
