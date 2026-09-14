import {
  InferEntityType,
  ModulesSdkTypes,
} from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import {
  CommissionCalculationContext,
  CommissionCalculationItemLine,
  CommissionCalculationShippingLine,
  CommissionRateType,
  CreateCommissionLineDTO,
  ICommissionProvider,
} from "@mercurjs/types"

import { CommissionRate, CommissionRule } from "../models"

type CommissionRateEntity = InferEntityType<typeof CommissionRate>
type CommissionRuleEntity = InferEntityType<typeof CommissionRule>

type InjectedDependencies = {
  commissionRateService: ModulesSdkTypes.IMedusaInternalService<CommissionRateEntity>
}

/**
 * The built-in provider: resolves commission lines from the module's own
 * rates and rules. Registered unconditionally and used when no other
 * provider is configured as default.
 */
export class SystemCommissionProvider implements ICommissionProvider {
  static identifier = "system"

  protected readonly commissionRateService_: InjectedDependencies["commissionRateService"]

  constructor({ commissionRateService }: InjectedDependencies) {
    this.commissionRateService_ = commissionRateService
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

  async getCommissionLines(
    context: CommissionCalculationContext
  ): Promise<CreateCommissionLineDTO[]> {
    const commissionLines: CreateCommissionLineDTO[] = []
    const { items = [], shipping_methods = [], currency_code } = context

    // Load all enabled rates with their rules + per-currency values,
    // oldest first (created_at ASC) so it is the deterministic tie-break.
    const commissionRates = (await this.commissionRateService_.list(
      { is_enabled: true },
      { relations: ["rules", "values"], order: { created_at: "ASC" } }
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
        provider_id: SystemCommissionProvider.identifier,
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
          provider_id: SystemCommissionProvider.identifier,
          description: "Shipping Commission",
        })
      }
    }

    return commissionLines
  }

}
