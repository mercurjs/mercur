import { LinkDefinition } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when
} from '@medusajs/framework/workflows-sdk'
import { createRemoteLinkStep } from '@medusajs/medusa/core-flows'

import { ATTRIBUTE_MODULE } from '@mercurjs/attribute'
import { CreateAttributeDTO } from '@mercurjs/framework'

import { createAttributesStep } from '../steps/create-attributes'

export const createAttributesWorkflowId = 'create-attributes'

type CreateAttributesWorkflowInput = {
  attributes: CreateAttributeDTO[]
}

export const createAttributesWorkflow = createWorkflow(
  createAttributesWorkflowId,
  (input: WorkflowData<CreateAttributesWorkflowInput>) => {
    const attributesWithoutExternalRelations = transform(
      input,
      ({ attributes }) => {
        return attributes.map((attribute) => {
          delete attribute.product_category_ids
          return attribute
        })
      }
    )

    const createdAttributes = createAttributesStep(
      attributesWithoutExternalRelations
    )

    const productCategoryLinks: LinkDefinition[] = transform(
      { input, createdAttributes },
      ({ input, createdAttributes }) => {
        return createdAttributes
          .map((attribute, idx) => {
            const inputAttribute = input.attributes[idx]
            return (
              inputAttribute.product_category_ids?.map((productCategoryId) => ({
                [Modules.PRODUCT]: {
                  product_category_id: productCategoryId
                },
                [ATTRIBUTE_MODULE]: {
                  attribute_id: attribute.id
                }
              })) || []
            )
          })
          .flat()
      }
    )

    when({ productCategoryLinks }, ({ productCategoryLinks }) => {
      return productCategoryLinks.length > 0
    }).then(() => {
      createRemoteLinkStep(productCategoryLinks)
    })

    return new WorkflowResponse(createdAttributes)
  }
)
