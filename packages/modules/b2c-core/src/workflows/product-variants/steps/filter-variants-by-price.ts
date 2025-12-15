import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { Knex } from "@mikro-orm/postgresql";

import { ProductVariantFilterHelper } from "../helpers/product-variant-filter-helper";

export const filterVariantsByPriceStep = createStep(
  "filter-variants-by-price",
  async (input: { hasPrice: boolean }, { container }) => {
    const knex = container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    ) as Knex;

    const filterHelper = new ProductVariantFilterHelper(knex);

    const variantIds = await filterHelper.handlePriceFilter(input.hasPrice);

    return new StepResponse({
      variantIds,
    });
  }
);
