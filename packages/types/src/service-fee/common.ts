import { BigNumberInput } from "@medusajs/types"

export enum ServiceFeeType {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
}

export enum ServiceFeeTarget {
  ITEM = "item",
  SHIPPING = "shipping",
}

export enum ServiceFeeStatus {
  ACTIVE = "active",
  PENDING = "pending",
  INACTIVE = "inactive",
}

export enum ServiceFeeChargingLevel {
  GLOBAL = "global",
  ITEM = "item",
  SHOP = "shop",
}

export type ServiceFeeRuleDTO = {
  id: string
  reference: string
  reference_id: string
  service_fee_id: string
  mode: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type ServiceFeeLineDTO = {
  id: string
  item_id: string
  service_fee_id: string | null
  code: string
  rate: number
  amount: number
  description: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type ServiceFeeDTO = {
  id: string
  name: string
  display_name: string
  code: string
  type: ServiceFeeType
  target: ServiceFeeTarget
  charging_level: ServiceFeeChargingLevel
  status: ServiceFeeStatus
  value: number
  currency_code: string | null
  min_amount: number | null
  max_amount: number | null
  include_tax: boolean
  is_enabled: boolean
  priority: number
  effective_date: Date | null
  start_date: Date | null
  end_date: Date | null
  replaces_fee_id: string | null
  rules?: ServiceFeeRuleDTO[]
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type ServiceFeeChangeLogDTO = {
  id: string
  service_fee_id: string
  action: string
  changed_by: string | null
  previous_snapshot: Record<string, unknown> | null
  new_snapshot: Record<string, unknown> | null
  created_at: Date
}

export interface ServiceFeeCalculationItemLine {
  id: string
  subtotal: BigNumberInput
  tax_total?: BigNumberInput
  product?: {
    id: string
    collection_id?: string
    tags?: { id: string }[]
    categories?: { id: string }[]
    type_id?: string
    seller?: { id: string }
  }
}

export interface ServiceFeeCalculationShippingLine {
  id: string
  subtotal: BigNumberInput
  tax_total?: BigNumberInput
  shipping_option?: {
    shipping_option_type_id?: string
  }
}

export interface ServiceFeeCalculationContext {
  currency_code: string
  items?: ServiceFeeCalculationItemLine[]
  shipping_methods?: ServiceFeeCalculationShippingLine[]
}

export interface CreateServiceFeeLineDTO {
  item_id: string
  service_fee_id: string
  code: string
  rate: number
  amount: number
  description?: string | null
}

export interface UpdateServiceFeeLineDTO
  extends Partial<CreateServiceFeeLineDTO> {
  id: string
}
