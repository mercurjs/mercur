import type { Config } from "../schema";
import { buildUrlAndHeadersForRegistryBlock } from "./builder";
import { configWithDefaults } from "./config";
import { clearRegistryContext } from "./context";
import {
  RegistryInvalidNamespaceError,
  RegistryNotFoundError,
  RegistryParseError,
} from "./errors";
import { fetchRegistry } from "./fetcher";
import { fetchRegistryBlocks, resolveRegistryTree } from "./resolver";
import { registrySchema } from "./schema";
import { isUrl } from "./utils";

export async function getRegistry(
  name: string,
  options?: {
    config?: Partial<Config>;
  }
) {
  const { config } = options || {};

  if (isUrl(name)) {
    const [result] = await fetchRegistry([name]);
    try {
      return registrySchema.parse(result);
    } catch (error) {
      throw new RegistryParseError(name, error);
    }
  }

  if (!name.startsWith("@")) {
    throw new RegistryInvalidNamespaceError(name);
  }

  let registryName = name;
  if (!registryName.endsWith("/registry")) {
    registryName = `${registryName}/registry`;
  }

  const urlAndHeaders = buildUrlAndHeadersForRegistryBlock(
    registryName as `@${string}`,
    configWithDefaults(config)
  );

  if (!urlAndHeaders?.url) {
    throw new RegistryNotFoundError(registryName);
  }

  const [result] = await fetchRegistry([urlAndHeaders.url]);

  try {
    return registrySchema.parse(result);
  } catch (error) {
    throw new RegistryParseError(registryName, error);
  }
}

export async function getRegistryBlocks(
  blocks: string[],
  options?: {
    config?: Partial<Config>;
  }
) {
  const { config } = options || {};

  clearRegistryContext();

  return fetchRegistryBlocks(blocks, configWithDefaults(config));
}

export async function resolveRegistryBlocks(
  blocks: string[],
  options?: {
    config?: Partial<Config>;
  }
) {
  const { config } = options || {};

  clearRegistryContext();
  return resolveRegistryTree(blocks, configWithDefaults(config));
}
