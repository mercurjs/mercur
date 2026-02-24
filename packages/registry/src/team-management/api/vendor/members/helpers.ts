import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  isDefined,
  MedusaError,
} from "@medusajs/framework/utils"

export const authenticateMember = () => (req: AuthenticatedMedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
  const appMetadata = req.auth_context.app_metadata

  if (!isDefined(appMetadata.member_id)) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  next()
}

export const applySellerMemberFilter = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id
  next()
}

export const validateSellerMember = async (
  scope: MedusaContainer,
  sellerId: string,
  memberId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [member],
  } = await query.graph({
    entity: "member",
    filters: {
      id: memberId,
      seller_id: sellerId,
    },
    fields: ["id"],
  })

  if (!member) {
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
