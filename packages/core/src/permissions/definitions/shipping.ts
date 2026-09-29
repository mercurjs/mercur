import { defineMercurPermissions } from "../registry"

export const shippingPermissions = defineMercurPermissions([
  { key: "shipping", group: "shipping", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
