/**
 * Merge a model's custom-fields `link` relations into a curated fields string
 * using the `+` merge convention (`+link.*`), so linked-module data is fetched
 * alongside the entity without replacing the route's default fields. Returns the
 * base `fields` unchanged when there are no links.
 */
export const withLinkFields = (fields: string, links: string[]): string =>
  links.length ? `${fields},${links.map((l) => `+${l}.*`).join(",")}` : fields
