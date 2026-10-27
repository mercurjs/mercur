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
  deleteShippingZonesWorkflow,
  updateShippingZoneWorkflow,
} from "../../../../workflows/shipping-rule"
import { AdminUpdateShippingZoneType } from "../validators"

const retrieveShippingZone = async (
  req: AuthenticatedMedusaRequest,
  id: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [shipping_zone],
  } = await query.graph({
    entity: "shipping_zone",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  if (!shipping_zone) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipping zone with id ${id} was not found`
    )
  }

  return shipping_zone
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminShippingZoneResponse>
) => {
  res.json({ shipping_zone: await retrieveShippingZone(req, req.params.id) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateShippingZoneType>,
  res: MedusaResponse<HttpTypes.AdminShippingZoneResponse>
) => {
  await retrieveShippingZone(req, req.params.id)

  await updateShippingZoneWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.json({ shipping_zone: await retrieveShippingZone(req, req.params.id) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminShippingZoneDeleteResponse>
) => {
  await deleteShippingZonesWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.json({ id: req.params.id, object: "shipping_zone", deleted: true })
}
