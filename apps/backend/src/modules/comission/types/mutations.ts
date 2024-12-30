import { ComissionLineDTO, ComissionRateDTO, ComissionRuleDTO } from './common'

export type CreateComissionRateDTO = Omit<
  ComissionRateDTO,
  'id' | 'created_at' | 'updated_at'
>

export type CreateComissionRuleDTO = Omit<
  ComissionRuleDTO,
  'id' | 'created_at' | 'updated_at'
>

export type CreateComissionLineDTO = Omit<
  ComissionLineDTO,
  'id' | 'created_at' | 'updated_at'
>

export type UpdateComissionRateDTO = Partial<CreateComissionRateDTO> & {
  id: string
}

export type UpdateComissionRuleDTO = Partial<CreateComissionRuleDTO> & {
  id: string
}
