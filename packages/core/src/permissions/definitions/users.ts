import { defineMercurPermissions } from "../registry"

export const usersPermissions = defineMercurPermissions([
  { key: "users", group: "users", surface: ["admin"], rights: ["view", "edit", "manage"] },
])
