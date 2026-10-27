import { PayoutAccountDTO, PayoutDTO, PayoutReversalDTO } from "@mercurjs/types"

type PayoutSeller = { id: string; name: string | null; handle: string | null }

export type AdminPayout = PayoutDTO & {
  reversals?: PayoutReversalDTO[]
  seller?: PayoutSeller | null
  account?: {
    id: string
    status: string
    seller?: PayoutSeller | null
  } | null
}

export type AdminPayoutAccount = PayoutAccountDTO & {
  seller?: { id: string; name: string; handle: string } | null
  onboarding?: { id: string; data: Record<string, unknown> | null } | null
}
