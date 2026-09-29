import { defineMercurPermissions } from "../registry"

export const translationsPermissions = defineMercurPermissions([
  { key: "translations", group: "translations", surface: ["admin"], rights: ["view", "edit"] },
])
