/* Transfer */

export enum TransferStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed'
}

/* Payment Account */

export enum PaymentAccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

export type PaymentAccountDTO = {
  id: string
  created_at: Date
  updated_at: Date
  reference_id: string
  data: Record<string, unknown>
  status: PaymentAccountStatus
}
