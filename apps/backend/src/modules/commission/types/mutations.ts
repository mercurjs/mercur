import {
  CommissionLineDTO,
  CommissionRateDTO,
  CommissionRuleDTO
} from './common'

export type CreateCommissionRateDTO = Omit<
  CommissionRateDTO,
  'id' | 'created_at' | 'updated_at'
>

export type CreateCommissionRuleDTO = Omit<
  CommissionRuleDTO,
  'id' | 'created_at' | 'updated_at'
>

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
