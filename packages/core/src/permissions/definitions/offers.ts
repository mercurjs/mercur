import { defineMercurPermissions } from "../registry"

export const offersPermissions = defineMercurPermissions([
  { key: "offers", group: "offers", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
