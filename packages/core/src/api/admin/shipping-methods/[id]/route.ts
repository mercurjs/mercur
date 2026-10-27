import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import {
  deleteShippingMethodsWorkflow,
  updateShippingMethodsWorkflow,
} from "../../../../workflows/shipping-rule"
import { AdminUpdateShippingMethodType } from "../validators"

const retrieveShippingMethod = async (
  req: AuthenticatedMedusaRequest,
  id: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [shipping_method],
  } = await query.graph({
    entity: "marketplace_shipping_method",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  if (!shipping_method) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipping method with id ${id} was not found`
    )
  }

  return shipping_method
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminShippingMethodResponse>
) => {
  res.json({
    shipping_method: await retrieveShippingMethod(req, req.params.id),
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateShippingMethodType>,
  res: MedusaResponse<HttpTypes.AdminShippingMethodResponse>
) => {
  await retrieveShippingMethod(req, req.params.id)

  await updateShippingMethodsWorkflow(req.scope).run({
    input: { shipping_methods: [{ id: req.params.id, ...req.validatedBody }] },
  })

  res.json({
    shipping_method: await retrieveShippingMethod(req, req.params.id),
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminShippingMethodDeleteResponse>
) => {
  await deleteShippingMethodsWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.json({ id: req.params.id, object: "shipping_method", deleted: true })
}
