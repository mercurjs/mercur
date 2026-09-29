import { defineMercurPermissions } from "../registry"

export const reviewsPermissions = defineMercurPermissions([
  { key: "reviews", group: "reviews", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
