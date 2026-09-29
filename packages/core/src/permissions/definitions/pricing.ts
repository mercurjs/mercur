import { defineMercurPermissions } from "../registry"

export const pricingPermissions = defineMercurPermissions([
  { key: "price_lists", group: "pricing", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "price_preferences", group: "pricing", surface: ["admin", "vendor"], rights: ["view", "edit"] },
])
