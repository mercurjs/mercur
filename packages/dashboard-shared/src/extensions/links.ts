import { useExtension } from "./context"
import { getExtensionRegistry } from "./context"

/** Turn a model's `link` relations into `+link.*` merge tokens. */
export const linkFields = (links: string[]): string =>
  links.map((l) => `+${l}.*`).join(",")

/**
 * Merge a model's custom-fields `link` relations into a curated fields string
 * using the `+` merge convention (`+link.*`), so linked-module data is fetched
 * alongside the entity without replacing the route's default fields. Returns the
 * base `fields` unchanged when there are no links.
 */
export const withLinkFields = (fields: string, links: string[]): string =>
  links.length ? `${fields},${linkFields(links)}` : fields

/**
 * Build a spreadable `{ fields }` query fragment that adds a model's custom-fields
 * `link` relations. Pass `base` to merge onto a curated field set (list/detail
 * queries); omit it to merge purely onto the route defaults (`+link.*` only), so
 * unprefixed base fields never replace the route defaults. Returns `{}` (or
 * `{ fields: base }`) when the model declares no links, leaving the fetch
 * unchanged. Non-hook variant for react-router loaders.
 */
export const getLinkQuery = (
  model: string,
  base?: string,
): { fields?: string } => {
  const links = getExtensionRegistry()?.getLinks(model) ?? []
  if (!links.length) {
    return base ? { fields: base } : {}
  }
  return { fields: base ? withLinkFields(base, links) : linkFields(links) }
}

/** Hook variant of {@link getLinkQuery} for use inside components. */
export const useLinkQuery = (model: string, base?: string): { fields?: string } => {
  const links = useExtension().getLinks(model)
  if (!links.length) {
    return base ? { fields: base } : {}
  }
  return { fields: base ? withLinkFields(base, links) : linkFields(links) }
}
