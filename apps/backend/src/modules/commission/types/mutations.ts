import { CommissionLineDTO } from './common'

export type Price = {
  amount: number
  currency_code: string
}

export type CreateCommissionRateDTO = {
  type: string
  percentage_rate?: number
  include_tax: boolean
  price_set?: Price[]
  min_price_set?: Price[]
  max_price_set?: Price[]
}

export type CreateCommissionRuleDTO = {
  name: string
  reference: string
  reference_id: string
  is_active: boolean
  rate: CreateCommissionRateDTO
}

export type CreateCommissionLineDTO = Omit<
  CommissionLineDTO,
  'id' | 'created_at' | 'updated_at'
>

export type UpdateCommissionRateDTO = Partial<CreateCommissionRateDTO> & {
  id: string
}

export type UpdateCommissionRuleDTO = Partial<CreateCommissionRuleDTO> & {
  id: string
}
