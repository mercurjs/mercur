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
