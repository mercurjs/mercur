import { MemberDTO, MemberInviteDTO, SellerDTO } from './common'

export interface CreateSellerDTO
  extends Omit<
    Partial<SellerDTO>,
    'id' | 'created_at' | 'updated_at' | 'members' | 'status'
  > {
  name: string
}

export interface ChangeSellerStatusDTO extends Pick<SellerDTO, 'status'> {
  id: string
}

export interface UpdateSellerDTO extends Partial<Omit<SellerDTO, 'status'>> {
  id: string
}

export interface CreateMemberDTO
  extends Omit<Partial<MemberDTO>, 'id' | 'created_at' | 'updated_at'> {
  seller_id: string
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
