import {
  StepResponse,
  WorkflowData,
  createStep
} from '@medusajs/framework/workflows-sdk'

import { ATTRIBUTE_MODULE, AttributeModuleService } from '@mercurjs/attribute'
import { UpdateAttributeDTO } from '@mercurjs/framework'

const updateAttributesStepId = 'update-attributes'

export const updateAttributesStep = createStep(
  updateAttributesStepId,
  async (data: WorkflowData<UpdateAttributeDTO[]>, { container }) => {
    const service = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE)

    const prevData = await service.listAttributes({
      id: data.map((attribute) => attribute.id)
    })

    const normalized = data.map((attr) => {
      const { possible_values: values, ...attribute } = attr
      const valuesWithAttribute = values?.map((val) => ({
        ...val,
        attribute_id: attribute.id
      }))
      return {
        ...attr,
        possible_values: valuesWithAttribute
      }
    })

    const attributes = normalized.map((element) => {
      delete element.product_category_ids
      return element
    })

    await service.updateAttributeWithUpsertOrReplacePossibleValues(normalized)

    return new StepResponse(attributes, prevData)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) {
      return
    }
    const service = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE)

    //@ts-expect-error Possible values
    await service.updateAttributes(prevData)
  }
)
