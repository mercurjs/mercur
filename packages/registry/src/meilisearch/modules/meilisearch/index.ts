import { Module } from '@medusajs/framework/utils'

import MeilisearchModuleService from './service'

export const MEILISEARCH_MODULE = 'meilisearch'
export { MeilisearchModuleService }

export default Module(MEILISEARCH_MODULE, {
  service: MeilisearchModuleService,
})
