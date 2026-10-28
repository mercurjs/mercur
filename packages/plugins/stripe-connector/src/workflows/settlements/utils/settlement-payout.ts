import { PayoutStatus } from "@mercurjs/types"

/** A bank payout that did not go out: refused by Stripe, or held on a short balance. */
export const isSettlementPayoutUnpaid = (settlement: { payout_status: PayoutStatus | null }) =>
  settlement.payout_status === PayoutStatus.FAILED || settlement.payout_status === PayoutStatus.ON_HOLD
