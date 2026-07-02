import {
  IEventBusModuleService,
  InternalModuleDeclaration,
  Logger,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  SearchDoc,
  SearchQueryBase,
  SearchResults,
} from "@mercurjs/types"

import { SEARCH_REINDEX_EVENT } from "../lib/reindex"
import SearchProviderService from "./search-provider-service"

type InjectedDependencies = {
  searchProviderService: SearchProviderService
  [ContainerRegistrationKeys.LOGGER]: Logger
  [Modules.EVENT_BUS]: IEventBusModuleService
}

export default class SearchModuleService {
  protected readonly searchProviderService_: SearchProviderService
  protected readonly logger_: Logger
  protected readonly eventBus_: IEventBusModuleService
  #isWorkerMode = false

  constructor(
    container: InjectedDependencies,
    moduleDeclaration: InternalModuleDeclaration
  ) {
    this.searchProviderService_ = container.searchProviderService
    this.logger_ = container[ContainerRegistrationKeys.LOGGER]
    this.eventBus_ = container[Modules.EVENT_BUS]
    this.#isWorkerMode = moduleDeclaration.worker_mode !== "server"
  }

  __hooks = {
    onApplicationStart(this: SearchModuleService) {
      return this.onApplicationStart_()
    },
  }

  // The module service is constructed with the awilix cradle, not the app
  // container, so it can't run the cross-module reindex itself. It emits an
  // event instead; the `search-reindex` subscriber handles it with the real
  // request-scoped container.
  protected async onApplicationStart_(): Promise<void> {
    if (!this.#isWorkerMode) {
      return
    }

    try {
      await this.eventBus_.emit({ name: SEARCH_REINDEX_EVENT, data: {} })
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
