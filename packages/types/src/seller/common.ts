export type SellerModuleOptions = {
  invite_valid_duration?: number
  jwt_secret?: string
  vendor_url?: string
}

export enum SellerRole {
  SELLER_ADMINISTRATION = "role_seller_administration",
  INVENTORY_MANAGEMENT = "role_seller_inventory_management",
  ORDER_MANAGEMENT = "role_seller_order_management",
  ACCOUNTING = "role_seller_accounting",
  SUPPORT = "role_seller_support",
}

export enum SellerStatus {
  OPEN = "open",
  PENDING_APPROVAL = "pending_approval",
  SUSPENDED = "suspended",
  TERMINATED = "terminated",
}

export interface ProfessionalDetailsDTO {
  id: string
  corporate_name: string | null
  registration_number: string | null
  tax_id: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateProfessionalDetailsDTO {
  corporate_name?: string | null
  registration_number?: string | null
  tax_id?: string | null
}

export interface UpdateProfessionalDetailsDTO {
  corporate_name?: string | null
  registration_number?: string | null
  tax_id?: string | null
}

export interface PaymentDetailsDTO {
  id: string
  country_code: string
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
  country_code: string
  holder_name: string
  bank_name?: string | null
  iban?: string | null
  bic?: string | null
  routing_number?: string | null
  account_number?: string | null
}

export interface UpdatePaymentDetailsDTO {
  country_code?: string
  holder_name?: string
  bank_name?: string | null
  iban?: string | null
  bic?: string | null
  routing_number?: string | null
  account_number?: string | null
}

export interface SellerAddressDTO {
  id: string
  name: string | null
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
  name?: string | null
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
  name?: string | null
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
  seller: SellerDTO
  member: MemberDTO
  seller_id: string
  member_id: string
  is_owner: boolean
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  role_id: string
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
  phone: string | null
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
  closure_note: string | null
  professional_details: ProfessionalDetailsDTO | null
  address: SellerAddressDTO | null
  payment_details: PaymentDetailsDTO | null
  members: MemberDTO[]
  metadata: Record<string, unknown> | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
