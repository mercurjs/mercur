import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { attachPermissions, takePermissionsField } from "../../../utils"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUserParams>,
  res: MedusaResponse<HttpTypes.AdminUserWithPermissionsResponse>
) => {
  const id = req.auth_context.actor_id

  if (!id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `User ID not found`)
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const withPermissions = takePermissionsField(req)

  const {
    data: [user],
  } = await query.graph({
    entity: "user",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  if (!user) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `User with id: ${id} was not found`
    )
  }

  res.status(200).json({ user: attachPermissions(req, user, withPermissions) })
}
