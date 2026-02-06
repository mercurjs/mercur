import { CommissionRateType, CommissionRateTarget } from "./common"

export interface CreateCommissionRuleDTO {
  reference: string
  reference_id: string
}

export interface UpdateCommissionRuleDTO {
  id: string
  reference?: string
  reference_id?: string
}

export interface CreateCommissionRateDTO {
  name: string
  code: string
  type: CommissionRateType
  target?: CommissionRateTarget
  value: number
  currency_code?: string | null
  min_amount?: number | null
  include_tax?: boolean
  is_enabled?: boolean
  priority?: number
}

export interface UpdateCommissionRateDTO {
  id: string
  name?: string
  code?: string
  type?: CommissionRateType
  target?: CommissionRateTarget
  value?: number
  currency_code?: string | null
  min_amount?: number | null
  include_tax?: boolean
  is_enabled?: boolean
  priority?: number
}
