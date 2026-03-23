import { SellerMemberDTO } from "@mercurjs/types"

export interface SellerContext {
  seller_id: string
  seller_member: SellerMemberDTO
}

declare module "express" {
  interface Request {
    seller_context?: SellerContext
  }
}
