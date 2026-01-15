import { createHash } from "crypto";
import deepmerge from "deepmerge";
import path from "path";
import { z } from "zod";
import type { Config } from "../schema";
import { buildUrlAndHeadersForRegistryItem } from "./builder";
import { setRegistryHeaders } from "./context";
import { RegistryNotConfiguredError, RegistryParseError } from "./errors";
import { fetchRegistry, fetchRegistryLocal } from "./fetcher";
import { parseRegistryAndItemFromString } from "./parser";
import {
  type RegistryItem,
  registryItemSchema,
  registryResolvedItemsTreeSchema,
} from "./schema";
import { isLocalFile, isUrl } from "./utils";

const registryItemWithSourceSchema = registryItemSchema.extend({
  _source: z.string().optional(),
});

export function resolveRegistryItemsFromRegistries(
  items: string[],
  config: Config
) {
  const registryHeaders: Record<string, Record<string, string>> = {};
  const resolvedItems = [...items];

  if (!config?.registries) {
    setRegistryHeaders({});
    return resolvedItems;
  }

  for (let i = 0; i < resolvedItems.length; i++) {
    const resolved = buildUrlAndHeadersForRegistryItem(
      resolvedItems[i],
      config
    );

    if (resolved) {
      resolvedItems[i] = resolved.url;

      if (Object.keys(resolved.headers).length > 0) {
        registryHeaders[resolved.url] = resolved.headers;
      }
    }
  }

  setRegistryHeaders(registryHeaders);

  return resolvedItems;
}

export async function fetchRegistryItems(items: string[], config: Config) {
  const results = await Promise.all(
    items.map(async (item) => {
      if (isLocalFile(item)) {
        return fetchRegistryLocal(item);
      }

      if (isUrl(item)) {
        const [result] = await fetchRegistry([item]);
        try {
          return registryItemSchema.parse(result);
        } catch (error) {
          throw new RegistryParseError(item, error);
        }
      }

      if (item.startsWith("@") && config?.registries) {
        const paths = resolveRegistryItemsFromRegistries([item], config);
        const [result] = await fetchRegistry(paths);
        try {
          return registryItemSchema.parse(result);
        } catch (error) {
          throw new RegistryParseError(item, error);
        }
      }

      throw new RegistryParseError(item, new Error("Invalid registry item"));
    })
  );

  return results;
}

export async function resolveRegistryTree(names: string[], config: Config) {
  let payload: z.infer<typeof registryItemWithSourceSchema>[] = [];
  const allDependencyItems: z.infer<typeof registryItemWithSourceSchema>[] = [];

  const uniqueNames = Array.from(new Set(names));

  const results = await fetchRegistryItems(uniqueNames, config);

  const resultMap = new Map<string, RegistryItem>();
  for (let i = 0; i < results.length; i++) {
    if (results[i]) {
      resultMap.set(uniqueNames[i], results[i]);
    }
  }

  for (const [sourceName, item] of Array.from(resultMap.entries())) {
    const itemWithSource: z.infer<typeof registryItemWithSourceSchema> = {
      ...item,
      _source: sourceName,
    };
    payload.push(itemWithSource);

    if (item.registryDependencies) {
      let resolvedDependencies = item.registryDependencies;

      if (!config?.registries) {
        const namespacedDeps = item.registryDependencies.filter((dep: string) =>
          dep.startsWith("@")
        );
        if (namespacedDeps.length > 0) {
          const { registry } = parseRegistryAndItemFromString(
            namespacedDeps[0]
          );
          throw new RegistryNotConfiguredError(registry);
        }
      } else {
        resolvedDependencies = resolveRegistryItemsFromRegistries(
          item.registryDependencies,
          config
        );
      }

      const { items } = await resolveDependenciesRecursively(
        resolvedDependencies,
        config,
        new Set(uniqueNames)
      );
      allDependencyItems.push(...items);
    }
  }

  payload.push(...allDependencyItems);

  const sourceMap = new Map<RegistryItem, string>();
  for (const item of payload) {
    const source = item._source || item.name;
    sourceMap.set(item, source);
  }

  payload = topologicalSortRegistryItems(payload, sourceMap);

  const parsed = registryResolvedItemsTreeSchema.parse({
    dependencies: deepmerge.all(payload.map((item) => item.dependencies ?? [])),
    devDependencies: deepmerge.all(
      payload.map((item) => item.devDependencies ?? [])
    ),
    files: deduplicateFilesByTarget(payload.map((item) => item.files ?? [])),
    docs: payload
      .map((item) => item.docs)
      .filter(Boolean)
      .join("\n"),
  });

  return parsed;
}

async function resolveDependenciesRecursively(
  dependencies: string[],
  config: Config,
  visited: Set<string> = new Set()
) {
  const items: z.infer<typeof registryItemWithSourceSchema>[] = [];

  for (const dep of dependencies) {
    if (visited.has(dep)) {
      continue;
    }
    visited.add(dep);

    // Validate namespaced dependencies
    if (dep.startsWith("@") && config?.registries) {
      const { registry } = parseRegistryAndItemFromString(dep);
      if (registry && !(registry in config.registries)) {
        throw new RegistryNotConfiguredError(registry);
      }
    }

    const [item] = await fetchRegistryItems([dep], config);
    if (!item) continue;

    items.push({ ...item, _source: dep });

    if (item.registryDependencies) {
      const resolvedDeps = config?.registries
        ? resolveRegistryItemsFromRegistries(item.registryDependencies, config)
        : item.registryDependencies;

      const nested = await resolveDependenciesRecursively(
        resolvedDeps,
        config,
        visited
      );
      items.push(...nested.items);
    }
  }

  return { items };
}

