import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { fetchSellerByAuthActorId } from "../../../../../shared/infra/http/utils";
import { createVendorPriceListPricesWorkflow } from "../../../../../workflows/price-list/workflows";
import { VendorCreatePriceListPriceType } from "../../validators";

/**
 * @oas [post] /vendor/price-lists/{id}/prices
 * operationId: "VendorCreatePriceListPrice"
 * summary: "Create price list"
 * description: "Creates new price list price"
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the price list.
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreatePriceListPrice"
 * responses:
 *   "201":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             price_list:
 *               $ref: "#/components/schemas/VendorPriceList"
 * tags:
 *   - Vendor Price Lists
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreatePriceListPriceType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const id = req.params.id;

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  await createVendorPriceListPricesWorkflow.run({
    container: req.scope,
    input: {
      price_list_id: id,
      prices: [req.validatedBody],
      seller_id: seller.id,
    },
  });

  const { data: price_list } = await query.graph({
    entity: "price_list",
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id,
    },
  });

  res.status(201).json({ price_list });
};
