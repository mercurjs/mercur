import { BigNumberInput } from "@medusajs/framework/types"

export enum CommissionRateType {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
}

export enum CommissionRateTarget {
  ITEM = "item",
  SHIPPING = "shipping",
}

export type CommissionRuleDTO = {
  id: string
  reference: string
  reference_id: string
  commission_rate_id: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type CommissionLineDTO = {
  id: string
  item_id: string
  commission_rate_id: string | null
  code: string
  rate: number
  amount: number
  description: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type CommissionRateDTO = {
  id: string
  name: string
  code: string
  type: CommissionRateType
  target: CommissionRateTarget
  value: number
  currency_code: string | null
  min_amount: number | null
  include_tax: boolean
  is_enabled: boolean
  priority: number
  rules?: CommissionRuleDTO[]
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface CommissionCalculationItemLine {
  /**
   * The ID of the item line.
   */
  id: string

  /**
   * The subtotal of the line item (base amount for commission calculation).
   */
  subtotal: BigNumberInput

  /**
   * The tax total of the line item (used when include_tax is true).
   */
  tax_total?: BigNumberInput

  /**
   * The product of the line item.
   */
  product?: {
    id: string
    collection_id?: string
    tags?: { id: string }[]
    categories?: { id: string }[]
    type_id?: string
    seller?: { id: string }
  }
}

export interface CommissionCalculationShippingLine {
  /**
   * The ID of the shipping line.
   */
  id: string

  /**
   * The subtotal of the shipping method.
   */
  subtotal: BigNumberInput

  /**
   * The tax total of the shipping method (used when include_tax is true).
   */
  tax_total?: BigNumberInput

  /**
   * The shipping option type associated with the shipping method.
   */
  shipping_option?: {
    /**
     * The ID of the shipping option type associated with the shipping method.
     */
    shipping_option_type_id?: string
  }
}

export interface CommissionCalculationContext {
  /**
   * The cart's currency
   */
  currency_code: string

  /**
   * The cart's line items.
   */
  items?: CommissionCalculationItemLine[]

  /**
   * The cart's shipping methods.
   */
  shipping_methods?: CommissionCalculationShippingLine[]
}

export interface CreateCommissionLineDTO {
  item_id: string
  commission_rate_id: string
  code: string
  rate: number
  amount: number
  description?: string | null
}

export interface UpdateCommissionLineDTO extends Partial<CreateCommissionLineDTO> {
  id: string
}