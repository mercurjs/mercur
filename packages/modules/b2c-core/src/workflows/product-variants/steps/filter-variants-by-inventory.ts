import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { Knex } from "@mikro-orm/postgresql";

import { ProductVariantFilterHelper } from "../helpers/product-variant-filter-helper";

export const filterVariantsByInventoryStep = createStep(
  "filter-variants-by-inventory",
  async (input: { hasInventory: boolean }, { container }) => {
    const knex = container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    ) as Knex;

    const filterHelper = new ProductVariantFilterHelper(knex);

    const variantIds = await filterHelper.handleInventoryFilter(
      input.hasInventory
    );

    return new StepResponse({
      variantIds,
    });
  }
);
