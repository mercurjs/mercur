import { defineMercurPermissions } from "../registry"

export const promotionsPermissions = defineMercurPermissions([
  { key: "promotions", group: "promotions", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "campaigns", group: "promotions", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
