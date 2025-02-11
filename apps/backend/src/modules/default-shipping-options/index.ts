import { Module } from '@medusajs/framework/utils'

import DefaultShippingOptionModuleService from './service'

export const DEFAULT_SHIPPING_OPTION_MODULE = 'default_shipping_option'

export default Module(DEFAULT_SHIPPING_OPTION_MODULE, {
  service: DefaultShippingOptionModuleService
})
