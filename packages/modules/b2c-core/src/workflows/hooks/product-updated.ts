import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

import { AlgoliaEvents } from "@mercurjs/framework";

import { productsUpdatedHookHandler } from "../attribute/utils";
import { Link } from "@medusajs/framework/modules-sdk";
import { SECONDARY_CATEGORY_MODULE } from "../../modules/secondary_categories";
import { getSecondaryCategories } from "./product-created";
import SecondaryCategoryModuleService from "../../modules/secondary_categories/service";
import secondaryCategoryProduct from "../../links/secondary-category-product";

type ProductLike = { id: string };
type SecCatEntry = {
  product_id: string;
  add?: string[];
  remove?: string[];
  secondary_categories_ids?: string[];
};

export const updateProductSubcategories = async (
  products: ProductLike[],
  additional_data: { secondary_categories?: SecCatEntry[] } | undefined,
  container: any
) => {
  const link: Link = container.resolve(ContainerRegistrationKeys.LINK);
  const secondaryCategoryService: SecondaryCategoryModuleService =
    container.resolve(SECONDARY_CATEGORY_MODULE);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const entries = additional_data?.secondary_categories ?? [];
  if (!entries.length || !products?.length) return;

  const byId = new Map(entries.map((e) => [e.product_id, e]));

  await Promise.all(
    products.map(async (product) => {
      const match = byId.get(product.id);
      if (!match) return;

      const toAddRaw = match.add ?? match.secondary_categories_ids ?? [];
      const toRemoveRaw = match.remove ?? [];

      const toAddIds = [...new Set(toAddRaw.filter(Boolean))];
      const toRemoveIds = [...new Set(toRemoveRaw.filter(Boolean))];

      let confirmedAddIds: string[] = [];
      if (toAddIds.length) {
        const existingOrCreated = await getSecondaryCategories(
          toAddIds,
          container
        );
        confirmedAddIds = existingOrCreated.map((c) => c.id);
      }

      if (toRemoveIds.length) {
        await Promise.all(
          toRemoveIds.map(async (secId) => {
            const secondaryCategories =
              await secondaryCategoryService.listSecondaryCategories({
                category_id: secId
              })

            const {
              data: [secondaryCategoryLink]
            } = await query.graph({
              entity: secondaryCategoryProduct.entryPoint,
              fields: ['secondary_category_id'],
              filters: {
                secondary_category_id: secondaryCategories.map(
                  (secondaryCategory) => secondaryCategory.id
                ),
                product_id: product.id
              }
            })

            link
              .dismiss({
                [Modules.PRODUCT]: { product_id: product.id },
                [SECONDARY_CATEGORY_MODULE]: {
                  secondary_category_id:
                    secondaryCategoryLink.secondary_category_id
                }
              })
              .catch(() => {})
          })
        )
      }

      if (confirmedAddIds.length) {
        await Promise.all(
          confirmedAddIds.map((secId) =>
            link
              .create({
                [Modules.PRODUCT]: { product_id: product.id },
                [SECONDARY_CATEGORY_MODULE]: { secondary_category_id: secId },
              })
              .catch(() => {})
          )
        );
      }
    })
  );
};

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products, additional_data }, { container }) => {
    await productsUpdatedHookHandler({
      products,
      additional_data,
      container,
    });

    await updateProductSubcategories(
      products,
      additional_data as any,
      container
    );

    await container.resolve(Modules.EVENT_BUS).emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: { ids: products.map((product) => product.id) },
    });
  }
);
