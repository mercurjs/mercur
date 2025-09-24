export interface CommissionRule {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateCommissionRule {
  name: string
  description?: string
  is_active: boolean
}

export interface UpdateCommissionRule {
  is_active: boolean
}

export interface UpsertDefaultCommissionRule {
  name: string
  description?: string
  is_active: boolean
}

export interface AdminCommissionPriceValue {
  amount: number
  currency_code: string
}

export interface AdminCommissionAggregate {
  id?: string
  name?: string
  type?: 'flat' | 'percentage'
  reference?: string
  reference_id?: string
  is_active?: boolean
  include_tax?: boolean
  percentage_rate?: number
  price_set_id?: string
  price_set?: AdminCommissionPriceValue[]
  min_price_set_id?: string
  min_price_set?: AdminCommissionPriceValue[]
  max_price_set_id?: string
  max_price_set?: AdminCommissionPriceValue[]
  ref_value?: string
  fee_value?: string
}
