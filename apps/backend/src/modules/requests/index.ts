import { Module } from '@medusajs/framework/utils'

import RequestsModuleService from './service'

export const REQUESTS_MODULE = 'requests'

export default Module(REQUESTS_MODULE, {
  service: RequestsModuleService
})
