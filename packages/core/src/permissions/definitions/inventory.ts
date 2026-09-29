import { defineMercurPermissions } from "../registry"

export const inventoryPermissions = defineMercurPermissions([
  { key: "inventory_items", group: "inventory", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "reservations", group: "inventory", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "stock_locations", group: "inventory", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
