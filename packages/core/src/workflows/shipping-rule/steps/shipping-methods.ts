import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  CreateMarketplaceShippingMethodDTO,
  MercurModules,
  UpdateMarketplaceShippingMethodDTO,
} from "@mercurjs/types"

import ShippingRuleModuleService from "../../../modules/shipping-rule/service"

export const validateShippingMethodReferencesStepId =
  "validate-shipping-method-references"

export const validateShippingMethodReferencesStep = createStep(
  validateShippingMethodReferencesStepId,
  async (input: CreateMarketplaceShippingMethodDTO[], { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const providerIds = Array.from(new Set(input.map((m) => m.provider_id)))
    const typeIds = Array.from(
      new Set(input.map((m) => m.shipping_option_type_id))
    )

    const [{ data: providers }, { data: types }] = await Promise.all([
      query.graph({
        entity: "fulfillment_provider",
        fields: ["id", "is_enabled"],
        filters: { id: providerIds },
      }),
      query.graph({
        entity: "shipping_option_type",
        fields: ["id"],
        filters: { id: typeIds },
      }),
    ])

    const knownProviders = new Set(
      (providers as { id: string; is_enabled: boolean }[])
        .filter((provider) => provider.is_enabled)
        .map((provider) => provider.id)
    )
    const knownTypes = new Set((types as { id: string }[]).map((t) => t.id))

    const missingProvider = providerIds.find((id) => !knownProviders.has(id))
    if (missingProvider) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Fulfillment provider ${missingProvider} does not exist or is disabled`
      )
    }
    const missingType = typeIds.find((id) => !knownTypes.has(id))
    if (missingType) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Shipping option type ${missingType} does not exist`
      )
    }
  }
)

export const createShippingMethodsStepId = "create-shipping-methods"

export const createShippingMethodsStep = createStep(
  createShippingMethodsStepId,
  async (input: CreateMarketplaceShippingMethodDTO[], { container }) => {
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    const methods = await service.createMarketplaceShippingMethods(input)
    return new StepResponse(
      methods,
      methods.map((method) => method.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.deleteMarketplaceShippingMethods(ids)
  }
)

export const updateShippingMethodsStepId = "update-shipping-methods"

export const updateShippingMethodsStep = createStep(
  updateShippingMethodsStepId,
  async (input: UpdateMarketplaceShippingMethodDTO[], { container }) => {
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    const before = await service.listMarketplaceShippingMethods({
      id: input.map((method) => method.id),
    })
    const methods = await service.updateMarketplaceShippingMethods(input)

    const compensation: UpdateMarketplaceShippingMethodDTO[] = before.map((prev) => ({
      id: prev.id,
      name: prev.name,
      description: prev.description,
      is_active: prev.is_active,
      metadata: prev.metadata ?? null,
    }))

    return new StepResponse(methods, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.length) {
      return
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.updateMarketplaceShippingMethods(compensation)
  }
)

export const deleteShippingMethodsStepId = "delete-shipping-methods"

export const deleteShippingMethodsStep = createStep(
  deleteShippingMethodsStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.softDeleteMarketplaceShippingMethods(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.restoreMarketplaceShippingMethods(ids)
  }
)
