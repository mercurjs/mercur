export type SellerModuleOptions = {
  invite_valid_duration?: number
}

export enum SellerStatus {
  OPEN = "open",
  PENDING_APPROVAL = "pending_approval",
  SUSPENDED = "suspended",
  TERMINATED = "terminated",
}

export interface ProfessionalDetailsDTO {
  id: string
  corporate_name: string
  registration_number: string | null
  tax_id: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateProfessionalDetailsDTO {
  corporate_name: string
  registration_number?: string | null
  tax_id?: string | null
}

export interface UpdateProfessionalDetailsDTO {
  corporate_name?: string
  registration_number?: string | null
  tax_id?: string | null
}

export interface PaymentDetailsDTO {
  id: string
  holder_name: string
  bank_name: string | null
  iban: string | null
  bic: string | null
  routing_number: string | null
  account_number: string | null
  created_at: Date
  updated_at: Date
}

export interface CreatePaymentDetailsDTO {
  holder_name: string
  bank_name?: string | null
  iban?: string | null
  bic?: string | null
  routing_number?: string | null
  account_number?: string | null
}

export interface UpdatePaymentDetailsDTO {
  holder_name?: string
  bank_name?: string | null
  iban?: string | null
  bic?: string | null
  routing_number?: string | null
  account_number?: string | null
}

export interface SellerAddressDTO {
  id: string
  company: string | null
  first_name: string | null
  last_name: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  country_code: string | null
  province: string | null
  postal_code: string | null
  phone: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface CreateSellerAddressDTO {
  company?: string | null
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  country_code?: string | null
  province?: string | null
  postal_code?: string | null
  phone?: string | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateSellerAddressDTO {
  company?: string | null
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  country_code?: string | null
  province?: string | null
  postal_code?: string | null
  phone?: string | null
  metadata?: Record<string, unknown> | null
}

export interface MemberDTO {
  id: string
  email: string
  locale: string | null
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface CreateMemberDTO {
  email: string
  locale?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateMemberDTO {
  email?: string
  locale?: string | null
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface SellerMemberDTO {
  id: string
  seller_id: string
  member_id: string
  is_owner: boolean
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface MemberInviteDTO {
  id: string
  email: string
  token: string
  accepted: boolean
  expires_at: Date
  role_id: string
  seller_id: string
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
}

export interface CreateMemberInviteDTO {
  email: string
  role_id: string
  seller_id: string
  metadata?: Record<string, unknown> | null
}

export interface SellerDTO {
  id: string
  name: string
  handle: string
  email: string
  description: string | null
  logo: string | null
  banner: string | null
  website_url: string | null
  external_id: string | null
  currency_code: string
  status: string
  status_reason: string | null
  is_premium: boolean
  closed_from: Date | null
  closed_to: Date | null
  professional_details: ProfessionalDetailsDTO | null
  address: SellerAddressDTO | null
  payment_details: PaymentDetailsDTO | null
  members: MemberDTO[]
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
