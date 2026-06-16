import {
  Context,
  DAL,
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

import {
  CommissionCalculationContext,
  CommissionCalculationItemLine,
  CommissionCalculationShippingLine,
  CommissionLineDTO,
  CommissionRateType,
  CreateCommissionLineDTO,
  UpdateCommissionLineDTO,
} from "@mercurjs/types"

import {
  CommissionRate,
  CommissionRule,
  CommissionRateValue,
  CommissionLine,
} from "./models"

type CommissionRateEntity = InferEntityType<typeof CommissionRate>
type CommissionRuleEntity = InferEntityType<typeof CommissionRule>

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

  @InjectManager()
  async deleteCommissionLinesForOrderItems(
    { item_ids = [], shipping_method_ids = [] }: {
      item_ids?: string[]
      shipping_method_ids?: string[]
    },
    @MedusaContext() sharedContext: Context = {}
  ): Promise<void> {
    const filters: Record<string, unknown>[] = []
    if (item_ids.length) {
      filters.push({ item_id: item_ids })
    }
    if (shipping_method_ids.length) {
      filters.push({ shipping_method_id: shipping_method_ids })
    }

    if (!filters.length) {
      return
    }

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

  @InjectManager()
  async sumCommissionForOrderItems(
    { item_ids = [], shipping_method_ids = [] }: {
      item_ids?: string[]
      shipping_method_ids?: string[]
    },
    @MedusaContext() sharedContext: Context = {}
  ): Promise<number> {
    const filters: Record<string, unknown>[] = []
    if (item_ids.length) {
      filters.push({ item_id: item_ids })
    }
    if (shipping_method_ids.length) {
      filters.push({ shipping_method_id: shipping_method_ids })
    }

    if (!filters.length) {
      return 0
    }

    const lines = await this.commissionLineService_.list(
      { $or: filters },
      {},
      sharedContext
    )

    return lines.reduce(
      (acc, line) => MathBN.convert(MathBN.add(acc, line.amount)).toNumber(),
      0
    )
  }

  @InjectManager()
  @EmitEvents()
  async upsertCommissionLines(
    commissionLines: (CreateCommissionLineDTO | UpdateCommissionLineDTO)[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<CommissionLineDTO[]> {
    const result = await this.commissionLineService_.upsert(
      commissionLines,
      sharedContext
    )

    return await this.baseRepository_.serialize<CommissionLineDTO[]>(result)
  }
}

export default CommissionModuleService
