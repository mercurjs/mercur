import { SellerMemberDTO } from "@mercurjs/types"

export interface SellerContext {
  seller_id: string
  currency_code: string
  seller_member: SellerMemberDTO
}

declare global {
  namespace Express {
    interface Request {
      seller_context?: SellerContext
    }
  }
}
