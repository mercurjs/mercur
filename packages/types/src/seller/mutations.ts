import { SellerDTO } from "./common";

export interface CreateSellerDTO
  extends Omit<
    Partial<SellerDTO>,
    "id" | "created_at" | "updated_at" | "members"
  > {
  name: string;
  handle: string;
}

export interface UpdateSellerDTO extends Partial<SellerDTO> {
  id: string;
}
