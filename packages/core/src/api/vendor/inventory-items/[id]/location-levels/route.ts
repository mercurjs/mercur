import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { refetchInventoryItem, validateSellerInventoryItem } from "../../helpers"
import {
  VendorCreateInventoryLocationLevelType,
  VendorGetInventoryLocationLevelsParamsType,
} from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetInventoryLocationLevelsParamsType>,
  res: MedusaResponse<HttpTypes.VendorInventoryLevelListResponse>
) => {
  const { id } = req.params

  await validateSellerInventoryItem(req.scope, req.auth_context.actor_id, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: inventory_levels, metadata } = await query.graph({
    entity: "inventory_level",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, inventory_item_id: id },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    inventory_levels,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateInventoryLocationLevelType>,
  res: MedusaResponse<HttpTypes.VendorInventoryItemResponse>
) => {
  const { id } = req.params

  await validateSellerInventoryItem(req.scope, req.auth_context.actor_id, id)

  await createInventoryLevelsWorkflow(req.scope).run({
    input: {
      inventory_levels: [
        {
          ...req.validatedBody,
          inventory_item_id: id,
        },
      ],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ inventory_item: inventoryItem })
}
