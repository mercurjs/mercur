import { model } from '@medusajs/framework/utils'

export const DefaultShippingOption = model.define('default_shipping_option', {
  id: model.id().primaryKey(),
  external_provider: model.text(),
  external_provider_id: model.text(),
  external_provider_option_name: model.text(),
  is_enabled: model.boolean().default(false)
})
