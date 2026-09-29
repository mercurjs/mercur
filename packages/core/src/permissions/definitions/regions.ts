import { defineMercurPermissions } from "../registry"

export const regionsPermissions = defineMercurPermissions([
  { key: "regions", group: "regions", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "tax_regions", group: "regions", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
