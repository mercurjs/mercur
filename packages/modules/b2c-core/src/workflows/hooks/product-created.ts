import { MedusaContainer } from "@medusajs/framework";
import { LinkDefinition, ProductDTO } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { StepResponse, WorkflowData } from "@medusajs/workflows-sdk";

import { AlgoliaEvents } from "@mercurjs/framework";
import { SELLER_MODULE } from "../../modules/seller";

import sellerShippingProfile from "../../links/seller-shipping-profile";
import { productsCreatedHookHandler } from "../attribute/utils";
import { SECONDARY_CATEGORY_MODULE } from "../../modules/secondary_categories";
import SecondaryCategoryModuleService from "../../modules/secondary_categories/service";
import { ISecondaryCategory } from "../../modules/secondary_categories/types/ISecondaryCategory";
import {
  OptionMetadataInput,
  updateProductOptionsMetadata,
} from "../../shared/infra/http/utils/products";

const getVariantInventoryItemIds = async (
  variantId: string,
  container: MedusaContainer
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const items = await query.graph({
    entity: "product_variant",
    fields: ["inventory_items.inventory_item_id"],
    filters: {
      id: variantId,
    },
  });

  return items.data
    .map((item) => item.inventory_items.map((ii) => ii.inventory_item_id))
    .flat(2);
};

const assignDefaultSellerShippingProfile = async (
  container: MedusaContainer,
  product_id: string,
  seller_id: string
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  const {
    data: [existingLink],
  } = await query.graph({
    entity: "product_shipping_profile",
    fields: ["*"],
    filters: {
      product_id,
    },
  });

  if (existingLink) {
    return;
  }

  const { data: shippingProfiles } = await query.graph({
    entity: sellerShippingProfile.entryPoint,
    fields: ["shipping_profile.id", "shipping_profile.type"],
    filters: {
      seller_id,
    },
  });

  const [profile] = shippingProfiles.filter(
    (relation) => relation.shipping_profile.type === "default"
  );

  if (!profile) {
    return;
  }

  await link.create({
    [Modules.PRODUCT]: {
      product_id,
    },
    [Modules.FULFILLMENT]: {
      shipping_profile_id: profile.shipping_profile.id,
    },
  });
};

export const getOrCreateSecondaryCategories = async (
  categoryIds: string[],
  container
) => {
  const secondaryCategoryService: SecondaryCategoryModuleService =
    container.resolve(SECONDARY_CATEGORY_MODULE);

  const existingSecondaryCategories =
    await secondaryCategoryService.listSecondaryCategories({
      category_id: categoryIds,
    });

  const existingSecondaryCategoriesByCategoryIdMap = new Map<string, ISecondaryCategory>(
    existingSecondaryCategories.map((secondaryCategory: ISecondaryCategory) => [secondaryCategory.category_id, secondaryCategory])
  );

  console.log("existingSecondaryCategoriesMap", existingSecondaryCategoriesByCategoryIdMap);

  const results = [] as ISecondaryCategory[];

  for (const id of categoryIds) {
    if (existingSecondaryCategoriesByCategoryIdMap.has(id)) {
      results.push(existingSecondaryCategoriesByCategoryIdMap.get(id)!);
    } else {
      const created = await secondaryCategoryService.createSecondaryCategories({
        category_id: id,
      });
      results.push(created);
    }
  }

  return results;
};

const createSecondaryCategories = async (
  products: WorkflowData<ProductDTO[]>,
  additional_data: {
    secondary_categories: {
      sec_cat_product_key: string;
      category_ids: string[];
    }[];
  },
  container: MedusaContainer
) => {
  const links: LinkDefinition[] = [];

  await Promise.all(
    products.map(async (product) => {
      if ((additional_data)?.secondary_categories?.length > 0) {
        const categoryIds =
          additional_data.secondary_categories.find(
            (s) => s.sec_cat_product_key === product.metadata?.sec_cat_product_key
          )?.category_ids ?? [];

        const mappedSecondaryCategories = await getOrCreateSecondaryCategories(
          categoryIds,
          container
        );

        mappedSecondaryCategories.forEach((secondaryCategory) => {
          links.push({
            [Modules.PRODUCT]: {
              product_id: product.id,
            },
            [SECONDARY_CATEGORY_MODULE]: {
              secondary_category_id: secondaryCategory.id,
            },
          });
        });
      }
    })
  );

  return links;
};

createProductsWorkflow.hooks.productsCreated(
  async (
    {
      products,
      additional_data,
    }: {
      products: WorkflowData<ProductDTO[]>;
      additional_data: {
        seller_id: string | null;
        secondary_categories: {
          sec_cat_product_key: string;
          category_ids: string[];
        }[];
        options_metadata?: OptionMetadataInput[];
      };
    },
    { container }
  ) => {
    await productsCreatedHookHandler({
      products,
      additional_data,
      container,
    });

    await updateProductOptionsMetadata(
      container,
      products,
      additional_data?.options_metadata
    );

    const link = container.resolve(ContainerRegistrationKeys.LINK);

    if (!additional_data?.seller_id) {
      return new StepResponse(undefined, null);
    }

    const variants = products.map((p) => p.variants).flat();

    const remoteLinks: LinkDefinition[] = products.map((product) => {
      return {
        [SELLER_MODULE]: {
          seller_id: additional_data.seller_id,
        },
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
      };
    });

    for (const variant of variants) {
      if (variant.manage_inventory) {
        const inventoryItemIds = await getVariantInventoryItemIds(
          variant.id,
          container
        );

        inventoryItemIds.forEach((inventory_item_id) => {
          remoteLinks.push({
            [SELLER_MODULE]: {
              seller_id: additional_data.seller_id,
            },
            [Modules.INVENTORY]: {
              inventory_item_id,
            },
          });
        });
      }
    }

    const secondaryCategories = await createSecondaryCategories(
      products,
      additional_data,
      container
    );

    await Promise.all(
      products.map((p) =>
        assignDefaultSellerShippingProfile(
          container,
          p.id,
          additional_data.seller_id as string
        )
      )
    );

    await link.create([...remoteLinks, ...secondaryCategories]);

    await container.resolve(Modules.EVENT_BUS).emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: { ids: products.map((product) => product.id) },
    });

    return new StepResponse(
      undefined,
      products.map((product) => product.id)
    );
  },
  async (productIds: string[] | null, { container }) => {
    if (!productIds) {
      return;
    }
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await link.dismiss(
      productIds.map((productId) => ({
        [Modules.PRODUCT]: {
          product_id: productId,
        },
      }))
    );
  }
);
