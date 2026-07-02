import {
  SearchDoc,
  SearchQueryBase,
  SearchResults,
} from "@mercurjs/types"

import SearchProviderService from "./search-provider-service"

type InjectedDependencies = {
  searchProviderService: SearchProviderService
}

/**
 * The module service subscribers and routes resolve via
 * `container.resolve(MercurModules.SEARCH)`. It owns no data models — it simply
 * delegates the three verbs to the single active provider. Which provider is
 * active is opaque here.
 */
export default class SearchModuleService {
  protected readonly searchProviderService_: SearchProviderService

  constructor({ searchProviderService }: InjectedDependencies) {
    this.searchProviderService_ = searchProviderService
  }

  getProviderIdentifier(): string {
    return this.searchProviderService_.getIdentifier()
  }

  async index(docs: SearchDoc[]): Promise<void> {
    return await this.searchProviderService_.index(docs)
  }

  async remove(ids: string[]): Promise<void> {
    return await this.searchProviderService_.remove(ids)
  }

  async search(query: SearchQueryBase): Promise<SearchResults> {
    return await this.searchProviderService_.search(query)
  }
}
