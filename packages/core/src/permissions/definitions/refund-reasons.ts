import { defineMercurPermissions } from "../registry"

export const refundReasonsPermissions = defineMercurPermissions([
  { key: "refund_reasons", group: "refund-reasons", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
])
