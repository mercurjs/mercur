import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";

import { IntermediateEvents } from "@mercurjs/framework";
import { SELLER_MODULE } from "../../../modules/seller";

import sellerShippingOption from "../../../links/seller-shipping-option";
import { fetchSellerByAuthActorId } from "../../../shared/infra/http/utils";
import {
  VendorCreateShippingOptionType,
  VendorGetShippingParamsType,
} from "./validators";

/**
 * @oas [post] /vendor/shipping-options
 * operationId: "VendorCreateShippingOption"
 * summary: "Create a Shipping Option"
 * description: "Creates a Shipping Option for authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateShippingOption"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             shipping_option:
 *               $ref: "#/components/schemas/VendorShippingOption"
 * tags:
 *   - Vendor Shipping Options
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateShippingOptionType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  const seller = await fetchSellerByAuthActorId(
    req.auth_context?.actor_id,
    req.scope
  );

  const { result } = await createShippingOptionsWorkflow(req.scope).run({
    input: [
      {
        ...req.validatedBody,
        price_type: "flat",
      },
    ],
  });

  // TODO: Move this into createShippingOptionsWorkflow workflow hook
  await remoteLink.create({
    [SELLER_MODULE]: {
      seller_id: seller.id,
    },
    [Modules.FULFILLMENT]: {
      shipping_option_id: result[0].id,
    },
  });

  const eventBus = req.scope.resolve(Modules.EVENT_BUS);
  await eventBus.emit({
    name: IntermediateEvents.SHIPPING_OPTION_CHANGED,
    data: { id: result[0].id },
  });

  const {
    data: [shipping_option],
  } = await query.graph(
    {
      entity: "shipping_option",
      fields: req.queryConfig.fields,
      filters: { id: result[0].id },
    },
    { throwIfKeyNotFound: true }
  );

  res.status(201).json({ shipping_option });
};

/**
 * @oas [get] /vendor/shipping-options
 * operationId: "VendorListShippingOptions"
 * summary: "List Shipping Options"
 * description: "Retrieves a list of Shipping Options for authenticated vendor."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             shipping_options:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorShippingOption"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Vendor Shipping Options
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetShippingParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: sellerShippingOptions, metadata } = await query.graph({
    entity: sellerShippingOption.entryPoint,
    fields: req.queryConfig.fields.map((field) => `shipping_option.${field}`),
    filters: {
      ...req.filterableFields,
      deleted_at: {
        $eq: null,
      },
    },
    pagination: req.queryConfig.pagination,
  });

  res.json({
    shipping_options: sellerShippingOptions.map((rel) => rel.shipping_option),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};
