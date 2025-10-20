import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";

import { AlgoliaEvents } from "@mercurjs/framework";

import { MedusaContainer } from "@medusajs/framework";
import { LinkDefinition } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import { PRODUCT_VARIANT_IMAGE } from "../../modules/product-variant-image";
import ProductVariantImageModuleService from "../../modules/product-variant-image/service";
import { getProductVariantImagesByVariantId } from "../../modules/product-variant-image/utils";

const updateProductVariantImages = async (
  variantId: string,
  images: { url: string; id: string }[],
  container: MedusaContainer
) => {
  const productVariantImageService: ProductVariantImageModuleService =
    container.resolve(PRODUCT_VARIANT_IMAGE);
  const linkService = container.resolve(ContainerRegistrationKeys.LINK);
  const links: LinkDefinition[] = [];

  const data = await getProductVariantImagesByVariantId(container, variantId);

  await deleteProductVariantImages(variantId, images, data, container);

  const newImages = images.filter((image) => !image.id);

  const productVariantImages =
    await productVariantImageService.createProductVariantImages(
      newImages.map((image) => ({
        url: image.url,
        variant_id: variantId,
      }))
    );

  for (const productVariantImage of productVariantImages) {
    const foundImage = images.find(
      (image) => image.url === productVariantImage.url
    );

    if (foundImage) {
      foundImage.id = productVariantImage.id;
    }

    links.push({
      [Modules.PRODUCT]: {
        product_variant_id: variantId,
      },
      [PRODUCT_VARIANT_IMAGE]: {
        product_variant_image_id: productVariantImage.id,
      },
    });
  }

  await linkService.create(links);

  await rerankProductVariantImages(
    images.map((image) => image.id),
    container
  );
};

const rerankProductVariantImages = async (
  images: string[],
  container: MedusaContainer
) => {
  const productVariantImageService: ProductVariantImageModuleService =
    container.resolve(PRODUCT_VARIANT_IMAGE);

  images.forEach(async (image, index) => {
    await productVariantImageService.updateProductVariantImages([
      {
        id: image,
        rank: index,
      },
    ]);
  });
};

const deleteProductVariantImages = async (
  variantId: string,
  images: { id: string }[],
  existingImages: { id: string }[],
  container: MedusaContainer
) => {
  const productVariantImageService: ProductVariantImageModuleService =
    container.resolve(PRODUCT_VARIANT_IMAGE);
  const linkService = container.resolve(ContainerRegistrationKeys.LINK);

  const imagesToDelete = existingImages.filter(
    (existingImage) => !images.find((image) => image.id === existingImage.id)
  );

  await productVariantImageService.deleteProductVariantImages(
    imagesToDelete.map((image) => image.id)
  );
  const linksToDelete: LinkDefinition[] = [];

  for (const image of imagesToDelete) {
    linksToDelete.push({
      [Modules.PRODUCT]: {
        product_variant_id: variantId,
      },
      [PRODUCT_VARIANT_IMAGE]: {
        product_variant_image_id: image.id,
      },
    });
  }

  await linkService.dismiss(linksToDelete);
};

updateProductVariantsWorkflow.hooks.productVariantsUpdated(
  async ({ product_variants, additional_data }, { container }) => {
    const priceListChanges = product_variants.filter((variant) => {
      if (variant.price_set) {
        return true;
      }
    });

    if (priceListChanges) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY);
      const variantIds = priceListChanges.map((variant) => variant.id);

      const { data: lineItems } = await query.graph({
        entity: "line_items",
        fields: ["cart_id", "id"],
        filters: {
          variant_id: variantIds,
        },
      });

      await container.resolve(Modules.EVENT_BUS).emit({
        name: "cart.custom.items.refresh",
        data: {
          cart_ids: lineItems,
        },
      });
    }

    for (const variant of product_variants) {
      if (additional_data?.images) {
        updateProductVariantImages(
          variant.id,
          additional_data.images as { url: string; id: string }[],
          container
        );
      }
    }

    await container.resolve(Modules.EVENT_BUS).emit({
      name: AlgoliaEvents.PRODUCTS_CHANGED,
      data: {
        ids: product_variants
          .map((v) => v.product_id)
          .filter((v) => v && v !== null),
      },
    });
  }
);
