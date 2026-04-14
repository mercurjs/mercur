import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { SellerContext } from "../../types/seller-context"

const SELLER_ID_HEADER = "x-seller-id"

export async function ensureSellerMiddleware(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  let sellerId = req.get(SELLER_ID_HEADER) || req.session?.seller_id

  if (!sellerId) {
    return next(
      new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `${SELLER_ID_HEADER} header is required for vendor routes`
      )
    )
  }

  const memberId = req.auth_context.actor_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerMembers } = await query.graph(
    {
      entity: "seller_member",
      fields: ["id", "seller_id", "member_id", "role_id", "seller.*"],
      filters: {
        seller_id: sellerId,
        member_id: memberId,
      },
    },
    { cache: { enable: true } }
  )

  if (!sellerMembers.length) {
    return next(
      new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You are not a member of this seller account"
      )
    )
  }

  const sellerMember = sellerMembers[0]

  req.seller_context = {
    seller_id: sellerId,
    seller_member: sellerMember,
    currency_code: sellerMember.seller.currency_code
  } as SellerContext

  if (sellerMember.role_id) {
    req.auth_context.app_metadata = {
      ...req.auth_context.app_metadata,
      roles: [sellerMember.role_id],
    }
  }

  next()
}
