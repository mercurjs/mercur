import { toHandle } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { ATTRIBUTE_MODULE, AttributeModuleService } from '@mercurjs/attribute'
import { CreateAttributeDTO } from '@mercurjs/framework'

export const createAttributesStepId = 'create-attributes'

type CreateAttributeStepInput = Omit<
  CreateAttributeDTO,
  'product_category_ids'
>[]

export const createAttributesStep = createStep(
  createAttributesStepId,
  async (data: CreateAttributeStepInput, { container }) => {
    const service = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE)

    const validated = data.map((attribute) => {
      return {
        ...attribute,
        handle: attribute.handle || toHandle(attribute.name)
      }
    })

    //@ts-expect-error Possible values
    const created = (await service.createAttributes(validated)) as any[]
    return new StepResponse(
      created,
      created.map((attribute) => attribute.id)
    )
  },
  async (createdIds: string[] | undefined, { container }) => {
    if (!createdIds?.length) {
      return
    }

    const service = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE)

    await service.deleteAttributes(createdIds)
  }
)
