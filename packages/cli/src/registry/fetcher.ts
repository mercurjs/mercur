import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import { z } from "zod";
import { resolveRegistryUrl } from "./builder";
import { getRegistryHeadersFromContext } from "./context";
import {
  RegistryFetchError,
  RegistryForbiddenError,
  RegistryLocalFileError,
  RegistryNotFoundError,
  RegistryParseError,
  RegistryUnauthorizedError,
} from "./errors";
import { registryItemSchema } from "./schema";
import { isLocalFile } from "./utils";

const fetchCache = new Map<string, Promise<unknown>>();

async function fetchLocalJson(filePath: string) {
  let expandedPath = filePath;

  // Strip file:// protocol if present
  if (expandedPath.startsWith("file://")) {
    expandedPath = expandedPath.slice(7);
  }

  if (expandedPath.startsWith("~/")) {
    expandedPath = path.join(homedir(), expandedPath.slice(2));
  }

  const resolvedPath = path.resolve(expandedPath);

  try {
    const content = await fs.readFile(resolvedPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("ENOENT") ||
        error.message.includes("no such file"))
    ) {
      throw new RegistryLocalFileError(filePath, error);
    }
    throw new RegistryLocalFileError(filePath, error);
  }
}

export async function fetchRegistry(paths: string[]) {
  const results = await Promise.all(
    paths.map(async (path) => {
      const url = resolveRegistryUrl(path);

      // Return cached promise if we've already started fetching this URL
      if (fetchCache.has(url)) {
        return fetchCache.get(url);
      }

      if (isLocalFile(url)) {
        const fetchPromise = fetchLocalJson(url);
        fetchCache.set(url, fetchPromise);
        return fetchPromise;
      }

      const fetchPromise = (async () => {
        const headers = getRegistryHeadersFromContext(url);

        const response = await fetch(url, {
          headers: {
            ...headers,
          },
        });

        if (!response.ok) {
          let messageFromServer: string | undefined;

          if (
            response.headers.get("content-type")?.includes("application/json")
          ) {
            const json = await response.json();
            const parsed = z
              .object({
                detail: z.string().optional(),
                title: z.string().optional(),
                message: z.string().optional(),
                error: z.string().optional(),
              })
              .safeParse(json);

            if (parsed.success) {
              messageFromServer = parsed.data.detail || parsed.data.message;

              if (parsed.data.error) {
                messageFromServer = `[${parsed.data.error}] ${messageFromServer}`;
              }
            }
          }

          if (response.status === 401) {
            throw new RegistryUnauthorizedError(url, messageFromServer);
          }

          if (response.status === 404) {
            throw new RegistryNotFoundError(url, messageFromServer);
          }

          if (response.status === 403) {
            throw new RegistryForbiddenError(url, messageFromServer);
          }

          throw new RegistryFetchError(url, response.status, messageFromServer);
        }

        return response.json();
      })();

      fetchCache.set(url, fetchPromise);
      return fetchPromise;
    })
  );

  return results;
}

export async function fetchRegistryLocal(filePath: string) {
  try {
    let expandedPath = filePath;
    if (filePath.startsWith("~/")) {
      expandedPath = path.join(homedir(), filePath.slice(2));
    }

    const resolvedPath = path.resolve(expandedPath);
    const content = await fs.readFile(resolvedPath, "utf8");
    const parsed = JSON.parse(content);

    try {
      return registryItemSchema.parse(parsed);
    } catch (error) {
      throw new RegistryParseError(filePath, error);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("ENOENT") ||
        error.message.includes("no such file"))
    ) {
      throw new RegistryLocalFileError(filePath, error);
    }
    if (error instanceof RegistryParseError) {
      throw error;
    }
    throw new RegistryLocalFileError(filePath, error);
  }
}
