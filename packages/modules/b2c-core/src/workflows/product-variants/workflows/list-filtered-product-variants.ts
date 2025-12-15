import { deduplicate } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createWorkflow,
  parallelize,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";

import {
  filterVariantsByInventoryStep,
  filterVariantsByPriceStep,
  filterVariantsBySellerStep,
  intersectFilterResultsStep,
} from "../steps";

export interface ListFilteredProductVariantsInput {
  seller_id?: string;
  has_price?: boolean;
  has_inventory?: boolean;
  q?: string;
  fields: string[];
  pagination?: {
    skip?: number;
    take?: number;
    order?: Record<string, string>;
  };
}

export const listFilteredProductVariantsWorkflow = createWorkflow(
  "list-filtered-product-variants",
  (input: ListFilteredProductVariantsInput) => {
    const [sellerFilterResult, priceFilterResult, inventoryFilterResult] =
      parallelize(
        when({ input }, ({ input }) => !!input.seller_id).then(() => {
          return filterVariantsBySellerStep({
            sellerId: input.seller_id!,
          });
        }),
        when({ input }, ({ input }) => input.has_price !== undefined).then(
          () => {
            return filterVariantsByPriceStep({
              hasPrice: input.has_price!,
            });
          }
        ),
        when({ input }, ({ input }) => input.has_inventory !== undefined).then(
          () => {
            return filterVariantsByInventoryStep({
              hasInventory: input.has_inventory!,
            });
          }
        )
      );

    const filterResults = transform(
      {
        sellerFilterResult,
        priceFilterResult,
        inventoryFilterResult,
      },
      (data) => {
        return [
          data.sellerFilterResult,
          data.priceFilterResult,
          data.inventoryFilterResult,
        ];
      }
    );

    const { finalVariantIds } = intersectFilterResultsStep({ filterResults });

    const isEmpty = transform({ finalVariantIds }, ({ finalVariantIds }) => {
      return Array.isArray(finalVariantIds) && finalVariantIds.length === 0;
    });

    const emptyResponse = when({ isEmpty }, ({ isEmpty }) => isEmpty).then(
      () => {
        return transform(
          { pagination: input.pagination },
          ({ pagination }) => ({
            variants: [],
            count: 0,
            offset: pagination?.skip || 0,
            limit: pagination?.take || 50,
          })
        );
      }
    );

    const dataResponse = when({ isEmpty }, ({ isEmpty }) => !isEmpty).then(
      () => {
        const finalFilters = transform(
          { input, finalVariantIds },
          ({ input, finalVariantIds }) => {
            const filters: Record<string, unknown> = {};


            if (finalVariantIds !== null) {
              filters.id = finalVariantIds;
            }

            if (input.q) {
              filters.$or = [
                { title: { $ilike: `%${input.q}%` } },
                { sku: { $ilike: `%${input.q}%` } },
              ];
            }

            return filters;
          }
        );

        const fields = transform({ input }, ({ input }) => {
          return deduplicate([
            ...(input.fields ?? []),
            "id",
            "title",
            "sku",
            "product_id",
            "created_at",
            "updated_at",
          ]);
        });

        const { data: variants, metadata } = useQueryGraphStep({
          entity: "product_variant",
          fields,
          filters: finalFilters,
          pagination: input.pagination,
        });

        return transform({ variants, metadata }, ({ variants, metadata }) => ({
          variants,
          count: metadata?.count || 0,
          offset: metadata?.skip || 0,
          limit: metadata?.take || 50,
        }));
      }
    );

    const result = transform(
      { emptyResponse, dataResponse },
      ({ emptyResponse, dataResponse }) => {
        return emptyResponse || dataResponse;
      }
    );

    return new WorkflowResponse(result);
  }
);
