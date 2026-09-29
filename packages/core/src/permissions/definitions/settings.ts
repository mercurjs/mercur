import { defineMercurPermissions } from "../registry"

export const settingsPermissions = defineMercurPermissions([
  { key: "store", group: "settings", surface: ["admin", "vendor"], rights: ["view", "edit"] },
  { key: "regions_tax", group: "settings", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "sales_channels", group: "settings", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "return_reasons", group: "settings", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "refund_reasons", group: "settings", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "users", group: "settings", surface: ["admin"], rights: ["view", "edit", "manage"] },
  { key: "api_keys", group: "settings", surface: ["admin"], rights: ["view", "edit", "manage"] },
  { key: "platform", group: "settings", surface: ["admin"], rights: ["view", "edit"] },
])
