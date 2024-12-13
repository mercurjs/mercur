/* Transfer */

export enum TransferStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed'
}

/* Payment Account */

export enum PayoutAccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

export type PayoutAccountDTO = {
  id: string
  created_at: Date
  updated_at: Date
  reference_id: string
  data: Record<string, unknown>
  status: PayoutAccountStatus
}

export type OnboardingDTO = {
  id: string
  created_at: Date
  updated_at: Date
  data: Record<string, unknown>
  context: Record<string, unknown>
}
