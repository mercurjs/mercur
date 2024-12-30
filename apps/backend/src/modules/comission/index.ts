import { Module } from '@medusajs/framework/utils'

import ComissionModuleService from './service'

export const COMISSION_MODULE = 'comission'

export default Module(COMISSION_MODULE, {
  service: ComissionModuleService
})
