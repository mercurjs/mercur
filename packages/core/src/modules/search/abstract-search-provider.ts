import {
  SearchDoc,
  SearchProvider,
  SearchQueryBase,
  SearchResults,
} from "@mercurjs/types"

export class AbstractSearchProvider implements SearchProvider {
  static identifier: string

  static validateOptions(_options: Record<string, unknown>): void | never {}

  getIdentifier(): string {
    return (this.constructor as typeof AbstractSearchProvider).identifier
  }

  async index(_docs: SearchDoc[]): Promise<void> {
    throw new Error("index must be overridden by the search provider")
  }

  async remove(_ids: string[]): Promise<void> {
    throw new Error("remove must be overridden by the search provider")
  }

  async search(_query: SearchQueryBase): Promise<SearchResults> {
    throw new Error("search must be overridden by the search provider")
  }
}
