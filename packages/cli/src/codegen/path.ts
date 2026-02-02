import { ROUTE_FILE_PATTERN } from "./constants";

/**
 * Normalize path separators to forward slashes
 */
export function normalizePathSep(filePath: string): string {
    return filePath.replace(/\\/g, "/");
}

/**
 * Normalize API route path
 * e.g., vendor/products/[id]/route.ts -> /vendor/products/:id
 */
export function normalizeApiPath(routePath: string): string {
    const normalized = routePath
        .split("/")
        .reduce((pathname, segment) => {
            if (!segment) return pathname;

            // Skip route.ts file
            if (ROUTE_FILE_PATTERN.test(segment)) return pathname;

            // Convert [param] to :param
            if (segment.startsWith("[") && segment.endsWith("]")) {
                const param = segment.slice(1, -1);
                return `${pathname}/:${param}`;
            }

            return `${pathname}/${segment}`;
        }, "");

    return normalized || "/";
}
