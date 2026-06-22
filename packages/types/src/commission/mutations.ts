import { CommissionRateType } from "./common"

export interface CreateCommissionRuleDTO {
  reference: string
  reference_id: string
}

export interface UpdateCommissionRuleDTO {
  id: string
  reference?: string
  reference_id?: string
}

export interface CreateCommissionRateValueDTO {
  currency_code: string
  amount: number
}

// Note: `rules` and `values` (hasMany relations) are intentionally NOT typed
// here. Medusa's auto-generated create/update types a hasMany as `string[]`
// (link-by-id), which conflicts with passing nested-create objects. They are
// validated at the HTTP boundary and flow through to the module's nested
// create/update at runtime (same mechanism the legacy `rules` relied on).
export interface CreateCommissionRateDTO {
  name: string
  // Optional: the commission module auto-generates a unique code from the
  // name when one is not provided.
  code?: string
  type: CommissionRateType
  value: number
  currency_code?: string | null
  include_tax?: boolean
  include_shipping?: boolean
  is_enabled?: boolean
  is_default?: boolean
}

export interface UpdateCommissionRateDTO {
  id: string
  name?: string
  code?: string
  type?: CommissionRateType
  value?: number
  currency_code?: string | null
  include_tax?: boolean
  include_shipping?: boolean
  is_enabled?: boolean
  is_default?: boolean
}
