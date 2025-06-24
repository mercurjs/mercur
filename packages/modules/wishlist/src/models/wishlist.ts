import { model } from '@medusajs/framework/utils'

export const Wishlist = model.define('wishlist', {
  id: model.id({ prefix: 'wish' }).primaryKey(),
  reference: model.enum(['product'])
})
