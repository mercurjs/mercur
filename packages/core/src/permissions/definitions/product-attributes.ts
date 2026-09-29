import { defineMercurPermissions } from "../registry"

export const productAttributesPermissions = defineMercurPermissions([
  { key: "product_attributes", group: "product-attributes", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
