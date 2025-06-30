import { LinkDefinition } from '@medusajs/framework/types'
import { Modules, arrayDifference } from '@medusajs/framework/utils'
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk'
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep
} from '@medusajs/medusa/core-flows'

import { ATTRIBUTE_MODULE } from '@mercurjs/attribute'
import { UpdateAttributeDTO } from '@mercurjs/framework'

import attributeProductCategory from '../../../links/category-attribute'
import { updateAttributesStep } from '../steps'

const updateAttributesWorkflowId = 'update-attributes'

export type UpdateAttributesWorkflowInput = {
  attributes: UpdateAttributeDTO[]
}

export const updateAttributesWorkflow = createWorkflow(
  updateAttributesWorkflowId,
  (input: UpdateAttributesWorkflowInput) => {
    const toUpdateInput = transform({ input }, ({ input: { attributes } }) => {
      return attributes.map((attribute) => ({
        ...attribute,
        product_category_ids: undefined
      }))
    })

    const updatedAttributes = updateAttributesStep(toUpdateInput)

    const attributesIdsWithCategories = transform(
      { input, updatedAttributes },
      ({ input, updatedAttributes }) => {
        const updatedAttributeIds = updatedAttributes.map((attr) => attr.id)
        const attributeIdsWithoutCategories = input.attributes
          .filter((attr) => !attr.product_category_ids)
          .map((attr) => attr.id)
        return arrayDifference(
          updatedAttributeIds,
          attributeIdsWithoutCategories
        )
      }
    )

    const currentCategoriesLinksResult = useQueryGraphStep({
      entity: attributeProductCategory.entryPoint,
      fields: ['attribute_id', 'product_category_id'],
      filters: {
        attribute_id: attributesIdsWithCategories
      }
    })

    const currentCategoriesLinks = transform(
      { currentCategoriesLinksResult },
      ({ currentCategoriesLinksResult }) => {
        return currentCategoriesLinksResult.data
      }
    )

    const toDeleteCategoriesLinks = transform(
      { currentCategoriesLinks },
      ({ currentCategoriesLinks }) => {
        if (!currentCategoriesLinks.length) {
          return []
        }

        return currentCategoriesLinks.map(
          ({ attribute_id, product_category_id }) => ({
            [Modules.PRODUCT]: {
              product_category_id
            },
            [ATTRIBUTE_MODULE]: {
              attribute_id
            }
          })
        )
      }
    )

    dismissRemoteLinkStep(toDeleteCategoriesLinks)

    const toCreateCategoryLinks: LinkDefinition[] = transform(
      { input },
      ({ input: { attributes } }) => {
        return attributes
          .filter((attribute) => attribute.product_category_ids)
          .flatMap((attribute) =>
            attribute.product_category_ids!.map((attrCat) => ({
              [Modules.PRODUCT]: {
                product_category_id: attrCat.id
              },
              [ATTRIBUTE_MODULE]: {
                attribute_id: attribute.id
              }
            }))
          )
      }
    )

    createRemoteLinkStep(toCreateCategoryLinks)
    return new WorkflowResponse(updatedAttributes)
  }
)
