import type { z } from "zod";
import type { Config } from "../schema";
import { REGISTRY_URL } from "./constants";
import { expandEnvVars } from "./env";
import { RegistryNotConfiguredError } from "./errors";
import { parseRegistryAndBlockFromString } from "./parser";
import type { registryConfigItemSchema } from "./schema";
import { isLocalFile, isUrl } from "./utils";
import { validateRegistryConfig } from "./validator";

const NAME_PLACEHOLDER = "{name}";
const DEFAULT_PLACEHOLDER = `${NAME_PLACEHOLDER}.json`;
const ENV_VAR_PATTERN = /\${(\w+)}/g;
const QUERY_PARAM_SEPARATOR = "?";
const QUERY_PARAM_DELIMITER = "&";

function hasPlaceholders(url: string) {
  return url.includes(NAME_PLACEHOLDER);
}

function appendPlaceholdersIfNeeded(url: string): string {
  if (hasPlaceholders(url)) return url;

  const baseUrl = url.endsWith("/") ? url : `${url}/`;

  return `${baseUrl}${DEFAULT_PLACEHOLDER}`;
}

export function buildUrlAndHeadersForRegistryBlock(
  name: string,
  config?: Config
) {
  const { registry, item } = parseRegistryAndBlockFromString(name);

  if (!registry) {
    return null;
  }

  const registries = config?.registries || {};
  const registryConfig = registries[registry];
  if (!registryConfig) {
    throw new RegistryNotConfiguredError(registry);
  }

  validateRegistryConfig(registry, registryConfig);

  return {
    url: buildUrlFromRegistryConfig(item, registryConfig, config),
    headers: buildHeadersFromRegistryConfig(registryConfig),
  };
}

export function buildUrlFromRegistryConfig(
  item: string,
  registryConfig: z.infer<typeof registryConfigItemSchema>,
  _config?: Config
) {
  if (typeof registryConfig === "string") {
    const urlWithPlaceholders = appendPlaceholdersIfNeeded(registryConfig);
    const url = urlWithPlaceholders.replace(NAME_PLACEHOLDER, item);
    return expandEnvVars(url);
  }

  const urlWithPlaceholders = appendPlaceholdersIfNeeded(registryConfig.url);
  let baseUrl = urlWithPlaceholders.replace(NAME_PLACEHOLDER, item);
  baseUrl = expandEnvVars(baseUrl);

  if (!registryConfig.params) {
    return baseUrl;
  }

  return appendQueryParams(baseUrl, registryConfig.params);
}

export function buildHeadersFromRegistryConfig(
  config: z.infer<typeof registryConfigItemSchema>
) {
  if (typeof config === "string" || !config.headers) {
    return {};
  }

  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(config.headers)) {
    const expandedValue = expandEnvVars(value);

    if (shouldIncludeHeader(value, expandedValue)) {
      headers[key] = expandedValue;
    }
  }

  return headers;
}

function appendQueryParams(baseUrl: string, params: Record<string, string>) {
  const urlParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const expandedValue = expandEnvVars(value);
    if (expandedValue) {
      urlParams.append(key, expandedValue);
    }
  }

  const queryString = urlParams.toString();
  if (!queryString) {
    return baseUrl;
  }

  const separator = baseUrl.includes(QUERY_PARAM_SEPARATOR)
    ? QUERY_PARAM_DELIMITER
    : QUERY_PARAM_SEPARATOR;

  return `${baseUrl}${separator}${queryString}`;
}

function shouldIncludeHeader(originalValue: string, expandedValue: string) {
  const trimmedExpanded = expandedValue.trim();

  if (!trimmedExpanded) {
    return false;
  }

  if (originalValue.includes("${")) {
    const envVars = originalValue.match(ENV_VAR_PATTERN);
    if (envVars) {
      const templateWithoutVars = originalValue
        .replace(ENV_VAR_PATTERN, "")
        .trim();
      return trimmedExpanded !== templateWithoutVars;
    }
  }

  return true;
}

export function resolveRegistryUrl(pathOrUrl: string) {
  if (isUrl(pathOrUrl) || isLocalFile(pathOrUrl)) {
    return pathOrUrl;
  }

  return `${REGISTRY_URL}/${pathOrUrl}`;
}
