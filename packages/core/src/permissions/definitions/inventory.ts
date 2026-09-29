import { defineMercurPermissions } from "../registry"

export const inventoryPermissions = defineMercurPermissions([
  { key: "inventory", group: "inventory", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "stock_locations", group: "inventory", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
