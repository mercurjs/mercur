import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import sellerMember from "../../../../links/seller-member"

export const applySellerMemberLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: sellerMember.entryPoint,
    resourceId: "member_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const validateSellerMember = async (
  scope: MedusaContainer,
  sellerId: string,
  memberId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [link],
  } = await query.graph({
    entity: sellerMember.entryPoint,
    filters: {
      seller_id: sellerId,
      member_id: memberId,
    },
    fields: ["seller_id", "member_id"],
  })

  if (!link) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Member with id: ${memberId} was not found`
    )
  }
}

export const fetchSellerByAuthActorId = async (
  authActorId: string,
  scope: MedusaContainer,
  fields: string[] = ["id"]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    filters: { id: authActorId },
    fields,
  })

  return seller
}
