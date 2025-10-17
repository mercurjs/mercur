import { Module } from '@medusajs/framework/utils'

import ProductVariantImageModuleService from './service'

export const PRODUCT_VARIANT_IMAGE = 'product_variant_image'

export default Module(PRODUCT_VARIANT_IMAGE, {
  service: ProductVariantImageModuleService
})
