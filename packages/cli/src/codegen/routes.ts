import fs from "fs/promises";
import path from "path";
import { ROUTE_FILE_PATTERN } from "./constants";
import { pathExists, recursiveReadDir } from "./fs";
import { normalizeApiPath, normalizePathSep } from "./path";
import type { HttpMethod, RouteHandler, RouteInfo } from "@mercurjs/types";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "DELETE"];

/**
 * Extract generic type from a type string
 * e.g., "AuthenticatedMedusaRequest<VendorGetProductsType>" -> "VendorGetProductsType"
 */
function extractGenericType(typeStr: string): string | null {
    const match = typeStr.match(/<(.+)>/);
    return match ? match[1].trim() : null;
}

/**
 * Extract route handlers with input/output types from file content
 */
function extractRouteHandlers(content: string): RouteHandler[] {
    const handlers: RouteHandler[] = [];

    for (const method of HTTP_METHODS) {
        // Match export const GET = async (req: Type<Input>, res: MedusaResponse<Output>)
        // This regex captures the function signature
        const pattern = new RegExp(
            `export\\s+const\\s+${method}\\s*=\\s*async\\s*\\(\\s*` +
            `(?:req|request)\\s*:\\s*([^,]+)\\s*,\\s*` +
            `(?:res|response)\\s*:\\s*([^)]+)\\s*\\)`,
            "s"
        );

        const match = content.match(pattern);
        if (match) {
            const reqType = match[1].trim();
            const resType = match[2].trim();

            // Extract input type from AuthenticatedMedusaRequest<T> or MedusaRequest<T>
            const input = extractGenericType(reqType);

            // Extract output type from MedusaResponse<T>
            const output = extractGenericType(resType);

            handlers.push({
                method,
                input,
                output,
            });
        }
    }

    return handlers;
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

    const routes: RouteInfo[] = await Promise.all(
        files.map(async (filePath) => {
            const relativePath = path.relative(apiDir, filePath);
            const route = normalizeApiPath(normalizePathSep(relativePath));

            // Read file content and extract handlers with types
            const content = await fs.readFile(filePath, "utf-8");
            const handlers = extractRouteHandlers(content);

            return {
                filePath: normalizePathSep(path.relative(apiDir, filePath)),
                route,
                handlers,
            };
        })
    );

    return routes;
}
