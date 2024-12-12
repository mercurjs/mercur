import { BigNumberInput } from '@medusajs/framework/types'

import { PaymentAccountStatus } from './common'

export type ProcessTransferContext = {
  amount: BigNumberInput
  currency: string
  reference_id: string
}

export type CreatePaymentAccountInput = {
  context: Record<string, unknown>
}

export interface IPayoutsProvider {
  processTransfer(context: ProcessTransferContext): Promise<void>
  retryTransfer(context: ProcessTransferContext): Promise<void>
  createPaymentAccount(context: CreatePaymentAccountInput): Promise<{
    data: Record<string, unknown>
    id: string
  }>
  updatePaymentAccount(data: Record<string, unknown>): Promise<void>
  getPaymentAccountStatus(
    paymentAccountData: Record<string, unknown>
  ): Promise<PaymentAccountStatus>
}
