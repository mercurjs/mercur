import { Module } from '@medusajs/framework/utils'

import PayoutsModuleService from './service'

export const PAYOUTS_MODULE = 'payouts'

export default Module(PAYOUTS_MODULE, {
  service: PayoutsModuleService
})
