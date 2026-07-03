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
  MathBN,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { raw } from "@medusajs/framework/mikro-orm/postgresql"

import {
  CommissionCalculationContext,
  CommissionCalculationItemLine,
  CommissionCalculationShippingLine,
  CommissionLineDTO,
  CommissionRateType,
  CreateCommissionLineDTO,
} from "@mercurjs/types"

import {
  CommissionRate,
  CommissionRule,
  CommissionRateValue,
  CommissionLine,
} from "./models"

type CommissionRateEntity = InferEntityType<typeof CommissionRate>
type CommissionRuleEntity = InferEntityType<typeof CommissionRule>

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

  constructor({ commissionLineService, baseRepository }) {
    super(...arguments)
    this.commissionLineService_ = commissionLineService
    this.baseRepository_ = baseRepository
  }

  /**
   * Does a single rule match a product?
   */
  private ruleMatchesProduct(
    rule: CommissionRuleEntity,
    product?: CommissionCalculationItemLine["product"]
  ): boolean {
    if (!product) {
      return false
    }

    switch (rule.reference) {
      case "product":
        return product.id === rule.reference_id
      case "product_type":
        return product.type_id === rule.reference_id
      case "product_collection":
        return product.collection_id === rule.reference_id
      case "product_category":
        return (
          product.categories?.some((cat) => cat.id === rule.reference_id) ??
          false
        )
      case "seller":
        return product.seller?.id === rule.reference_id
      default:
        return false
    }
  }

  /**
   * A rate matches an item when **every** present dimension group (rules
   * grouped by `reference`) has at least one matching rule
   * (AND-across-dimension, OR-within-dimension). A rule-less rate is the
   * default and matches everything.
   */
  private rateMatchesItem(
    rate: CommissionRateEntity,
    item: CommissionCalculationItemLine
  ): boolean {
    const rules = (rate.rules ?? []) as CommissionRuleEntity[]
    if (rules.length === 0) {
      return true
    }

    const groups = new Map<string, CommissionRuleEntity[]>()
    for (const rule of rules) {
      const bucket = groups.get(rule.reference) ?? []
      bucket.push(rule)
      groups.set(rule.reference, bucket)
    }

    for (const groupRules of groups.values()) {
      if (!groupRules.some((rule) => this.ruleMatchesProduct(rule, item.product))) {
        return false
      }
    }

    return true
  }

  /**
   * Specificity = number of distinct dimension groups a rate scopes on.
   * More dimensions → higher specificity → wins the tie-break.
   */
  private rateSpecificity(rate: CommissionRateEntity): number {
    return new Set((rate.rules ?? []).map((rule) => rule.reference)).size
  }

  /**
   * Resolve the commission amount + line `rate` for a base amount.
   * Percentage uses the scalar `value`; Fixed reads the per-currency
   * `values` (falling back to the legacy single `value`).
   */
  private computeCommission(
    rate: CommissionRateEntity,
    baseAmount: CommissionCalculationItemLine["subtotal"],
    currencyCode: string
  ): { rate: number; amount: number } {
    if (rate.type === CommissionRateType.PERCENTAGE) {
      const amount = MathBN.div(MathBN.mult(baseAmount, rate.value), 100)
      return {
        rate: MathBN.convert(rate.value).toNumber(),
        amount: MathBN.convert(amount).toNumber(),
      }
    }

    const perCurrency = (rate.values ?? []).find(
      (value) => value.currency_code === currencyCode
    )
    const fixed = perCurrency ? perCurrency.amount : rate.value

    return {
      rate: MathBN.convert(fixed).toNumber(),
      amount: MathBN.convert(fixed).toNumber(),
    }
  }

  @InjectManager()
  async getCommissionLines(
    context: CommissionCalculationContext,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<CreateCommissionLineDTO[]> {
    const commissionLines: CreateCommissionLineDTO[] = []
    const { items = [], shipping_methods = [], currency_code } = context

    // Load all enabled rates with their rules + per-currency values,
    // oldest first (created_at ASC) so it is the deterministic tie-break.
    const commissionRates = (await this.listCommissionRates(
      { is_enabled: true },
      { relations: ["rules", "values"], order: { created_at: "ASC" } },
      sharedContext
    )) as CommissionRateEntity[]

    // Legacy single-currency rates only apply to their currency; rates
    // without a currency_code apply to any currency.
    const applicableRates = commissionRates.filter(
      (rate) => !rate.currency_code || rate.currency_code === currency_code
    )

    // The Global Commission: the is_default rate (fallback: any rule-less rate).
    const defaultRate =
      applicableRates.find((rate) => rate.is_default) ??
      applicableRates.find((rate) => (rate.rules ?? []).length === 0)

    // Item lines — match per item, most-specific rate wins.
    for (const item of items) {
      const candidates = applicableRates.filter((rate) =>
        this.rateMatchesItem(rate, item)
      )

      if (!candidates.length) {
        continue
      }

      candidates.sort((a, b) => {
        const specificityDiff = this.rateSpecificity(b) - this.rateSpecificity(a)
        if (specificityDiff !== 0) {
          return specificityDiff
        }
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })

      const matchedRate = candidates[0]

      let baseAmount = item.subtotal
      if (matchedRate.include_tax && item.tax_total) {
        baseAmount = MathBN.add(item.subtotal, item.tax_total)
      }

      const { rate, amount } = this.computeCommission(
        matchedRate,
        baseAmount,
        currency_code
      )

      commissionLines.push({
        item_id: item.id,
        shipping_method_id: null,
        code: matchedRate.code,
        rate,
        amount,
        commission_rate_id: matchedRate.id,
      })
    }

    // Shipping lines — one per shipping method, governed by the global
    // rate, only when its include_shipping is on (resolved independently
    // of the items the method ships).
    if (defaultRate?.include_shipping) {
      for (const shippingMethod of shipping_methods as CommissionCalculationShippingLine[]) {
        let baseAmount = shippingMethod.subtotal
        if (defaultRate.include_tax && shippingMethod.tax_total) {
          baseAmount = MathBN.add(
            shippingMethod.subtotal,
            shippingMethod.tax_total
          )
        }

        const { rate, amount } = this.computeCommission(
          defaultRate,
          baseAmount,
          currency_code
        )

        commissionLines.push({
          item_id: null,
          shipping_method_id: shippingMethod.id,
          code: defaultRate.code,
          rate,
          amount,
          commission_rate_id: defaultRate.id,
          description: "Shipping Commission",
        })
      }
    }

    return commissionLines
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
