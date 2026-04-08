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
  ServiceFeeCalculationContext,
  ServiceFeeLineDTO,
  ServiceFeeDTO,
  ServiceFeeStatus,
  ServiceFeeChargingLevel,
  CreateServiceFeeLineDTO,
  UpdateServiceFeeLineDTO,
  ServiceFeeChangeLogDTO,
} from "@mercurjs/types"
import {
  ServiceFee,
  ServiceFeeRule,
  ServiceFeeLine,
  ServiceFeeChangeLog,
} from "./models"

class ServiceFeeModuleService extends MedusaService({
  ServiceFee,
  ServiceFeeRule,
  ServiceFeeLine,
  ServiceFeeChangeLog,
}) {
  protected serviceFeeLineService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof ServiceFeeLine>
  >
  protected serviceFeeChangeLogService_: ModulesSdkTypes.IMedusaInternalService<
    InferEntityType<typeof ServiceFeeChangeLog>
  >
  protected baseRepository_: DAL.RepositoryService

  constructor({
    serviceFeeLineService,
    serviceFeeChangeLogService,
    baseRepository,
  }: {
    serviceFeeLineService: ModulesSdkTypes.IMedusaInternalService<
      InferEntityType<typeof ServiceFeeLine>
    >
    serviceFeeChangeLogService: ModulesSdkTypes.IMedusaInternalService<
      InferEntityType<typeof ServiceFeeChangeLog>
    >
    baseRepository: DAL.RepositoryService
  }) {
    super(...arguments)
    this.serviceFeeLineService_ = serviceFeeLineService
    this.serviceFeeChangeLogService_ = serviceFeeChangeLogService
    this.baseRepository_ = baseRepository
  }

  @InjectManager()
  async getServiceFeeLines(
    context: ServiceFeeCalculationContext,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<CreateServiceFeeLineDTO[]> {
    const serviceFees = await this.listServiceFees(
      {
        is_enabled: true,
        status: ServiceFeeStatus.ACTIVE,
      },
      {
        relations: ["rules"],
        order: { priority: "DESC" },
      },
      sharedContext
    )

    // Filter by date range (start_date/end_date enforcement)
    const now = new Date()
    const activeFees = serviceFees.filter((fee) => {
      if (fee.start_date && new Date(fee.start_date) > now) return false
      if (fee.end_date && new Date(fee.end_date) < now) return false
      return true
    })

    const feeLines: CreateServiceFeeLineDTO[] = []

    for (const item of context.items ?? []) {
      for (const fee of activeFees) {
        const isApplicable = this.isFeeApplicableToItem(fee, item)
        if (!isApplicable) continue

        const baseAmount = MathBN.convert(item.subtotal)
        const taxAmount = item.tax_total
          ? MathBN.convert(item.tax_total)
          : MathBN.convert(0)
        const totalBase = fee.include_tax
          ? MathBN.add(baseAmount, taxAmount)
          : baseAmount

        let amount =
          fee.type === "percentage"
            ? MathBN.div(MathBN.mult(totalBase, fee.value), 100)
            : MathBN.convert(fee.value)

        if (fee.min_amount != null && MathBN.lt(amount, fee.min_amount)) {
          amount = MathBN.convert(fee.min_amount)
        }
        if (fee.max_amount != null && MathBN.gt(amount, fee.max_amount)) {
          amount = MathBN.convert(fee.max_amount)
        }

        feeLines.push({
          item_id: item.id,
          service_fee_id: fee.id,
          code: fee.code,
          rate: Number(fee.value),
          amount: Number(amount),
          description: fee.name,
        })
      }
    }

    return feeLines
  }

  private isFeeApplicableToItem(
    fee: {
      charging_level: string
      rules?: Array<{
        reference: string
        reference_id: string
        mode: string
      }>
    },
    item: {
      product?: {
        id: string
        type_id?: string
        collection_id?: string
        categories?: Array<{ id: string }>
        seller?: { id: string }
      }
    }
  ): boolean {
    if (fee.charging_level === ServiceFeeChargingLevel.GLOBAL) {
      return true
    }

    if (!fee.rules || fee.rules.length === 0) {
      return true
    }

    const includeRules = fee.rules.filter((r) => r.mode === "include")
    const excludeRules = fee.rules.filter((r) => r.mode === "exclude")

    const matchesRule = (rule: (typeof fee.rules)[0]): boolean => {
      const product = item.product
      if (!product) return false

      switch (rule.reference) {
        case "product":
          return product.id === rule.reference_id
        case "product_type":
          return product.type_id === rule.reference_id
        case "product_collection":
          return product.collection_id === rule.reference_id
        case "product_category":
          return (
            product.categories?.some((c) => c.id === rule.reference_id) ??
            false
          )
        case "seller":
          return product.seller?.id === rule.reference_id
        default:
          return false
      }
    }

    if (excludeRules.some(matchesRule)) {
      return false
    }

    if (includeRules.length > 0) {
      return includeRules.some(matchesRule)
    }

    return true
  }

  @InjectManager()
  @EmitEvents()
  async upsertServiceFeeLines(
    serviceFeeLines: (CreateServiceFeeLineDTO | UpdateServiceFeeLineDTO)[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<ServiceFeeLineDTO[]> {
    const result = await this.serviceFeeLineService_.upsert(
      serviceFeeLines,
      sharedContext
    )
    return await this.baseRepository_.serialize<ServiceFeeLineDTO[]>(result)
  }

  @InjectManager()
  async deactivateServiceFee(
    id: string,
    changedBy?: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<ServiceFeeDTO> {
    const [current] = await this.listServiceFees(
      { id },
      {},
      sharedContext
    )
    const previousSnapshot = current
      ? JSON.parse(JSON.stringify(current))
      : null

    const updated = await this.updateServiceFees(
      [{ id, status: ServiceFeeStatus.INACTIVE, is_enabled: false }] as any,
      sharedContext
    )
    const updatedFee = Array.isArray(updated) ? updated[0] : updated

    await this.logChange(
      id,
      "deactivated",
      changedBy ?? null,
      previousSnapshot,
      JSON.parse(JSON.stringify(updatedFee)),
      sharedContext
    )

    return updatedFee as unknown as ServiceFeeDTO
  }

  @InjectManager()
  async activatePendingFees(
    @MedusaContext() sharedContext: Context = {}
  ): Promise<ServiceFeeDTO[]> {
    const pendingFees = await this.listServiceFees(
      {
        status: ServiceFeeStatus.PENDING,
      },
      {},
      sharedContext
    )

    const now = new Date()
    const toActivate = pendingFees.filter(
      (f) => f.effective_date && new Date(f.effective_date) <= now
    )

    const activated: ServiceFeeDTO[] = []

    for (const fee of toActivate) {
      // ATOMIC: Deactivate predecessor BEFORE activating new (same context/transaction)
      if (
        fee.charging_level === ServiceFeeChargingLevel.GLOBAL &&
        fee.replaces_fee_id
      ) {
        await this.deactivateServiceFee(
          fee.replaces_fee_id,
          "system",
          sharedContext
        )
      }

      const updated = await this.updateServiceFees(
        [{ id: fee.id, status: ServiceFeeStatus.ACTIVE, is_enabled: true }] as any,
        sharedContext
      )
      const updatedFee = Array.isArray(updated) ? updated[0] : updated

      await this.logChange(
        fee.id,
        "activated",
        null,
        JSON.parse(JSON.stringify(fee)),
        JSON.parse(JSON.stringify(updatedFee)),
        sharedContext
      )

      activated.push(updatedFee as unknown as ServiceFeeDTO)
    }

    return activated
  }

  @InjectManager()
  async logChange(
    serviceFeeId: string,
    action: string,
    changedBy: string | null,
    previousSnapshot: Record<string, unknown> | null,
    newSnapshot: Record<string, unknown> | null,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<ServiceFeeChangeLogDTO> {
    const [log] = await this.serviceFeeChangeLogService_.create(
      [
        {
          service_fee_id: serviceFeeId,
          action,
          changed_by: changedBy,
          previous_snapshot: previousSnapshot,
          new_snapshot: newSnapshot,
        },
      ],
      sharedContext
    )
    return await this.baseRepository_.serialize<ServiceFeeChangeLogDTO>(log)
  }
}

export default ServiceFeeModuleService
