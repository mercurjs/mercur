import { Module } from '@medusajs/framework/utils'

import SellerModuleService from './service'

export const SELLER_MODULE = 'seller'

export default Module(SELLER_MODULE, { service: SellerModuleService })
