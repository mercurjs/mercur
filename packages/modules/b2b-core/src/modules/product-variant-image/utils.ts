import { MedusaContainer } from '@medusajs/framework'

export async function getProductVariantImagesByVariantId(
  container: MedusaContainer,
  variantId: string
) {
  const knex = container.resolve('__pg_connection__')

  const productVariantImages = await knex('product_variant_image')
    .select('product_variant_image.id')
    .join(
      'product_variant_image_image',
      'product_variant_image.id',
      'product_variant_image_image.product_variant_image_id'
    )
    .where('product_variant_image_image.product_variant_id', variantId)

  return productVariantImages
}
