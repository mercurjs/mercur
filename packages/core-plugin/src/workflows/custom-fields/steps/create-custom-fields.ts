import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import CustomFieldsModuleService from "../../../modules/custom-fields/services/custom-fields-module-service"

type CreateCustomFieldsStepInput = {
  alias: string
  data: { id: string; [key: string]: unknown }[]
}

export const createCustomFieldsStep = createStep(
  "create-custom-fields",
  async (input: CreateCustomFieldsStepInput, { container }) => {
    const service = container.resolve<CustomFieldsModuleService>(MercurModules.CUSTOM_FIELDS)

    const created = await service.create(input.alias, input.data)

    return new StepResponse(created, {
      alias: input.alias,
      ids: created.map((row) => row.id),
    })
  },
  async (data, { container }) => {
    if (!data) return

    const service = container.resolve<CustomFieldsModuleService>(MercurModules.CUSTOM_FIELDS)

    await service.delete(data.alias, data.ids)
  }
)
