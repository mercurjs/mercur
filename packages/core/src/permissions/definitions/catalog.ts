import { defineMercurPermissions } from "../registry"

export const catalogPermissions = defineMercurPermissions([
  { key: "products", group: "catalog", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "products.review", group: "catalog", surface: ["admin"], rights: ["edit"], requires: [{ key: "products", right: "view" }] },
  { key: "product_changes", group: "catalog", surface: ["admin", "vendor"], rights: ["view", "edit"], requires: [{ key: "products", right: "view" }] },
  { key: "offers", group: "catalog", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "attributes", group: "catalog", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "taxonomy", group: "catalog", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
