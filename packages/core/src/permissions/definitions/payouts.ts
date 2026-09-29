import { defineMercurPermissions } from "../registry"

export const payoutsPermissions = defineMercurPermissions([
  { key: "payouts", group: "payouts", surface: ["admin", "vendor"], rights: ["view", "edit"] },
  { key: "payout_accounts", group: "payouts", surface: ["vendor"], rights: ["view", "edit"], requires: [{ key: "payouts", right: "view" }] },
])
