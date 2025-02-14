import { Module } from '@medusajs/framework/utils'

import CommissionModuleService from './service'

export const COMMISSION_MODULE = 'commission'

export default Module(COMMISSION_MODULE, {
  service: CommissionModuleService
})
