import {
  deleteServiceZonesWorkflow,
  updateServiceZonesWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { IFulfillmentModuleService } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { refetchFulfillmentSet, validateSellerFulfillmentSet } from "../../../helpers"
import { VendorUpdateServiceZoneType } from "../../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorServiceZoneResponse>
) => {
  const { id, zone_id } = req.params
  const sellerId = req.auth_context.actor_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await validateSellerFulfillmentSet(req.scope, sellerId, id)

  const {
    data: [service_zone],
  } = await query.graph({
    entity: "service_zone",
    filters: { id: zone_id },
    fields: req.queryConfig.fields,
  })

  if (!service_zone) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Service zone with id: ${zone_id} not found`
    )
  }

  res.json({ service_zone })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateServiceZoneType>,
  res: MedusaResponse<HttpTypes.VendorFulfillmentSetResponse>
) => {
  const { id, zone_id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerFulfillmentSet(req.scope, sellerId, id)

  const fulfillmentModuleService =
    req.scope.resolve<IFulfillmentModuleService>(Modules.FULFILLMENT)

  const fulfillmentSet = await fulfillmentModuleService.retrieveFulfillmentSet(
    id,
    { relations: ["service_zones"] }
  )

  if (!fulfillmentSet.service_zones.find((s) => s.id === zone_id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Service zone with id: ${zone_id} not found on fulfillment set`
    )
  }

  await updateServiceZonesWorkflow(req.scope).run({
    input: {
      selector: { id: zone_id },
      update: req.validatedBody,
    },
  })

  const updatedFulfillmentSet = await refetchFulfillmentSet(
    req.scope,
    id,
    req.queryConfig.fields
  )

  res.json({ fulfillment_set: updatedFulfillmentSet })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorServiceZoneDeleteResponse>
) => {
  const { id, zone_id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerFulfillmentSet(req.scope, sellerId, id)

  const fulfillmentModuleService =
    req.scope.resolve<IFulfillmentModuleService>(Modules.FULFILLMENT)

  const fulfillmentSet = await fulfillmentModuleService.retrieveFulfillmentSet(
    id,
    { relations: ["service_zones"] }
  )

  if (!fulfillmentSet.service_zones.find((s) => s.id === zone_id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Service zone with id: ${zone_id} not found on fulfillment set`
    )
  }

  await deleteServiceZonesWorkflow(req.scope).run({
    input: { ids: [zone_id] },
  })

  res.json({
    id: zone_id,
    object: "service_zone",
    deleted: true,
  })
}
