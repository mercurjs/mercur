import { IndexType } from './index-types'

export const ALGOLIA_MODULE = 'algolia'

export type AlgoliaSearchResult<T> = {
  hits: T[]
  nbHits: number
  page: number
  nbPages: number
  hitsPerPage: number
  facets?: Record<string, Record<string, number>>
  facets_stats?: Record<string, { min: number; max: number; avg: number; sum: number }>
  processingTimeMS: number
  query: string
}

export interface IAlgoliaModuleService {
  search<T = Record<string, unknown>>(
    indexName: IndexType,
    params: Record<string, unknown>
  ): Promise<AlgoliaSearchResult<T>>
}

