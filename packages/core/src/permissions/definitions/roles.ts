import { defineMercurPermissions } from "../registry"

export const rolesPermissions = defineMercurPermissions([
  { key: "roles", group: "roles", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "roles.owner", group: "roles", surface: ["admin", "vendor"], rights: ["edit"], requires: [{ key: "roles", right: "view" }] },
])
