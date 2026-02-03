import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { HttpTypes } from "@medusajs/framework/types";
import type { ProductVariantDTO } from "@medusajs/framework/types";

import {
  remapKeysForVariant,
} from "@medusajs/medusa/api/admin/products/helpers";
import { wrapVariantsWithTotalInventoryQuantity } from "@medusajs/medusa/api/utils/middlewares/products/variant-inventory-quantity";

import { attachManagedByToVariants } from "../../../../utils/stock-locations";
import {
  listFilteredProductVariantsWorkflow,
} from "../../../../workflows/product-variants/workflows/list-filtered-product-variants";
import type { AdminGetProductVariantsParamsType } from "./validators";
import {
  remapVariantWithManagedBy,
  splitVariantFilters,
} from "./utils";

/**
 * @oas [get] /admin/custom/product-variants
 * operationId: "AdminListProductVariantsFiltered"
 * summary: "List Product Variants (Filtered)"
 * description: "Retrieves a filtered list of product variants with advanced filtering options (seller, price, inventory)."
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
 *   - name: seller_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter by seller ID.
 *   - name: has_price
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter variants that have prices.
 *   - name: has_inventory
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter variants that have inventory items.
 *   - name: has_stock_location
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter variants that have at least one inventory level in any stock location.
 *   - name: has_admin_stock_location
 *     in: query
 *     schema:
 *       type: boolean
 *     required: false
 *     description: Filter variants that have (or don't have) at least one admin-owned stock location (not linked to any seller).
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search query for variant title or SKU.
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
 *             variants:
 *               type: array
 *               description: Array of product variants.
 *               items:
 *                 type: object
 *                 description: Product variant object with details.
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
 *   - Admin Product Variants
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetProductVariantsParamsType>,
  res: MedusaResponse<HttpTypes.AdminProductVariantListResponse>
) => {
  const withInventoryQuantity = !!req.queryConfig?.fields?.some((field) =>
    field.includes("inventory_quantity")
  );

  if (withInventoryQuantity) {
    req.queryConfig.fields = (req.queryConfig.fields ?? []).filter(
      (field) => !field.includes("inventory_quantity")
    );
  }

  const { custom, filters } = splitVariantFilters(req.filterableFields);

  const { result } = await listFilteredProductVariantsWorkflow(req.scope).run({
    input: {
      ...custom,
      fields: remapKeysForVariant(req.queryConfig.fields ?? []),
      filters,
      pagination: req.queryConfig.pagination,
    },
  });

  type WorkflowResult = {
    variants: ProductVariantDTO[];
    count: number;
    offset: number;
    limit: number;
  };

  const workflowResult = result as unknown as WorkflowResult;
  const filteredVariants: ProductVariantDTO[] = workflowResult.variants ?? [];

  await attachManagedByToVariants(req.scope, filteredVariants);

  if (withInventoryQuantity) {
    await wrapVariantsWithTotalInventoryQuantity(req, filteredVariants || []);
  }

  res.json({
    variants: filteredVariants.map(remapVariantWithManagedBy),
    count: workflowResult?.count ?? filteredVariants.length,
    offset: workflowResult?.offset ?? req.queryConfig.pagination?.skip ?? 0,
    limit: workflowResult?.limit ?? req.queryConfig.pagination?.take ?? 50,
  });
};
