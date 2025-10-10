import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import { fetchSellerByAuthActorId } from "../../../shared/infra/http/utils";
import {
  VendorCreateProductType,
  VendorGetProductParamsType,
} from "./validators";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ProductRequestUpdatedEvent } from "@mercurjs/framework";

/**
 * @oas [get] /vendor/products
 * operationId: "VendorListProducts"
 * summary: "List Products"
 * description: "Retrieves a list of products for the authenticated vendor."
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
 *   - name: order
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: The order of the returned items.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorProduct"
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
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: MedusaRequest<VendorGetProductParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: sellerProducts, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  });

  res.json({
    products: sellerProducts,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};

/**
 * @oas [post] /vendor/products
 * operationId: "VendorCreateProduct"
 * summary: "Create a Product"
 * description: "Creates a new product for the authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateProduct"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product:
 *               $ref: "#/components/schemas/VendorProduct"
 * tags:
 *   - Vendor Products
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateProductType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const seller = await fetchSellerByAuthActorId(
    req.auth_context?.actor_id,
    req.scope
  );

  const { additional_data, ...validatedBody } = req.validatedBody;

  const {
    result: [createdProduct],
  } = await createProductsWorkflow.run({
    container: req.scope,
    input: {
      products: [
        {
          ...validatedBody,
          status: validatedBody.status === "draft" ? "draft" : "proposed",
        },
      ],
      additional_data: { ...additional_data, seller_id: seller.id },
    },
  });

  const eventBus = req.scope.resolve(Modules.EVENT_BUS);
  await eventBus.emit({
    name: ProductRequestUpdatedEvent.TO_CREATE,
    data: {
      seller_id: seller.id,
      data: {
        data: {
          ...createdProduct,
          product_id: createdProduct.id,
        },
        submitter_id: req.auth_context.actor_id,
        type: "product",
        status: createdProduct.status === "draft" ? "draft" : "pending",
      },
    },
  });

  const product_id = createdProduct.id;

  const {
    data: [product],
  } = await query.graph(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters: { id: product_id },
    },
    { throwIfKeyNotFound: true }
  );

  res.status(201).json({ product });
};
