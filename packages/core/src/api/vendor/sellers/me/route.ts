import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorUpdateSellerType } from "../validators"
import { updateSellersWorkflow } from "../../../../workflows/seller"
import { attachPermissions, takePermissionsField } from "../../../utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const withPermissions = takePermissionsField(req)

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: sellerId },
  })

  res.json({ seller: attachPermissions(req, seller, withPermissions) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateSellerType>,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  const withPermissions = takePermissionsField(req)
  const { additional_data, ...update } = req.validatedBody

  await updateSellersWorkflow(req.scope).run({
    input: {
      selector: { id: sellerId },
      update,
      additional_data,
    },
  })

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: sellerId },
  })

  res.json({ seller: attachPermissions(req, seller, withPermissions) })
}
