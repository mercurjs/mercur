import { defineMercurPermissions } from "../registry"

export const salesChannelsPermissions = defineMercurPermissions([
  { key: "sales_channels", group: "sales-channels", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
