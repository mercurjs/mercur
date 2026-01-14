import { deduplicate } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";

import { filterVariantsCombinedStep } from "../steps";

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
    const hasFilters = transform({ input }, ({ input }) => {
      return (
        !!input.seller_id ||
        input.has_price !== undefined ||
        input.has_inventory !== undefined
      );
    });

    const filterResult = when(
      { hasFilters },
      ({ hasFilters }) => hasFilters
    ).then(() => {
      return filterVariantsCombinedStep({
        seller_id: input.seller_id,
        has_price: input.has_price,
        has_inventory: input.has_inventory,
      });
    });

    const finalVariantIds = transform({ filterResult }, ({ filterResult }) => {
      return filterResult?.variantIds ?? null;
    });

    const isEmpty = transform({ finalVariantIds }, ({ finalVariantIds }) => {
      return (
        finalVariantIds !== null &&
        Array.isArray(finalVariantIds) &&
        finalVariantIds.length === 0
      );
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
