import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

/**
 * Binds the `:id` path parameter of the `/vendor/sellers/:id` subtree to the
 * seller the request is authenticated against. Mismatches are reported as
 * NOT_FOUND so the route cannot be used to probe for existing seller ids.
 */
export async function ensureSellerIdParamMiddleware(
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const sellerId = req.seller_context?.seller_id

  if (!sellerId || req.params.id !== sellerId) {
    return next(
      new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Seller with id: ${req.params.id} was not found`
      )
    )
  }

  next()
}

/**
 * Binds the `:member_id` path parameter to a member of the authenticated
 * seller, so member management cannot reach another store's members.
 */
export async function ensureSellerMemberParamMiddleware(
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const sellerId = req.seller_context?.seller_id
  const sellerMemberId = req.params.member_id

  if (!sellerId) {
    return next(
      new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Seller member with id: ${sellerMemberId} was not found`
      )
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerMembers } = await query.graph({
    entity: "seller_member",
    fields: ["id"],
    filters: {
      id: sellerMemberId,
      seller_id: sellerId,
    },
  })

  if (!sellerMembers.length) {
    return next(
      new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Seller member with id: ${sellerMemberId} was not found`
      )
    )
  }

  next()
}
