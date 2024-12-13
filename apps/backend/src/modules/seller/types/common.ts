export type SellerDTO = {
  id: string
  created_at: Date
  updated_at: Date
  name: string
  description: string | null
  handle: string
  photo: string | null
  members?: Partial<MemberDTO>[]
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export type MemberDTO = {
  id: string
  created_at: Date
  updated_at: Date
  role: MemberRole
  name: string | null
  bio: string | null
  photo: string | null
  phone: string | null
  seller?: Partial<SellerDTO>
}

export type MemberInviteDTO = {
  id: string
  created_at: Date
  updated_at: Date
  email: string
  role: MemberRole
  seller?: Partial<SellerDTO>
  token: string
  expires_at: Date
  accepted: boolean
}

export type OnboardingDTO = {
  id: string
  created_at: Date
  updated_at: Date
  is_payout_account_setup_completed: boolean
  seller?: Partial<SellerDTO>
}
