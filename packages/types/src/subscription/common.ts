export interface SubscriptionPlanDTO {
  id: string
  currency_code: string
  monthly_amount: number
  free_months: number
  requires_orders: boolean
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  overrides?: SubscriptionOverrideDTO[]
}

export interface SubscriptionOverrideDTO {
  id: string
  reference: string
  reference_id: string
  plan_id: string
  monthly_amount: number | null
  free_months: number | null
  free_from: Date | null
  free_to: Date | null
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
