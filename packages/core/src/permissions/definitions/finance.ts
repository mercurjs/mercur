import { defineMercurPermissions } from "../registry"

export const financePermissions = defineMercurPermissions([
  { key: "commissions", group: "finance", surface: ["admin", "vendor"], rights: ["view", "edit", "manage"] },
  { key: "payouts", group: "finance", surface: ["admin", "vendor"], rights: ["view", "edit"] },
  { key: "payout_accounts", group: "finance", surface: ["vendor"], rights: ["view", "edit"], requires: [{ key: "payouts", right: "view" }] },
  { key: "payments", group: "finance", surface: ["admin", "vendor"], rights: ["view", "edit"], requires: [{ key: "orders", right: "view" }] },
])
