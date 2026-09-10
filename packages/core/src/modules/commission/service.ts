import {
  Context,
  DAL,
  FindConfig,
  InferEntityType,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import {
  EmitEvents,
  InjectManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { raw } from "@medusajs/framework/mikro-orm/postgresql"

import {
  CommissionCalculationContext,
  CommissionLineDTO,
  CreateCommissionLineDTO,
} from "@mercurjs/types"

import {
  CommissionRate,
  CommissionRule,
  CommissionRateValue,
  CommissionLine,
} from "./models"
import CommissionProviderService, {
  CommissionDefaultProvider,
} from "./services/provider-service"

type InjectedDependencies = {
  commissionLineService: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof CommissionLine>
  >
  commissionProviderService: CommissionProviderService
  baseRepository: DAL.RepositoryService
  [CommissionDefaultProvider]: string
}

/** Build a unique, URL-safe code from a rate name. */
const generateCommissionCode = (name: string): string => {
  const slug = (name ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${slug || "commission-rule"}-${suffix}`
}

class CommissionModuleService extends MedusaService({
  CommissionRate,
  CommissionRule,
  CommissionRateValue,
  CommissionLine,
}) {
  protected commissionLineService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof CommissionLine>
  >
  protected baseRepository_: DAL.RepositoryService
  protected commissionProviderService_: CommissionProviderService
  protected defaultProviderId_: string

  constructor(container: InjectedDependencies) {
    super(...arguments)
    this.commissionLineService_ = container.commissionLineService
    this.baseRepository_ = container.baseRepository
    this.commissionProviderService_ = container.commissionProviderService
    this.defaultProviderId_ = container[CommissionDefaultProvider]
  }

  async getCommissionLines(
    context: CommissionCalculationContext
  ): Promise<CreateCommissionLineDTO[]> {
    const provider = this.commissionProviderService_.retrieveProvider(
      this.defaultProviderId_
    )
    const lines = await provider.getCommissionLines(context)

    return lines.map((line) => ({
      ...line,
      provider_id: line.provider_id ?? this.defaultProviderId_,
    }))
  }

  /**
   * Overrides the auto-generated upsert with idempotent **replace**
   * semantics keyed on the line's anchor (item_id / shipping_method_id):
   * delete any existing lines for the incoming anchors, then insert the new
   * set, in a single transaction. The computed lines carry no `id`, so a
   * plain primary-key upsert would duplicate them on every refresh; deleting
   * by anchor first makes re-running the refresh idempotent.
   */
  @InjectManager()
  @EmitEvents()
  async upsertCommissionLines(
    commissionLines: CreateCommissionLineDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<CommissionLineDTO[]> {
    const itemIds = commissionLines
      .map((line) => line.item_id)
      .filter((id): id is string => !!id)
    const shippingMethodIds = commissionLines
      .map((line) => line.shipping_method_id)
      .filter((id): id is string => !!id)

    const filters: Record<string, unknown>[] = []
    if (itemIds.length) {
      filters.push({ item_id: itemIds })
    }
    if (shippingMethodIds.length) {
      filters.push({ shipping_method_id: shippingMethodIds })
    }

    if (filters.length) {
      const existing = await this.commissionLineService_.list(
        { $or: filters },
        {},
        sharedContext
      )
      if (existing.length) {
        await this.commissionLineService_.delete(
          existing.map((line) => line.id),
          sharedContext
        )
      }
    }

    if (!commissionLines.length) {
      return []
    }

    const result = await this.commissionLineService_.upsert(
      commissionLines,
      sharedContext
    )

    return await this.baseRepository_.serialize<CommissionLineDTO[]>(result)
  }

  /**
   * Build a DB-side predicate for the virtual `scope_type` filter (rule
   * scope: "store", "product_type", "category", "store_product_type",
   * "store_category"). Scope type is derived from the set of rule
   * `reference`s rather than stored, so each option maps to an
   * EXISTS / NOT EXISTS combination on `commission_rule` that mirrors the
   * admin-side `deriveScopeType`. Multiple selected scopes are OR-ed.
   */
  private buildScopeTypeWhere_(
    scopeTypes: string[]
  ): ((alias: string) => string) | null {
    const valid = scopeTypes.filter((scope) =>
      [
        "store",
        "product_type",
        "category",
        "store_product_type",
        "store_category",
      ].includes(scope)
    )

    if (!valid.length) {
      return null
    }

    return (alias: string) => {
      const has = (reference: string) =>
        `EXISTS (SELECT 1 FROM commission_rule cr WHERE cr.commission_rate_id = ${alias}.id AND cr.deleted_at IS NULL AND cr.reference = '${reference}')`
      const missing = (reference: string) => `NOT ${has(reference)}`

      const conditionFor = (scope: string): string => {
        switch (scope) {
          case "store":
            return `${has("seller")} AND ${missing("product_type")} AND ${missing("product_category")}`
          case "product_type":
            return `${has("product_type")} AND ${missing("seller")} AND ${missing("product_category")}`
          case "category":
            return `${has("product_category")} AND ${missing("seller")} AND ${missing("product_type")}`
          case "store_product_type":
            return `${has("seller")} AND ${has("product_type")}`
          case "store_category":
            return `${has("seller")} AND ${has("product_category")} AND ${missing("product_type")}`
          default:
            return "1 = 0"
        }
      }

      return `(${valid.map((scope) => `(${conditionFor(scope)})`).join(" OR ")})`
    }
  }

  /**
   * Strip the virtual `scope_type` key and rewrite it into a `raw()`
   * correlated-subquery predicate so the filtering happens in the database,
   * not in the route handler.
   */
  private applyScopeTypeFilter_(
    filters: Record<string, unknown> = {}
  ): Record<string, unknown> {
    const { scope_type, ...rest } = filters ?? {}

    if (scope_type === undefined || scope_type === null) {
      return { ...rest }
    }

    const scopeTypes = (
      Array.isArray(scope_type) ? scope_type : [scope_type]
    )
      .flatMap((value) => String(value).split(","))
      .map((value) => value.trim())
      .filter(Boolean)
    const predicate = this.buildScopeTypeWhere_(scopeTypes)
    const where: Record<string, unknown> = { ...rest }

    // No recognised scope type → match nothing rather than ignore the filter.
    where[raw((alias: string) => (predicate ? predicate(alias) : "(1 = 0)"))] =
      true

    return where
  }

  /**
   * Auto-generate a unique `code` from the rate `name` when one is not
   * provided, before delegating to the generated create. Accepts a single
   * payload or an array and preserves the caller's shape.
   */
  @InjectManager()
  // @ts-ignore
  async createCommissionRates(
    data: any,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<any> {
    const input = Array.isArray(data) ? data : [data]
    const withCode = input.map((rate) => ({
      ...rate,
      code: rate.code ?? generateCommissionCode(rate.name),
    }))

    const result = await super.createCommissionRates(withCode, sharedContext)

    return Array.isArray(data) ? result : result[0]
  }

  @InjectManager()
  // @ts-ignore
  async listCommissionRates(
    filters: any = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    return await super.listCommissionRates(
      this.applyScopeTypeFilter_(filters),
      config,
      sharedContext
    )
  }

  @InjectManager()
  // @ts-ignore
  async listAndCountCommissionRates(
    filters: any = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    return await super.listAndCountCommissionRates(
      this.applyScopeTypeFilter_(filters),
      config,
      sharedContext
    )
  }
}

export default CommissionModuleService
