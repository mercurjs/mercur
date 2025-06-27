import { model } from '@medusajs/framework/utils'

import { Seller } from './seller'

export const SellerOnboarding = model.define('seller_onboarding', {
  id: model.id({ prefix: 'sel_onb' }).primaryKey(),
  store_information: model.boolean().default(false),
  stripe_connection: model.boolean().default(false),
  locations_shipping: model.boolean().default(false),
  products: model.boolean().default(false),
  seller: model.belongsTo(() => Seller, { mappedBy: 'onboarding' })
})
