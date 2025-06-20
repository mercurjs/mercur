import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { ATTRIBUTE_MODULE } from '../../../modules/attribute'
import AttributeModuleService from '../../../modules/attribute/service'
import { UpdateAttributeValueDTO } from '../../../modules/attribute/types'

export const updateAttributePossibleValueStepId =
  'update-attribute-possible-value'

type StepInput = UpdateAttributeValueDTO

export const updateAttributePossibleValueStep = createStep(
  updateAttributePossibleValueStepId,
  async (payload: StepInput, { container }) => {
    const attributeModuleService = container.resolve(
      ATTRIBUTE_MODULE
    ) as AttributeModuleService
    const updated =
      await attributeModuleService.updateAttributePossibleValues(payload)
    return new StepResponse(updated, payload.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }

    const attributeModuleService = container.resolve(
      ATTRIBUTE_MODULE
    ) as AttributeModuleService
    await attributeModuleService.deleteAttributePossibleValues(id)
  }
)
