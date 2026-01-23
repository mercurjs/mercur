import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { Knex } from "@mikro-orm/postgresql";

import sellerStockLocation from "../../../links/seller-stock-location";
import {
  ProductVariantFilterHelper,
  ProductVariantFilters,
} from "../helpers/product-variant-filter-helper";

export const filterVariantsCombinedStep = createStep(
  "filter-variants-combined",
  async (input: ProductVariantFilters, { container }) => {
    const knex = container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    ) as Knex;

    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const filterHelper = new ProductVariantFilterHelper(knex);

    let variantIds = await filterHelper.getFilteredVariantIds(input);

    if (
      input.has_admin_stock_location !== undefined &&
      Array.isArray(variantIds) &&
      variantIds.length > 0
    ) {
      const rows = await knex("product_variant_inventory_item as pvii")
        .distinct("pvii.variant_id as variant_id", "il.location_id as location_id")
        .innerJoin(
          "inventory_level as il",
          "il.inventory_item_id",
          "pvii.inventory_item_id"
        )
        .whereIn("pvii.variant_id", variantIds)
        .whereNull("pvii.deleted_at")
        .whereNotNull("il.location_id");

      const locationIds = [
        ...new Set(
          rows
            .map((r: any) => r?.location_id)
            .filter((id: any) => typeof id === "string" && id.length > 0)
        ),
      ];

      if (!locationIds.length) {
        variantIds = input.has_admin_stock_location ? [] : variantIds;
      } else {
        const { data: links } = await query.graph({
          entity: sellerStockLocation.entryPoint,
          fields: ["stock_location_id"],
          filters: { stock_location_id: locationIds },
        });

        const sellerLinkedLocationIdSet = new Set(
          (links ?? [])
            .map((l: any) => l?.stock_location_id)
            .filter((id: any) => typeof id === "string" && id.length > 0)
        );

        const variantIdHasAdminSet = new Set<string>();
        for (const r of rows) {
          const variantId = r?.variant_id;
          const locationId = r?.location_id;
          if (
            typeof variantId === "string" &&
            variantId.length > 0 &&
            typeof locationId === "string" &&
            locationId.length > 0 &&
            !sellerLinkedLocationIdSet.has(locationId)
          ) {
            variantIdHasAdminSet.add(variantId);
          }
        }

        variantIds = input.has_admin_stock_location
          ? variantIds.filter((id) => variantIdHasAdminSet.has(id))
          : variantIds.filter((id) => !variantIdHasAdminSet.has(id));
      }
    }

    return new StepResponse({
      variantIds,
    });
  }
);
