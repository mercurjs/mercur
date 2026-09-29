import { defineMercurPermissions } from "../registry"

export const customersPermissions = defineMercurPermissions([
  { key: "customers", group: "customers", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "customer_groups", group: "customers", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"], requires: [{ key: "customers", right: "view" }] },
])
