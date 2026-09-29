import { defineMercurPermissions } from "../registry"

export const paymentsPermissions = defineMercurPermissions([
  { key: "payments", group: "payments", surface: ["admin", "vendor"], rights: ["view", "edit"], requires: [{ key: "orders", right: "view" }] },
])
