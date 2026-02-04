import { getOrderDetailWorkflow } from "@medusajs/core-flows";
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { HttpTypes } from "@medusajs/framework/types";
import { AdminGetOrdersOrderParamsType } from "@medusajs/medusa/api/admin/claims/validators";
import {
  attachManagedByToOrderItems,
  attachStockLocationOwnerToFulfillments,
} from "../../../../utils/stock-locations";

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetOrdersOrderParamsType>,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const workflow = getOrderDetailWorkflow(req.scope);
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      order_id: req.params.id,
      version: req.validatedQuery.version as number,
    },
  }) as { result: HttpTypes.AdminOrder };

  await attachStockLocationOwnerToFulfillments(req.scope, result.fulfillments ?? []);

  await attachManagedByToOrderItems(req.scope, result.items ?? []);

  res.status(200).json({ order: result });
};
