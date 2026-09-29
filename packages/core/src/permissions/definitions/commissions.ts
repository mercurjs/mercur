import { defineMercurPermissions } from "../registry"

export const commissionsPermissions = defineMercurPermissions([
  { key: "commission_rates", group: "commissions", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "commission_lines", group: "commissions", surface: ["admin", "vendor"], rights: ["view"] },
])
