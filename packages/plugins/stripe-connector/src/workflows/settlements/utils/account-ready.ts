import { PayoutAccountDTO } from "@mercurjs/types"

export const isPayoutReady = (account: PayoutAccountDTO | undefined): account is PayoutAccountDTO =>
  !!account?.payouts_enabled && !!account.external_id
