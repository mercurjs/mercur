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

export const getSecondaryCategories = async (
  secondaryCategoriesIds: string[],
  container
) => {
  const secondaryCategoryService: SecondaryCategoryModuleService =
    container.resolve(SECONDARY_CATEGORY_MODULE);

  const existingCategories =
    await secondaryCategoryService.listSecondaryCategories({
      category_id: secondaryCategoriesIds,
    });

  const existingMap = new Map<string, ISecondaryCategory>(
    existingCategories.map((cat: ISecondaryCategory) => [cat.id, cat])
  );

  const results = [] as ISecondaryCategory[];

  for (const id of secondaryCategoriesIds) {
    if (existingMap.has(id)) {
      results.push(existingMap.get(id)!);
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
      handle: string;
      secondary_categories_ids: string[];
    }[];
  },
  container: MedusaContainer
) => {
  const links: LinkDefinition[] = [];
  products.map(async (product) => {
    if ((additional_data as any)?.secondary_categories?.length > 0) {
      const secondaryCategoriesIds =
        additional_data.secondary_categories.find(
          (s) => s.handle === product.handle
        )?.secondary_categories_ids ?? [];

      const mappedSecondaryCategories = await getSecondaryCategories(
        secondaryCategoriesIds,
        container
      );

      mappedSecondaryCategories.map((secondaryCategory) => {
        links.push({
          [Modules.PRODUCT]: {
            product_id: product.id,
          },
          [SECONDARY_CATEGORY_MODULE]: {
            secondary_category_id: secondaryCategory.id,
          },
        });
      });

      return links;
    }
  });

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
          handle: string;
          secondary_categories_ids: string[];
        }[];
      };
    },
    { container }
  ) => {
    await productsCreatedHookHandler({
      products,
      additional_data,
      container,
    });

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

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

    await remoteLink.create([...remoteLinks, ...secondaryCategories]);

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

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

    await remoteLink.dismiss(
      productIds.map((productId) => ({
        [Modules.PRODUCT]: {
          product_id: productId,
        },
      }))
    );
  }
);
