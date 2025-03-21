import { MemberDTO, MemberInviteDTO, MemberRole, SellerDTO } from './common'

export interface CreateSellerDTO
  extends Omit<
    Partial<SellerDTO>,
    'id' | 'created_at' | 'updated_at' | 'members'
  > {
  name: string
}

export interface UpdateSellerDTO extends Partial<SellerDTO> {
  id: string
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

export interface UpdateMemberDTO extends Partial<MemberDTO> {
  id: string
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
