const OFFICIAL_REGISTRY = "@mercurjs";

/**
 * Block names from other registries can reveal a company's internal tooling,
 * so only official blocks are named.
 */
export const describeBlock = (block: string) => {
  const match = block.match(/^(@[^/]+)\/(.+)$/);
  const registry = match ? match[1] : OFFICIAL_REGISTRY;
  const name = match ? match[2] : block;
  const official = registry === OFFICIAL_REGISTRY;

  return {
    block: official ? name : "<custom-registry>",
    registry_kind: official ? "official" : "custom",
  };
};
