import { Modules } from "@medusajs/framework/utils"
import { AdditionalData, LinkDefinition } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  dismissRemoteLinkStep,
  removeProductOptionsFromProductStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { AttributeType, MercurModules } from "@mercurjs/types"

import { validateProductAttributesNotRequiredStep } from "../steps"
import { deleteProductAttributesWorkflow } from "./delete-product-attributes"

export type RemoveProductAttributesFromProductWorkflowInput = {
  product_id: string
  remove: string[]
  readd?: string[]
} & AdditionalData

export const removeProductAttributesFromProductWorkflowId =
  "remove-product-attributes-from-product"

export const removeProductAttributesFromProductWorkflow = createWorkflow(
  removeProductAttributesFromProductWorkflowId,
  function (input: RemoveProductAttributesFromProductWorkflowInput) {
    const attributesQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: { id: input.remove },
      fields: [
        "id",
        "name",
        "type",
        "is_required",
        "is_variant_axis",
        "product_id",
        "product_option_id",
      ],
    }).config({ name: "rm-pa-attributes" })

    validateProductAttributesNotRequiredStep(
      transform({ attributesQuery, input }, ({ attributesQuery, input }) => {
        const readd = new Set(input.readd ?? [])
        return (attributesQuery.data ?? [])
          .filter((a) => !readd.has(a.id))
          .map((a) => ({
            id: a.id,
            name: a.name,
            is_required: !!a.is_required,
          }))
      }),
    )

    const productQuery = useQueryGraphStep({
      entity: "product",
      filters: { id: input.product_id },
      fields: [
        "product_attribute_values.id",
        "product_attribute_values.attribute.id",
      ],
      options: { isList: false },
    }).config({ name: "rm-pa-product" })

    const plan = transform(
      { attributesQuery, productQuery, input },
      ({ attributesQuery, productQuery, input }) => {
        const product_id = input.product_id
        const optionPairs: { product_option_id: string; product_id: string }[] =
          []
        const scopedAttrIds: string[] = []
        // The formatter reads the selected axis subset from the pivot, so axis
        // links must be cleaned up alongside non-axis ones.
        const dismissAttrIds = new Set<string>()

        for (const a of (attributesQuery.data ?? []) as {
          id: string
          type: AttributeType
          is_variant_axis: boolean
          product_id: string | null
          product_option_id: string | null
        }[]) {
          const isAxis =
            a.type === AttributeType.MULTI_SELECT &&
            !!a.is_variant_axis &&
            !!a.product_option_id
          const isScoped = !!a.product_id

          dismissAttrIds.add(a.id)

          if (isAxis && !isScoped) {
            optionPairs.push({
              product_option_id: a.product_option_id as string,
              product_id,
            })
          } else if (isScoped) {
            scopedAttrIds.push(a.id)
          }
        }

        const linkedValues = (productQuery.data?.product_attribute_values ??
          []) as {
            id: string
            attribute?: { id: string }
          }[]
        const dismissLinks: LinkDefinition[] = linkedValues
          .filter((v) => v.attribute && dismissAttrIds.has(v.attribute.id))
          .map((v) => ({
            [Modules.PRODUCT]: { product_id },
            [MercurModules.PRODUCT_ATTRIBUTE]: {
              product_attribute_value_id: v.id,
            },
          }))

        return { optionPairs, scopedAttrIds, dismissLinks }
      },
    )

    when({ plan }, ({ plan }) => plan.optionPairs.length > 0).then(() =>
      removeProductOptionsFromProductStep(plan.optionPairs),
    )

    when({ plan }, ({ plan }) => plan.dismissLinks.length > 0).then(() =>
      dismissRemoteLinkStep(plan.dismissLinks).config({
        name: "rm-pa-dismiss-value-links",
      }),
    )

    when({ plan }, ({ plan }) => plan.scopedAttrIds.length > 0).then(() =>
      deleteProductAttributesWorkflow.runAsStep({
        input: { ids: plan.scopedAttrIds },
      }),
    )

    return new WorkflowResponse(void 0)
  },
)
