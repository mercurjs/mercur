import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorMemberResponse } from "../../../../modules/member"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorMemberResponse>
) => {
  const memberId = req.auth_context.app_metadata.member_id as string

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [member],
  } = await query.graph(
    {
      entity: "member",
      fields: req.queryConfig.fields,
      filters: { id: memberId },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ member })
}
