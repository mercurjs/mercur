import { Modules } from '@medusajs/framework/utils'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'

import { ATTRIBUTE_MODULE } from '@mercurjs/attribute'
import { CreateProductAttributeValueDTO } from '@mercurjs/framework'

import { createAttributeValueStep, validateAttributeValueStep } from '../steps'

export const createAttributeValueWorkflowId = 'create-attribute-value'

export const createAttributeValueWorkflow = createWorkflow(
  createAttributeValueWorkflowId,
  (input: CreateProductAttributeValueDTO) => {
    const attributeValueWithoutExternalRelations = transform(
      { input },
      ({ input }) => {
        return {
          attribute_id: input.attribute_id,
          value: input.value
        }
      }
    )

    validateAttributeValueStep(input)

    const attributeValue = createAttributeValueStep(
      attributeValueWithoutExternalRelations
    )

    const link = transform(
      { input, attributeValue },
      ({ input, attributeValue }) => [
        {
          [Modules.PRODUCT]: {
            product_id: input.product_id
          },
          [ATTRIBUTE_MODULE]: {
            attribute_value_id: attributeValue.id
          }
        }
      ]
    )

    createRemoteLinkStep(link)

    return new WorkflowResponse(attributeValue)
  }
)
