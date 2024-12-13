import { BigNumberInput } from '@medusajs/framework/types'

import { PayoutAccountStatus } from './common'

export type ProcessTransferContext = {
  amount: BigNumberInput
  currency: string
  reference_id: string
}

export type CreatePayoutAccountInput = {
  context: Record<string, unknown>
}

export interface IPayoutProvider {
  processTransfer(context: ProcessTransferContext): Promise<void>
  retryTransfer(context: ProcessTransferContext): Promise<void>
  createPayoutAccount(context: CreatePayoutAccountInput): Promise<{
    data: Record<string, unknown>
    id: string
  }>
  updatePayoutAccount(data: Record<string, unknown>): Promise<void>
  getPayoutAccountStatus(
    payoutAccountData: Record<string, unknown>
  ): Promise<PayoutAccountStatus>
}
