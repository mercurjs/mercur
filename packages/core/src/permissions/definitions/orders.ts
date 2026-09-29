import { defineMercurPermissions } from "../registry"

export const ordersPermissions = defineMercurPermissions([
  { key: "orders", group: "orders", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "orders.refunds", group: "orders", surface: ["admin", "vendor"], rights: ["view", "edit"], requires: [{ key: "orders", right: "view" }] },
  { key: "orders.returns", group: "orders", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"], requires: [{ key: "orders", right: "view" }] },
  { key: "orders.edits", group: "orders", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"], requires: [{ key: "orders", right: "view" }] },
  { key: "order_groups", group: "orders", surface: ["admin"], rights: ["view"] },
])
