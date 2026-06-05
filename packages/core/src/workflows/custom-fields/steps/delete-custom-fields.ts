import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import CustomFieldsModuleService from "../../../modules/custom-fields/services/custom-fields-module-service"

type DeleteCustomFieldsStepInput = {
  alias: string
  ids: string[]
}

export const deleteCustomFieldsStep = createStep(
  "delete-custom-fields",
  async (input: DeleteCustomFieldsStepInput, { container }) => {
    const service = container.resolve<CustomFieldsModuleService>(MercurModules.CUSTOM_FIELDS)

    await service.delete(input.alias, input.ids)

    return new StepResponse(undefined, input)
  }
)
