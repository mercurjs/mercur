export interface CreateSubscriptionPlanDTO {
  currency_code: string
  monthly_amount: number
  free_months?: number
  requires_orders?: boolean
  metadata?: Record<string, unknown>
}

export interface UpdateSubscriptionPlanDTO {
  id: string
  monthly_amount?: number
  free_months?: number
  requires_orders?: boolean
  metadata?: Record<string, unknown> | null
}

export interface CreateSubscriptionOverrideDTO {
  reference: string
  reference_id: string
  plan_id: string
  monthly_amount?: number
  free_months?: number
  free_from?: Date
  free_to?: Date
  metadata?: Record<string, unknown>
}

export interface UpdateSubscriptionOverrideDTO {
  id: string
  monthly_amount?: number | null
  free_months?: number | null
  free_from?: Date | null
  free_to?: Date | null
  metadata?: Record<string, unknown> | null
}
