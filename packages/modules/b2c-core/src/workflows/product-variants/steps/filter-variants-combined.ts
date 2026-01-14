import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { Knex } from "@mikro-orm/postgresql";

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

    const filterHelper = new ProductVariantFilterHelper(knex);

    const variantIds = await filterHelper.getFilteredVariantIds(input);

    return new StepResponse({
      variantIds,
    });
  }
);
