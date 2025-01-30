import { Module } from '@medusajs/framework/utils'

import ConfigurationModuleService from './service'

export const CONFIGURATION_MODULE = 'configuration'

export default Module(CONFIGURATION_MODULE, {
  service: ConfigurationModuleService
})
