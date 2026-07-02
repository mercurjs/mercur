import {
  SearchDoc,
  SearchQueryBase,
  SearchResults,
} from "@mercurjs/types"

import SearchProviderService from "./search-provider-service"

type InjectedDependencies = {
  searchProviderService: SearchProviderService
}

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
