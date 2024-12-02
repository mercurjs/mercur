import { MemberDTO, MemberInviteDTO } from "./common";

export interface CreateMemberDTO
  extends Omit<Partial<MemberDTO>, "id" | "created_at" | "updated_at"> {
  seller_id: string;
}

export interface UpdateMemberDTO extends Partial<MemberDTO> {
  id: string;
}

export interface CreateMemberInviteDTO
  extends Omit<
    MemberInviteDTO,
    "id" | "created_at" | "updated_at" | "accepted" | "expires_at" | "token"
  > {
  seller_id: string;
}

export interface AcceptMemberInviteDTO {
  token: string;
  name: string;
}

export interface UpdateMemberInviteDTO extends Partial<MemberInviteDTO> {
  id: string;
}
