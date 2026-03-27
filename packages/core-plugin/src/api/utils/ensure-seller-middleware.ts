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
  let sellerId = req.get(SELLER_ID_HEADER) || req.auth_context?.app_metadata?.seller_id as string

  // If no seller_id from header or app_metadata, resolve from member's seller associations
  if (!sellerId && req.auth_context?.actor_id) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: members } = await query.graph({
      entity: "member",
      fields: ["sellers.id"],
      filters: { id: req.auth_context.actor_id },
    })

    if (members?.[0]?.sellers?.[0]?.id) {
      sellerId = members[0].sellers[0].id
    }
  }

  if (!sellerId) {
    return next(
      new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `${SELLER_ID_HEADER} header is required for vendor routes`
      )
    )
  }

  req.seller_context = {
    seller_id: sellerId,
    seller_member: { id: req.auth_context?.actor_id, seller_id: sellerId, member_id: req.auth_context?.actor_id } as any,
  }

  next()
}
