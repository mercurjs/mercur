import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { deleteInventoryLevelsWorkflow } from "@medusajs/core-flows";
import { HttpTypes } from "@medusajs/framework/types";
import { refetchInventoryItem } from "@medusajs/medusa/api/admin/inventory-items/helpers";

// Overridden admin default delete inventory level route to force delete the inventory level with stocked items at the locations.

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse<HttpTypes.AdminInventoryLevelDeleteResponse>
) => {
  const { id, location_id } = req.params;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const result = await query.graph({
    entity: "inventory_level",
    filters: { inventory_item_id: id, location_id },
    fields: ["id", "reserved_quantity"],
  });

  const { id: levelId, reserved_quantity: reservedQuantity } = result.data[0];

  if (reservedQuantity > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Cannot remove Inventory Level ${id} at Location ${location_id} because there are reservations at location`
    );
  }

  const deleteInventoryLevelWorkflow = deleteInventoryLevelsWorkflow(req.scope);

  await deleteInventoryLevelWorkflow.run({
    input: {
      id: [levelId],
      force: true,
    },
  });

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  );

  res.status(200).json({
    id: levelId,
    object: "inventory-level",
    deleted: true,
    parent: inventoryItem,
  });
};
