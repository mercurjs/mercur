// Relations the store surface must never resolve, whatever route or `fields`
// query reaches them. Medusa applies the list as `RestrictedFieldFilter` on
// every `/store/*` request whose query config has no `allowed` list, so plugin
// and custom store routes get the same floor as the core ones.
export const STORE_RESTRICTED_FIELDS = [
  "payment_details",
  "professional_details",
  "member_invites",
  "members",
  "member",
  "seller_members",
  "seller_member",
  "payout_account",
  "payout_accounts",
  "onboarding",
  "payouts",
  "payout",
  "auth_identity",
  "auth_identities",
  "token",
  "token_hash",
]
