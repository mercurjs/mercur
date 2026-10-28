import { PayoutKycStatus } from "@mercurjs/types"

export type KycAttention = { account_id: string; kyc_status: string | null; disabled_reason: string | null }

export const needsKycAttention = (account: { kyc_status: string | null }) =>
  !!account.kyc_status && account.kyc_status !== PayoutKycStatus.APPROVED

export function kycAttentionNotifications(attention: KycAttention[], alerting: { email: string | null; from: string | null }) {
  if (!attention.length || !alerting.email) {
    return []
  }
  return [
    {
      to: alerting.email,
      from: alerting.from,
      channel: "email",
      template: "payout-kyc-required",
      data: { accounts: attention },
      content: {
        subject: `[Payouts] ${attention.length} account(s) need KYC attention`,
        text: attention
          .map((row) => `- ${row.account_id}: ${row.kyc_status}${row.disabled_reason ? ` (${row.disabled_reason})` : ""}`)
          .join("\n"),
      },
    },
  ]
}
