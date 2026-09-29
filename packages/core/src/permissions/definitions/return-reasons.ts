import { defineMercurPermissions } from "../registry"

export const returnReasonsPermissions = defineMercurPermissions([
  { key: "return_reasons", group: "return-reasons", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
