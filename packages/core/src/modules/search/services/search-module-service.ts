import {
  InternalModuleDeclaration,
  Logger,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  SearchDoc,
  SearchQueryBase,
  SearchResults,
} from "@mercurjs/types"

import { reindexAll } from "../lib/reindex"
import SearchProviderService from "./search-provider-service"

type InjectedDependencies = {
  searchProviderService: SearchProviderService
  [ContainerRegistrationKeys.LOGGER]: Logger
}

export default class SearchModuleService {
  protected readonly container_: MedusaContainer
  protected readonly searchProviderService_: SearchProviderService
  protected readonly logger_: Logger
  #isWorkerMode = false

  constructor(
    container: InjectedDependencies & MedusaContainer,
    moduleDeclaration: InternalModuleDeclaration
  ) {
    this.container_ = container
    this.searchProviderService_ = container.searchProviderService
    this.logger_ = container[ContainerRegistrationKeys.LOGGER]
    this.#isWorkerMode = moduleDeclaration.worker_mode !== "server"
  }

  __hooks = {
    onApplicationStart(this: SearchModuleService) {
      return this.onApplicationStart_()
    },
  }

  protected async onApplicationStart_(): Promise<void> {
    if (!this.#isWorkerMode) {
      return
    }

    try {
      await reindexAll(this.container_, this)
    } catch (e) {
      this.logger_.error(e)
    }
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
