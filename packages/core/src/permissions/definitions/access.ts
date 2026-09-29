import { defineMercurPermissions } from "../registry"

export const accessPermissions = defineMercurPermissions([
  { key: "access.roles", group: "access", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "access.owner", group: "access", surface: ["admin", "vendor"], rights: ["edit"], requires: [{ key: "access.roles", right: "view" }] },
])
