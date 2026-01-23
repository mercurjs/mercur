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
  has_stock_location?: boolean;
  has_admin_stock_location?: boolean;
  q?: string;
  fields: string[];
  /**
   * Additional filters coming from API query params (everything except custom filters).
   * Example: id, created_at, updated_at, manage_inventory, allow_backorder, etc.
   */
  filters?: Record<string, unknown>;
  pagination?: {
    skip?: number;
    take?: number;
    order?: Record<string, string>;
  };
}

export interface ListFilteredProductVariantsOutput {
  variants: unknown[];
  count: number;
  offset: number;
  limit: number;
}

export const listFilteredProductVariantsWorkflow = createWorkflow(
  "list-filtered-product-variants",
  (input: ListFilteredProductVariantsInput) => {
    const hasFilters = transform({ input }, ({ input }) => {
      return (
        !!input.seller_id ||
        input.has_price !== undefined ||
        input.has_inventory !== undefined ||
        input.has_stock_location !== undefined ||
        input.has_admin_stock_location !== undefined
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
        has_stock_location: input.has_stock_location,
        has_admin_stock_location: input.has_admin_stock_location,
      });
    });

    const finalVariantIds = transform({ filterResult }, ({ filterResult }) => {
      return filterResult?.variantIds ?? null;
    });

    const finalVariantIdsAfterIntersection = transform(
      { input, finalVariantIds },
      ({ input, finalVariantIds }) => {
        if (finalVariantIds === null) {
          return null;
        }

        const rawExisting = (input.filters as any)?.id;
        const existingIds: string[] = Array.isArray(rawExisting)
          ? rawExisting.filter((id: any) => typeof id === "string" && id.length > 0)
          : typeof rawExisting === "string" && rawExisting.length > 0
            ? [rawExisting]
            : [];

        if (!existingIds.length) {
          return finalVariantIds;
        }

        const set = new Set(existingIds);
        return finalVariantIds.filter((id) => set.has(id));
      }
    );

    const isEmpty = transform(
      { finalVariantIdsAfterIntersection },
      ({ finalVariantIdsAfterIntersection }) => {
      return (
        finalVariantIdsAfterIntersection !== null &&
        Array.isArray(finalVariantIdsAfterIntersection) &&
        finalVariantIdsAfterIntersection.length === 0
      );
      }
    );

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
          { input, finalVariantIdsAfterIntersection },
          ({ input, finalVariantIdsAfterIntersection }) => {
            const filters: Record<string, unknown> = {
              ...(input.filters ?? {}),
            };

            if (finalVariantIdsAfterIntersection !== null) {
              filters.id = finalVariantIdsAfterIntersection;
            }

            const q = typeof input.q === "string" ? input.q.trim() : "";
            if (q) {
              const searchOr = [
                { title: { $ilike: `%${q}%` } },
                { sku: { $ilike: `%${q}%` } },
              ];

              // Don't overwrite existing $or/$and from validated filters – instead, AND the search in.
              const existingAnd = (filters as any).$and;
              if (Array.isArray(existingAnd)) {
                (filters as any).$and = [...existingAnd, { $or: searchOr }];
              } else if ((filters as any).$or) {
                (filters as any).$and = [{ $or: (filters as any).$or }, { $or: searchOr }];
                delete (filters as any).$or;
              } else {
                (filters as any).$or = searchOr;
              }
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