function computeItemHash(item: Pick<RegistryItem, "name">, source?: string) {
  const identifier = source || item.name;

  const hash = createHash("sha256")
    .update(identifier)
    .digest("hex")
    .substring(0, 8);

  return `${item.name}::${hash}`;
}

function extractItemIdentifierFromDependency(dependency: string) {
  if (isUrl(dependency)) {
    const url = new URL(dependency);
    const pathname = url.pathname;
    const match = pathname.match(/\/([^/]+)\.json$/);
    const name = match ? match[1] : path.basename(pathname, ".json");

    return {
      name,
      hash: computeItemHash({ name }, dependency),
    };
  }

  if (isLocalFile(dependency)) {
    const match = dependency.match(/\/([^/]+)\.json$/);
    const name = match ? match[1] : path.basename(dependency, ".json");

    return {
      name,
      hash: computeItemHash({ name }, dependency),
    };
  }

  const { item } = parseRegistryAndItemFromString(dependency);
  return {
    name: item,
    hash: computeItemHash({ name: item }, dependency),
  };
}

function topologicalSortRegistryItems(
  items: z.infer<typeof registryItemWithSourceSchema>[],
  sourceMap: Map<RegistryItem, string>
) {
  const itemMap = new Map<string, RegistryItem>();
  const hashToItem = new Map<string, RegistryItem>();
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  for (const item of items) {
    const source = sourceMap.get(item) || item.name;
    const hash = computeItemHash(item, source);

    itemMap.set(hash, item);
    hashToItem.set(hash, item);
    inDegree.set(hash, 0);
    adjacencyList.set(hash, []);
  }

  const depToHashes = new Map<string, string[]>();
  for (const item of items) {
    const source = sourceMap.get(item) || item.name;
    const hash = computeItemHash(item, source);

    if (!depToHashes.has(item.name)) {
      depToHashes.set(item.name, []);
    }
    depToHashes.get(item.name)!.push(hash);

    if (source !== item.name) {
      if (!depToHashes.has(source)) {
        depToHashes.set(source, []);
      }
      depToHashes.get(source)!.push(hash);
    }
  }

  for (const item of items) {
    const itemSource = sourceMap.get(item) || item.name;
    const itemHash = computeItemHash(item, itemSource);

    if (item.registryDependencies) {
      for (const dep of item.registryDependencies) {
        let depHash: string | undefined;

        const exactMatches = depToHashes.get(dep) || [];
        if (exactMatches.length === 1) {
          depHash = exactMatches[0];
        } else if (exactMatches.length > 1) {
          depHash = exactMatches[0];
        } else {
          const { name } = extractItemIdentifierFromDependency(dep);
          const nameMatches = depToHashes.get(name) || [];
          if (nameMatches.length > 0) {
            depHash = nameMatches[0];
          }
        }

        if (depHash && itemMap.has(depHash)) {
          adjacencyList.get(depHash)!.push(itemHash);
          inDegree.set(itemHash, inDegree.get(itemHash)! + 1);
        }
      }
    }
  }

  const queue: string[] = [];
  const sorted: z.infer<typeof registryItemWithSourceSchema>[] = [];

  for (const [hash, degree] of inDegree) {
    if (degree === 0) {
      queue.push(hash);
    }
  }

  while (queue.length > 0) {
    const currentHash = queue.shift()!;
    const item = itemMap.get(currentHash)!;
    sorted.push(item as z.infer<typeof registryItemWithSourceSchema>);

    for (const dependentHash of adjacencyList.get(currentHash)!) {
      const newDegree = inDegree.get(dependentHash)! - 1;
      inDegree.set(dependentHash, newDegree);

      if (newDegree === 0) {
        queue.push(dependentHash);
      }
    }
  }

  if (sorted.length !== items.length) {
    const missingHashes = Array.from(itemMap.keys()).filter(
      (hash) =>
        !sorted.some(
          (item) => computeItemHash(item, sourceMap.get(item)) === hash
        )
    );
    console.warn(
      `Warning: Circular dependencies detected. Some items may not be sorted correctly: ${missingHashes.join(", ")}`
    );

    // Add remaining items that couldn't be sorted due to circular dependencies
    for (const [hash, item] of itemMap.entries()) {
      if (!sorted.some((s) => computeItemHash(s, sourceMap.get(s)) === hash)) {
        sorted.push(item as z.infer<typeof registryItemWithSourceSchema>);
      }
    }
  }

  return sorted;
}

function deduplicateFilesByTarget(
  filesArrays: Array<RegistryItem["files"] | undefined>
) {
  const seen = new Map<string, RegistryItem["files"][number]>();
  const result: RegistryItem["files"] = [];

  for (const files of filesArrays) {
    if (!files) continue;

    for (const file of files) {
      const key = file.target || file.path;
      if (!seen.has(key)) {
        seen.set(key, file);
        result.push(file);
      }
    }
  }

  return result;
}
