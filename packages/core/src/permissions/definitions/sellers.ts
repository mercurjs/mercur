import { defineMercurPermissions } from "../registry"

export const sellersPermissions = defineMercurPermissions([
  { key: "sellers", group: "sellers", surface: ["admin"], rights: ["view", "edit", "manage"] },
  { key: "sellers.approval", group: "sellers", surface: ["admin"], rights: ["edit"], requires: [{ key: "sellers", right: "view" }] },
  { key: "sellers.premium", group: "sellers", surface: ["admin"], rights: ["edit"], requires: [{ key: "sellers", right: "view" }] },
])
