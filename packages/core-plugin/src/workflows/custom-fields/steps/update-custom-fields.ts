import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import CustomFieldsModuleService from "../../../modules/custom-fields/services/custom-fields-module-service"

type UpdateCustomFieldsStepInput = {
  alias: string
  data: { id: string; [key: string]: unknown }[]
}

export const updateCustomFieldsStep = createStep(
  "update-custom-fields",
  async (input: UpdateCustomFieldsStepInput, { container }) => {
    const service = container.resolve<CustomFieldsModuleService>(MercurModules.CUSTOM_FIELDS)

    const previousData = await service.list(
      { [input.data[0] ? Object.keys(input.data[0]).find((k) => k.endsWith("_id")) || "id" : "id"]: input.data.map((d) => d.id) },
      {}
    )

    const updated = await service.update(input.alias, input.data)

    return new StepResponse(updated, {
      alias: input.alias,
      data: previousData,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const service = container.resolve<CustomFieldsModuleService>(MercurModules.CUSTOM_FIELDS)

    await service.update(data.alias, data.data)
  }
)
