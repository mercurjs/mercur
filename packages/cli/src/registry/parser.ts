const REGISTRY_PATTERN = /^(@[a-zA-Z0-9](?:[a-zA-Z0-9-_]*[a-zA-Z0-9])?)\/(.+)$/;

export function parseRegistryAndBlockFromString(name: string) {
  if (!name.startsWith("@")) {
    return {
      registry: null,
      item: name,
    };
  }

  const match = name.match(REGISTRY_PATTERN);
  if (match) {
    return {
      registry: match[1],
      item: match[2],
    };
  }

  return {
    registry: null,
    item: name,
  };
}
