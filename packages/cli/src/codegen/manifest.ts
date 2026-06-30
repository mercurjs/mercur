import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";

const DEFAULT_MANIFEST_URL =
    "https://raw.githubusercontent.com/mercurjs/mercur/canary/packages/cli/routes-manifest.json";

const FETCH_TIMEOUT_MS = 5000;

export type RouteManifest = Record<string, string>;

function cacheFilePath(url: string): string {
    const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
    return path.join(os.tmpdir(), `mercur-routes-manifest-${hash}.json`);
}

/**
 * Resolve the baseline Medusa + Mercur core route map from the hosted manifest
 * so route additions ship without a CLI release. Each successful fetch is cached
 * to a temp file; if a later fetch fails (e.g. no network) the last cached copy
 * is used instead.
 */
export async function loadBaselineRoutes(): Promise<RouteManifest> {
    const url = process.env.MERCUR_ROUTES_MANIFEST_URL ?? DEFAULT_MANIFEST_URL;
    const cachePath = cacheFilePath(url);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }

        const manifest = (await res.json()) as RouteManifest;
        await fs.writeFile(cachePath, JSON.stringify(manifest), "utf-8").catch(() => {});
        return manifest;
    } catch {
        try {
            return JSON.parse(await fs.readFile(cachePath, "utf-8")) as RouteManifest;
        } catch {
            throw new Error(
                `Failed to fetch the routes manifest from ${url} and no cached copy is available. ` +
                    `Connect to the network and re-run codegen.`
            );
        }
    }
}
