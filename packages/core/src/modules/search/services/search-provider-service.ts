import { MedusaError } from "@medusajs/framework/utils"
import {
  SearchDoc,
  SearchProvider,
  SearchQueryBase,
  SearchResults,
} from "@mercurjs/types"

export const SearchProviderIdentifierRegistrationName =
  "search_providers_identifier"

export const SearchProviderRegistrationPrefix = "search_"

type InjectedDependencies = {
  [key: `${typeof SearchProviderRegistrationPrefix}${string}`]: SearchProvider
}

/**
 * Resolves the single registered search provider (asserting exactly one, like
 * `FileProviderService`) and forwards the three provider verbs to it.
 */
export default class SearchProviderService {
  protected readonly searchProvider_: SearchProvider

  constructor(container: InjectedDependencies) {
    const searchProviderKeys = Object.keys(container).filter((k) =>
      k.startsWith(SearchProviderRegistrationPrefix)
    )

    if (searchProviderKeys.length !== 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Search module should be initialized with exactly one provider`
      )
    }

    this.searchProvider_ = container[
      searchProviderKeys[0] as keyof InjectedDependencies
    ] as SearchProvider
  }

  getIdentifier(): string {
    const provider = this.searchProvider_ as SearchProvider & {
      getIdentifier?: () => string
    }
    return provider.getIdentifier?.() ?? "unknown"
  }

  async index(docs: SearchDoc[]): Promise<void> {
    return await this.searchProvider_.index(docs)
  }

  async remove(ids: string[]): Promise<void> {
    return await this.searchProvider_.remove(ids)
  }

  async search(query: SearchQueryBase): Promise<SearchResults> {
    return await this.searchProvider_.search(query)
  }
}
