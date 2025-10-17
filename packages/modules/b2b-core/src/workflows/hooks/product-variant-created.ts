import { MedusaContainer } from "@medusajs/framework";
import { LinkDefinition } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows";

import { SELLER_MODULE } from "../../modules/seller";
import { PRODUCT_VARIANT_IMAGE } from "../../modules/product-variant-image";
import ProductVariantImageModuleService from "../../modules/product-variant-image/service";

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

const createProductVariantImages = async (
  variantId: string,
  images: string[],
  container: MedusaContainer
) => {
  const productVariantImageService: ProductVariantImageModuleService =
    container.resolve(PRODUCT_VARIANT_IMAGE);
  const linkService = container.resolve(ContainerRegistrationKeys.LINK);

  const links: LinkDefinition[] = [];

  const productVariantImages =
    await productVariantImageService.createProductVariantImages(
      images.map((image, index) => ({
        url: image,
        variant_id: variantId,
        rank: index,
      }))
    );

  for (const image of productVariantImages) {
    links.push({
      [Modules.PRODUCT]: {
        product_variant_id: variantId,
      },
      [PRODUCT_VARIANT_IMAGE]: {
        product_variant_image_id: image.id,
      },
    });
  }

  await linkService.create(links);

  return productVariantImages;
};

createProductVariantsWorkflow.hooks.productVariantsCreated(
  async ({ product_variants, additional_data }, { container }) => {
    if (additional_data?.images) {
      createProductVariantImages(
        product_variants[0].id,
        additional_data.images as string[],
        container
      );
    }

    if (!additional_data?.seller_id) {
      return;
    }

    const remoteLinks: LinkDefinition[] = [];

    for (const variant of product_variants) {
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
    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);
    await remoteLink.create(remoteLinks);
  }
);
