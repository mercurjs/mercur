import { model } from '@medusajs/framework/utils'

export const ProductVariantImage = model.define('product_variant_image', {
  id: model.id({ prefix: 'prcp' }).primaryKey(),
  url: model.text(),
  rank: model.number().default(0)
})
