import { defineMercurPermissions } from "../registry"

export const priceListsPermissions = defineMercurPermissions([
  { key: "price_lists", group: "price-lists", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "price_preferences", group: "price-lists", surface: ["admin", "vendor"], rights: ["view", "edit"] },
])
