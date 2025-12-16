import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
  refetchEntities,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows";

import { fetchSellerByAuthActorId } from "../../../../../shared/infra/http/utils";
import { fetchProductDetails } from "../../../../../shared/infra/http/utils/products";
import {
  CreateProductVariantType,
  VendorGetProductVariantsParamsType,
} from "../../validators";
import { ProductUpdateRequestUpdatedEvent } from "@mercurjs/framework";

/**
 * @oas [get] /vendor/products/{id}/variants
 * operationId: "VendorListProductVariants"
 * summary: "List Product Variants"
 * description: "Retrieves a list of variants for a specific product. The product must belong to the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
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
 *     description: The field to sort the data by. By default, the sort order is ascending. To change the order to descending, prefix the field name with `-`.
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search term to filter variants by title, SKU, or other searchable properties.
 *   - name: id
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by variant ID(s).
 *   - name: sku
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by variant SKU(s).
 *   - name: title
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter by variant title(s).
 *   - name: manage_inventory
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter by whether inventory is managed.
 *   - name: allow_backorder
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter by whether backordering is allowed.
 *   - name: created_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by created_at date using operators like $gte, $lte, $gt, $lt.
 *   - name: updated_at
 *     in: query
 *     schema:
 *       type: object
 *     required: false
 *     description: Filter by updated_at date using operators like $gte, $lte, $gt, $lt.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             variants:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AdminProductVariant"
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
  req: MedusaRequest<VendorGetProductVariantsParamsType>,
  res: MedusaResponse
) => {
  const productId = req.params.id;

  const { data: variants, metadata } = await refetchEntities({
    entity: "variant",
    idOrFilter: {
      ...req.filterableFields,
      product_id: productId,
    },
    scope: req.scope,
    fields: req.queryConfig.fields ?? [],
    pagination: req.queryConfig.pagination,
  });

  res.json({
    variants,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  });
};

/**
 * @oas [post] /vendor/products/{id}/variants
 * operationId: "VendorCreateVariantForProductById"
 * summary: "Create variant for product"
 * description: "Creates variant for product."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
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
 *         $ref: "#/components/schemas/CreateProductVariant"
 * responses:
 *   "200":
 *     description: OK
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
  req: AuthenticatedMedusaRequest<CreateProductVariantType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  await createProductVariantsWorkflow.run({
    container: req.scope,
    input: {
      product_variants: [
        {
          ...req.validatedBody,
          product_id: req.params.id,
        },
      ],
      additional_data: {
        seller_id: seller.id,
      },
    },
  });

  const productDetails = await fetchProductDetails(req.params.id, req.scope);
  if (!["draft", "proposed"].includes(productDetails.status)) {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS);
    await eventBus.emit({
      name: ProductUpdateRequestUpdatedEvent.TO_CREATE,
      data: {
        data: {
          data: { product_id: req.params.id, title: productDetails.title },
          submitter_id: req.auth_context.actor_id,
          type: "product_update",
        },
        seller_id: seller.id,
      },
    });
  }

  const {
    data: [product],
  } = await query.graph(
    {
      entity: "product",
      fields: req.queryConfig.fields,
      filters: { id: req.params.id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ product });
};
