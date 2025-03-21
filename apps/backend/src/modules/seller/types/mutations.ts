import { MemberInviteDTO, MemberRole, SellerDTO } from './common'

export interface CreateSellerDTO
  extends Omit<
    Partial<SellerDTO>,
    'id' | 'created_at' | 'updated_at' | 'members'
  > {
  name: string
}

export interface UpdateSellerDTO {
  id: string
  name?: string
  email?: string
  phone?: string
  description?: string
  address_line?: string
  city?: string
  state?: string
  postal_code?: string
  country_code?: string
  tax_id?: string
  handle?: string
  photo?: string
}

export interface CreateMemberDTO {
  seller_id: string
  role?: MemberRole
  name: string
  email: string
  bio?: string
  photo?: string
  phone?: string
}

export interface UpdateMemberDTO {
  id: string
  role?: MemberRole
  name?: string
  email?: string
  bio?: string
  photo?: string
  phone?: string
}

export interface CreateMemberInviteDTO
  extends Omit<
    MemberInviteDTO,
    'id' | 'created_at' | 'updated_at' | 'accepted' | 'expires_at' | 'token'
  > {
  seller_id: string
}

export interface AcceptMemberInviteDTO {
  token: string
  name: string
}

export interface UpdateMemberInviteDTO extends Partial<MemberInviteDTO> {
  id: string
}
