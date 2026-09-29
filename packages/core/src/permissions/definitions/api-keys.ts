import { defineMercurPermissions } from "../registry"

export const apiKeysPermissions = defineMercurPermissions([
  { key: "api_keys", group: "api-keys", surface: ["admin"], rights: ["view", "edit", "manage"] },
])
