import { MemberDTO } from "../member";

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
