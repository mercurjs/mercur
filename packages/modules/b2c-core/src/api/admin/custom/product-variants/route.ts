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

import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils";
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
 * description: "Retrieves a filtered list of product variants with advanced filtering options (seller, price, inventory). Supports pricing context (region_id, currency_code, customer_id, customer_group_id) to return calculated_price when fields=+calculated_price is requested."
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
 *   - name: region_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Region ID used as pricing context. Required together with currency_code to retrieve calculated_price.
 *   - name: currency_code
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Currency code used as pricing context (e.g. "eur"). Required to retrieve calculated_price.
 *   - name: customer_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Customer ID used as pricing context. Enables customer-specific price list matching.
 *   - name: customer_group_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Customer group ID used as pricing context. Enables group-specific price list matching.
 *   - name: country_code
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Country code used as pricing context (e.g. "pl"). Required to calculate tax-inclusive prices (calculated_amount_with_tax).
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

  const { region_id, currency_code, customer_id, customer_group_id, country_code, ...filterableFields } =
    req.filterableFields as AdminGetProductVariantsParamsType;

  const pricingContext =
    region_id || currency_code || customer_id || customer_group_id || country_code
      ? {
          ...(region_id && { region_id }),
          ...(currency_code && { currency_code }),
          ...(customer_id && { customer_id }),
          ...(customer_group_id && { customer_group_id }),
          ...(country_code && { country_code }),
        }
      : undefined;

  const allFields = req.queryConfig.fields ?? [];
  const withCalculatedPrice = allFields.some((f) =>
    f === "calculated_price" || f.startsWith("calculated_price.")
  );
  const fieldsForWorkflow = allFields.filter(
    (f) => f !== "calculated_price" && !f.startsWith("calculated_price.")
  );

  const { custom, filters } = splitVariantFilters(filterableFields);

  const { result } = await listFilteredProductVariantsWorkflow(req.scope).run({
    input: {
      ...custom,
      fields: remapKeysForVariant(fieldsForWorkflow),
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

  if (pricingContext && withCalculatedPrice && filteredVariants.length > 0) {
    type PricedVariant = Pick<HttpTypes.AdminProductVariant, "id" | "calculated_price">;

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const variantIds = filteredVariants.map((v) => v.id);
    const { data: priced } = await query.graph({
      entity: "product_variant",
      fields: ["id", "calculated_price.*"],
      filters: { id: variantIds },
      context: {
        calculated_price: QueryContext(pricingContext),
      },
    });

    const pricingMap = new Map(
      (priced as unknown as PricedVariant[]).map((v) => [v.id, v.calculated_price ?? null])
    );
    filteredVariants.forEach((v) => {
      (v as unknown as PricedVariant).calculated_price = pricingMap.get(v.id) ?? undefined;
    });
  }

  res.json({
    variants: filteredVariants.map(remapVariantWithManagedBy),
    count: workflowResult?.count ?? filteredVariants.length,
    offset: workflowResult?.offset ?? req.queryConfig.pagination?.skip ?? 0,
    limit: workflowResult?.limit ?? req.queryConfig.pagination?.take ?? 50,
  });
};
