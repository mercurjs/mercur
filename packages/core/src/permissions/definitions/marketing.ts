import { defineMercurPermissions } from "../registry"

export const marketingPermissions = defineMercurPermissions([
  { key: "promotions", group: "marketing", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
