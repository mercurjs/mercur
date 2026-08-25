import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { IRbacModuleService } from "@medusajs/types"
import { SellerRole } from "@mercurjs/types"
import { ensureSellerDefaultRoles } from "../../modules/seller/utils/ensure-seller-default-roles"
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
    currency_code: sellerMember.seller.currency_code,
  } as SellerContext

  if (!FeatureFlag.isFeatureEnabled("rbac")) {
    return next()
  }

  const rbacService: IRbacModuleService = req.scope.resolve(Modules.RBAC)

  await ensureSellerDefaultRoles(rbacService)

  req.auth_context.app_metadata = {
    ...req.auth_context.app_metadata,
    // Members predating RBAC have no role. Route policy checks reject an actor
    // with an empty role list outright, so fall back to the administration role
    // rather than locking them out of their own store.
    roles: [sellerMember.role_id || SellerRole.SELLER_ADMINISTRATION],
  }

  next()
}
