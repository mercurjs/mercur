import fs from "fs/promises";
import path from "path";
import type { RecursiveReadDirOptions } from "../types";

/**
 * Recursively read directory and return matching files
 */
export async function recursiveReadDir(
    rootDirectory: string,
    options: RecursiveReadDirOptions = {}
): Promise<string[]> {
    const {
        pathnameFilter,
        ignoreFilter,
        ignorePartFilter,
        sortPathnames = true,
    } = options;

    const pathnames: string[] = [];
    let directories: string[] = [rootDirectory];

    while (directories.length > 0) {
        const results = await Promise.all(
            directories.map(async (directory) => {
                const result: {
                    directories: string[];
                    pathnames: string[];
                } = { directories: [], pathnames: [] };

                try {
                    const entries = await fs.readdir(directory, { withFileTypes: true });

                    for (const entry of entries) {
                        if (ignorePartFilter && ignorePartFilter(entry.name)) {
                            continue;
                        }

                        const absolutePath = path.join(directory, entry.name);

                        if (ignoreFilter && ignoreFilter(absolutePath)) {
                            continue;
                        }

                        if (entry.isDirectory()) {
                            result.directories.push(absolutePath);
                        } else if (!pathnameFilter || pathnameFilter(absolutePath)) {
                            result.pathnames.push(absolutePath);
                        }
                    }
                } catch (err: any) {
                    if (err.code !== "ENOENT" || directory === rootDirectory) {
                        throw err;
                    }
                    return null;
                }

                return result;
            })
        );

        directories = [];

        for (const result of results) {
            if (!result) continue;
            directories.push(...result.directories);
            pathnames.push(...result.pathnames);
        }
    }

    if (sortPathnames) {
        pathnames.sort();
    }

    return pathnames;
}

/**
 * Check if a path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
    const stat = await fs.stat(filePath).catch(() => null);
    return stat !== null;
}

/**
 * Ensure directory exists, create if not
 */
export async function ensureDir(dirPath: string): Promise<void> {
    const exists = await pathExists(dirPath);
    if (!exists) {
        await fs.mkdir(dirPath, { recursive: true });
    }
}
