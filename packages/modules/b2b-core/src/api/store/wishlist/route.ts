import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  container,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { calculateWishlistProductsPrice } from "../../../modules/wishlist/utils";

import customerWishlist from "../../../links/customer-wishlist";
import { createWishlistEntryWorkflow } from "../../../workflows/wishlist/workflows";
import { StoreCreateWishlistType } from "./validators";

/**
 * @oas [post] /store/wishlist
 * operationId: "StoreCreateNewWishlist"
 * summary: "Create new wishlist entry"
 * description: "Creates a new wishlist entry by specifying a reference type and reference ID."
 * x-authenticated: true
 * parameters:
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
 *         $ref: "#/components/schemas/StoreCreateWishlist"
 * responses:
 *   "201":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Id of the wishlsit nad reference id.
 *             created_at:
 *               type: string
 *               format: date-time
 *               description: The date with timezone at which the resource was created.
 *             updated_at:
 *               type: string
 *               format: date-time
 *               description: The date with timezone at which the resource was last updated.
 *             deleted_at:
 *               type: string
 *               format: date-time
 *               description: The date with timezone at which the resource was deleted.
 * tags:
 *   - Store Wishlist
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateWishlistType>,
  res: MedusaResponse
) => {
  const { result } = await createWishlistEntryWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      customer_id: req.auth_context.actor_id,
    },
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [wishlist],
  } = await query.graph({
    entity: "wishlist",
    fields: req.queryConfig.fields,
    filters: {
      id: result.id,
    },
  });

  res.status(201).json({ wishlist });
};

/**
 * @oas [get] /store/wishlist
 * operationId: "StoreGetMyWishlist"
 * summary: "Get wishlist of the current user"
 * description: "Retrieves the wishlist created by the authenticated user."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             wishlists:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Wishlist"
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
 *   - Store Wishlist
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: wishlists, metadata } = await query.graph({
    entity: customerWishlist.entryPoint,
    fields: [
      ...req.queryConfig.fields.map((field) => `wishlist.products.${field}`),
      "wishlist.products.variants.prices.*",
    ],
    filters: {
      customer_id: req.auth_context.actor_id,
    },
    pagination: req.queryConfig.pagination,
  });

  const formattedWithPrices = await calculateWishlistProductsPrice(
    container,
    wishlists
  );

  res.json({
    wishlists: formattedWithPrices,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  });
};
