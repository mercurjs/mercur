import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"


const SELLER_ID_HEADER = "x-seller-id"

export async function ensureSellerMiddleware(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const sellerId = req.get(SELLER_ID_HEADER)

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
      fields: ["id", "seller_id", "member_id"],
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

  req.seller_context = {
    seller_id: sellerId,
    seller_member: sellerMembers[0],
  }

  next()
}
