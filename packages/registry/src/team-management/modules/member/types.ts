export type MemberRole = "owner" | "admin" | "member"

export const MemberRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const

export type CreateMemberDTO = {
  seller_id: string
  name: string
  email?: string
  role?: MemberRole
  bio?: string
  phone?: string
  photo?: string
}

export type UpdateMemberDTO = {
  id: string
  name?: string
  bio?: string
  phone?: string
  photo?: string
}

export type CreateMemberInviteDTO = {
  email: string
  role?: MemberRole
  seller_id: string
}

export type UpdateMemberInviteDTO = {
  id: string
  accepted?: boolean
}

export type AcceptMemberInviteDTO = {
  token: string
  name: string
}

export type MemberDTO = {
  id: string
  role: MemberRole
  name: string
  email: string | null
  bio: string | null
  phone: string | null
  photo: string | null
  seller_id: string
}

export type MemberInviteDTO = {
  id: string
  email: string
  role: MemberRole
  token: string
  expires_at: Date
  accepted: boolean
  seller?: { id: string }
}

export type VendorMemberListResponse = {
  members: MemberDTO[]
  count: number
  offset: number
  limit: number
}

export type VendorMemberResponse = {
  member: MemberDTO
}

export type VendorMemberInviteListResponse = {
  invites: MemberInviteDTO[]
  count: number
  offset: number
  limit: number
}

export type VendorMemberInviteResponse = {
  invite: MemberInviteDTO
}
