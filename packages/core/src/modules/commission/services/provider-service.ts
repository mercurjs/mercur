import { MedusaError } from "@medusajs/framework/utils"
import { ICommissionProvider } from "@mercurjs/types"

export const CommissionProviderRegistrationPrefix = "cp_"
export const CommissionDefaultProvider = "commission_default_provider"

type InjectedDependencies = {
  [key: `${typeof CommissionProviderRegistrationPrefix}${string}`]: ICommissionProvider
}

export default class CommissionProviderService {
  protected readonly container_: InjectedDependencies

  constructor(container: InjectedDependencies) {
    this.container_ = container
  }

  retrieveProvider(providerId: string): ICommissionProvider {
    try {
      return this.container_[
        `${CommissionProviderRegistrationPrefix}${providerId}`
      ]
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Unable to retrieve the commission provider with id: ${providerId}. Please make sure that the provider is registered in the container and it is configured correctly in your project configuration file.`
      )
    }
  }
}
