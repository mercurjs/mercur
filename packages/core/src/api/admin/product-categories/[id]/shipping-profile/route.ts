import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { setProductCategoryShippingProfileWorkflow } from "../../../../../workflows/product/workflows/set-product-category-shipping-profile"
import { AdminSetCategoryShippingProfileType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSetCategoryShippingProfileType>,
  res: MedusaResponse<HttpTypes.AdminProductCategoryResponse>
) => {
  await setProductCategoryShippingProfileWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      shipping_profile_id: req.validatedBody.shipping_profile_id,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [product_category],
  } = await query.graph({
    entity: "product_category",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ product_category })
}
