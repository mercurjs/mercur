import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  deleteInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { refetchInventoryItem, validateSellerInventoryItem } from "../../../helpers"
import { VendorUpdateInventoryLocationLevelType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateInventoryLocationLevelType>,
  res: MedusaResponse<HttpTypes.VendorInventoryItemResponse>
) => {
  const { id, location_id } = req.params

  await validateSellerInventoryItem(req.scope, req.auth_context.actor_id, id)

  await updateInventoryLevelsWorkflow(req.scope).run({
    input: {
      updates: [{ ...req.validatedBody, inventory_item_id: id, location_id }],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ inventory_item: inventoryItem })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorInventoryLevelDeleteResponse>
) => {
  const { id, location_id } = req.params

  await validateSellerInventoryItem(req.scope, req.auth_context.actor_id, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [level],
  } = await query.graph({
    entity: "inventory_level",
    filters: { inventory_item_id: id, location_id },
    fields: ["id", "reserved_quantity"],
  })

  if (!level) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory Level for Item ${id} at Location ${location_id} not found`
    )
  }

  if (level.reserved_quantity > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Cannot remove Inventory Level ${id} at Location ${location_id} because there are reservations at location`
    )
  }

  await deleteInventoryLevelsWorkflow(req.scope).run({
    input: {
      id: [level.id],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({
    id: level.id,
    object: "inventory-level",
    deleted: true,
    parent: inventoryItem,
  })
}
