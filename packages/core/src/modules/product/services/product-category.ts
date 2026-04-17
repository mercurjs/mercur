import {
  Context,
  DAL,
  FindConfig,
  InferEntityType,
} from "@medusajs/framework/types"
import {
  FreeTextSearchFilterKeyPrefix,
  InjectManager,
  InjectTransactionManager,
  isDefined,
  MedusaContext,
  MedusaError,
  MedusaInternalService,
  MedusaService,
  ModulesSdkUtils,
} from "@medusajs/framework/utils"
import { ProductCategory } from "../models"
import { ProductCategoryRepository } from "../repositories/product-category"

type UpdateCategoryInput = {
  id: string
  name?: string
  description?: string
  handle?: string
  is_active?: boolean
  is_internal?: boolean
  is_restricted?: boolean
  rank?: number
  parent_category_id?: string | null
  metadata?: Record<string, unknown> | null
}

type InjectedDependencies = {
  productCategoryRepository: DAL.TreeRepositoryService
  productModuleService: ReturnType<typeof MedusaService>
}

export default class ProductCategoryService extends MedusaInternalService<
  InjectedDependencies,
  typeof ProductCategory
>(ProductCategory) {
  protected readonly productCategoryRepository_: DAL.TreeRepositoryService
  protected readonly container: InjectedDependencies

  constructor(container: InjectedDependencies) {
    // @ts-expect-error
    super(...arguments)
    this.container = container
    this.productCategoryRepository_ = container.productCategoryRepository
  }

  @InjectManager("productCategoryRepository_")
  // @ts-expect-error
  async retrieve(
    productCategoryId: string,
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof ProductCategory>> {
    if (!isDefined(productCategoryId)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `"productCategoryId" must be defined`
      )
    }

    const queryOptions = ModulesSdkUtils.buildQuery(
      {
        id: productCategoryId,
      },
      config
    )

    const transformOptions = {
      includeDescendantsTree: true,
    }

    const productCategories = await this.productCategoryRepository_.find(
      queryOptions,
      transformOptions,
      sharedContext
    )

    if (!productCategories?.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ProductCategory with id: ${productCategoryId} was not found`
      )
    }

    return productCategories[0]
  }

  @InjectManager("productCategoryRepository_")
  async list(
    filters: Record<string, any> = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof ProductCategory>[]> {
    const transformOptions = {
      includeDescendantsTree: filters?.include_descendants_tree || false,
      includeAncestorsTree: filters?.include_ancestors_tree || false,
    }
    delete filters.include_descendants_tree
    delete filters.include_ancestors_tree

    if (isDefined(filters?.q)) {
      config.filters ??= {}
      config.filters[FreeTextSearchFilterKeyPrefix + ProductCategory.name] = {
        value: filters.q,
        fromEntity: ProductCategory.name,
      }

      delete filters.q
    }

    const queryOptions = ModulesSdkUtils.buildQuery(filters, config)
    queryOptions.where ??= {}

    return await this.productCategoryRepository_.find(
      queryOptions,
      transformOptions,
      sharedContext
    )
  }

  @InjectManager("productCategoryRepository_")
  async listAndCount(
    filters: Record<string, any> = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<[InferEntityType<typeof ProductCategory>[], number]> {
    const transformOptions = {
      includeDescendantsTree: filters?.include_descendants_tree || false,
      includeAncestorsTree: filters?.include_ancestors_tree || false,
    }
    delete filters.include_descendants_tree
    delete filters.include_ancestors_tree

    if (isDefined(filters?.q)) {
      config.filters ??= {}
      config.filters[FreeTextSearchFilterKeyPrefix + ProductCategory.name] = {
        value: filters.q,
        fromEntity: ProductCategory.name,
      }

      delete filters.q
    }

    const queryOptions = ModulesSdkUtils.buildQuery(filters, config)
    queryOptions.where ??= {}

    return await this.productCategoryRepository_.findAndCount(
      queryOptions,
      transformOptions,
      sharedContext
    )
  }

  @InjectTransactionManager("productCategoryRepository_")
  async create(
    data: any[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof ProductCategory>[]> {
    return await (
      this.productCategoryRepository_ as unknown as ProductCategoryRepository
    ).create(data, sharedContext)
  }

  @InjectTransactionManager("productCategoryRepository_")
  // @ts-expect-error
  async update(
    data: UpdateCategoryInput[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<InferEntityType<typeof ProductCategory>[]> {
    return await (
      this.productCategoryRepository_ as unknown as ProductCategoryRepository
    ).update(data, sharedContext)
  }

  @InjectTransactionManager("productCategoryRepository_")
  // @ts-expect-error
  async delete(
    ids: string[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<string[]> {
    return await this.productCategoryRepository_.delete(ids, sharedContext)
  }

  @InjectTransactionManager("productCategoryRepository_")
  // @ts-expect-error
  async softDelete(
    ids: string[],
    @MedusaContext() sharedContext?: Context
  ): Promise<Record<string, string[]> | void> {
    return (await (
      this.productCategoryRepository_ as unknown as ProductCategoryRepository
    ).softDelete(ids, sharedContext)) as any
  }

  @InjectTransactionManager("productCategoryRepository_")
  // @ts-expect-error
  async restore(
    ids: string[],
    @MedusaContext() sharedContext?: Context
  ): Promise<Record<string, string[]> | void> {
    return (await (
      this.productCategoryRepository_ as unknown as ProductCategoryRepository
    ).restore(ids, sharedContext)) as any
  }
}
