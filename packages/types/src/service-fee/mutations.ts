import {
  ServiceFeeType,
  ServiceFeeTarget,
  ServiceFeeChargingLevel,
  ServiceFeeStatus,
} from "./common"

export interface CreateServiceFeeRuleDTO {
  reference: string
  reference_id: string
  mode?: string
}

export interface UpdateServiceFeeRuleDTO {
  id: string
  reference?: string
  reference_id?: string
  mode?: string
}

export interface CreateServiceFeeDTO {
  name: string
  display_name: string
  code: string
  type: ServiceFeeType
  target?: ServiceFeeTarget
  charging_level: ServiceFeeChargingLevel
  status?: ServiceFeeStatus
  value: number
  currency_code?: string | null
  min_amount?: number | null
  max_amount?: number | null
  include_tax?: boolean
  is_enabled?: boolean
  priority?: number
  effective_date?: Date | null
  start_date?: Date | null
  end_date?: Date | null
  replaces_fee_id?: string | null
  rules?: CreateServiceFeeRuleDTO[]
}

export interface UpdateServiceFeeDTO {
  id: string
  name?: string
  display_name?: string
  code?: string
  type?: ServiceFeeType
  target?: ServiceFeeTarget
  status?: ServiceFeeStatus
  value?: number
  currency_code?: string | null
  min_amount?: number | null
  max_amount?: number | null
  include_tax?: boolean
  is_enabled?: boolean
  priority?: number
  effective_date?: Date | null
  start_date?: Date | null
  end_date?: Date | null
}

export interface DeactivateServiceFeeDTO {
  id: string
  changed_by?: string
}
