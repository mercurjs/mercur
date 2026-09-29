import { defineMercurPermissions } from "../registry"

export const membersPermissions = defineMercurPermissions([
  { key: "members", group: "members", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "members.invites", group: "members", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"], requires: [{ key: "members", right: "view" }] },
])
