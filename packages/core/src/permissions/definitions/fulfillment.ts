import { defineMercurPermissions } from "../registry"

export const fulfillmentPermissions = defineMercurPermissions([
  { key: "shipping_profiles", group: "fulfillment", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "shipping_options", group: "fulfillment", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "fulfillment_sets", group: "fulfillment", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
