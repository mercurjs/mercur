import { DAL } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"
import { SubscriptionPlan, SubscriptionOverride } from "./models"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
}

class SubscriptionModuleService extends MedusaService({
  SubscriptionPlan,
  SubscriptionOverride,
}) {
  protected readonly baseRepository_: DAL.RepositoryService

  constructor({ baseRepository }: InjectedDependencies) {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
    this.baseRepository_ = baseRepository
  }
}

export default SubscriptionModuleService
