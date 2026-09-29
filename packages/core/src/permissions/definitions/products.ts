import { defineMercurPermissions } from "../registry"

export const productsPermissions = defineMercurPermissions([
  { key: "products", group: "products", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "products.review", group: "products", surface: ["admin"], rights: ["edit"], requires: [{ key: "products", right: "view" }] },
  { key: "product_changes", group: "products", surface: ["admin", "vendor"], rights: ["view", "edit"], requires: [{ key: "products", right: "view" }] },
  { key: "product_categories", group: "products", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "product_collections", group: "products", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "product_types", group: "products", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "product_tags", group: "products", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
