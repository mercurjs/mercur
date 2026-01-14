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
  type RegistryItemCategory,
  registryItemSchema,
  registryResolvedItemsTreeSchema,
} from "./schema";
import { isLocalFile, isUrl } from "./utils";

const registryItemWithSourceSchema = registryItemSchema.extend({
  _source: z.string().optional(),
});

export function resolveRegistryItemsFromRegistries(
  items: string[],
  type: RegistryItemCategory,
  config: Config
) {
  const registryHeaders: Record<string, Record<string, string>> = {};
  const resolvedItems = [...items];

  if (!config?.registries) {
    setRegistryHeaders({});
    return resolvedItems;
  }

  // Get the default registry (first one in the config) for unnamespaced dependencies
  const defaultRegistry = Object.keys(config.registries)[0];

  for (let i = 0; i < resolvedItems.length; i++) {
    let item = resolvedItems[i];
    let itemType = type;

    // If item doesn't start with @ but has a type prefix (e.g., "tools:test-tool"),
    // add the default registry namespace to resolve it
    if (!item.startsWith("@") && item.includes(":") && defaultRegistry) {
      const colonIndex = item.indexOf(":");
      const prefix = item.substring(0, colonIndex);
      if (prefix === "agents" || prefix === "tools" || prefix === "prompts") {
        // Transform "tools:test-tool" to "@defaultRegistry/test-tool" and extract type
        const itemName = item.substring(colonIndex + 1);
        item = `${defaultRegistry}/${itemName}`;
        itemType = prefix as RegistryItemCategory;
      }
    }

    const resolved = buildUrlAndHeadersForRegistryItem(item, itemType, config);

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

export async function fetchRegistryItems(
  items: string[],
  type: RegistryItemCategory,
  config: Config
) {
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
        const paths = resolveRegistryItemsFromRegistries([item], type, config);
        const [result] = await fetchRegistry(paths);
        try {
          return registryItemSchema.parse(result);
        } catch (error) {
          throw new RegistryParseError(item, error);
        }
      }

      // Handle type:item format (e.g., "agents:lib/context", "tools:bash")
      let itemType = type;
      let itemName = item;
      const colonIndex = item.indexOf(":");
      if (colonIndex > 0) {
        const prefix = item.substring(0, colonIndex);
        if (
          prefix === "modules" ||
          prefix === "workflows" ||
          prefix === "api" ||
          prefix === "links" ||
          prefix === "vendorPages" ||
          prefix === "adminPages" ||
          prefix === "lib"
        ) {
          itemType = prefix;
          itemName = item.substring(colonIndex + 1);
        }
      }

      const path = `${itemType}/${itemName}.json`;
      const [result] = await fetchRegistry([path]);
      try {
        return registryItemSchema.parse(result);
      } catch (error) {
        throw new RegistryParseError(item, error);
      }
    })
  );

  return results;
}

export async function resolveRegistryTree(
  names: string[],
  type: RegistryItemCategory,
  config: Config
) {
  let payload: z.infer<typeof registryItemWithSourceSchema>[] = [];
  const allDependencyItems: z.infer<typeof registryItemWithSourceSchema>[] = [];

  const uniqueNames = Array.from(new Set(names));

  const results = await fetchRegistryItems(uniqueNames, type, config);

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
          type,
          config
        );
      }

      const { items } = await resolveDependenciesRecursively(
        resolvedDependencies,
        type,
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
  type: RegistryItemCategory,
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

    const [item] = await fetchRegistryItems([dep], type, config);
    if (!item) continue;

    items.push({ ...item, _source: dep });

    if (item.registryDependencies) {
      const resolvedDeps = config?.registries
        ? resolveRegistryItemsFromRegistries(
            item.registryDependencies,
            type,
            config
          )
        : item.registryDependencies;

      const nested = await resolveDependenciesRecursively(
        resolvedDeps,
        type,
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
