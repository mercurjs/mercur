import path from "path";
import { DIST_DIR } from "./constants";
import { ensureDir } from "./fs";
import { getRoutes } from "./routes";

export { getRoutes } from "./routes";
export { recursiveReadDir, pathExists, ensureDir } from "./fs";
export { normalizeApiPath, normalizePathSep } from "./path";
export { DIST_DIR, API_DIR, ROUTE_FILE_PATTERN } from "./constants";

/**
 * Main entry point for Mercur type generation
 */
export async function generateRouteTypes() {
    const entryFilePath = path.join(process.cwd(), DIST_DIR, "routes.d.ts");
    const entryDir = path.dirname(entryFilePath);

    await ensureDir(entryDir);

    const routes = await getRoutes()


}
