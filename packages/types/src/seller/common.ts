export enum MemberRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export type SellerDTO = {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string | null;
  handle: string;
  photo: string | null;
  members?: Partial<MemberDTO>[];
};

export type MemberDTO = {
  id: string;
  created_at: Date;
  updated_at: Date;
  role: MemberRole;
  email: string;
  name: string | null;
  bio: string | null;
  photo: string | null;
  seller?: Partial<SellerDTO>;
};

export type MemberInviteDTO = {
  id: string;
  created_at: Date;
  updated_at: Date;
  email: string;
  role: MemberRole;
  seller?: Partial<SellerDTO>;
  token: string;
  expires_at: Date;
  accepted: boolean;
};
