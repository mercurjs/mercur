import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import CustomFieldsModuleService from "../../../modules/custom-fields/services/custom-fields-module-service"

type UpsertCustomFieldsStepInput = {
  alias: string
  data: { id: string; [key: string]: unknown } | { id: string; [key: string]: unknown }[]
}

export const upsertCustomFieldsStep = createStep(
  "upsert-custom-fields",
  async (input: UpsertCustomFieldsStepInput, { container }) => {
    const service = container.resolve<CustomFieldsModuleService>(MercurModules.CUSTOM_FIELDS)

    const result = await service.upsert(input.alias, input.data)

    return new StepResponse(result, input)
  }
)
