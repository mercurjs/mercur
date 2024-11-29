import { Module } from '@medusajs/framework/utils'

import MarketplaceModuleService from './service'

export const MARKETPLACE_MODULE = 'marketplace'

export default Module(MARKETPLACE_MODULE, {
  service: MarketplaceModuleService
})
