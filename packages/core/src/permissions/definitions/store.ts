import { defineMercurPermissions } from "../registry"

export const storePermissions = defineMercurPermissions([
  { key: "store", group: "store", surface: ["admin", "vendor"], rights: ["view", "edit"] },
])
