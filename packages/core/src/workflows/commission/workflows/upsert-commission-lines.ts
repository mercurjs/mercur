import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { CommissionLineDTO } from "@mercurjs/types"

import { getCommissionLinesStep, upsertCommissionLinesStep } from "../steps"

const cartFields = [
  "id",
  "currency_code",
  "items.id",
  "items.subtotal",
  "items.tax_total",
  "items.product.id",
  "items.product.collection_id",
  "items.product.categories.id",
  "items.product.tags.id",
  "items.product.type_id",
  "items.product.seller.id",
  "shipping_methods.id",
  "shipping_methods.subtotal",
  "shipping_methods.tax_total",
  "shipping_methods.shipping_option.shipping_option_type_id",
]

export type UpsertCommissionLinesWorkflowInput = {
  cart_id?: string
}

export const upsertCommissionLinesWorkflowId = "upsert-commission-lines"

export const upsertCommissionLinesWorkflow = createWorkflow(
  upsertCommissionLinesWorkflowId,
  function (
    input: WorkflowData<UpsertCommissionLinesWorkflowInput>
  ): WorkflowResponse<CommissionLineDTO[]> {

    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields: cartFields,
      filters: { id: input.cart_id },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "fetch-cart" })


    const cart = transform({ carts }, ({ carts }) => {
      return carts[0]
    })

    const commissionContext = transform({ cart }, ({ cart }) => ({
      currency_code: cart.currency_code,
      items: (cart.items ?? []).map((item: any) => ({
        id: item.id,
        subtotal: item.subtotal,
        tax_total: item.tax_total,
        product: item.product
          ? {
            id: item.product.id,
            collection_id: item.product.collection_id,
            categories: item.product.categories,
            tags: item.product.tags,
            type_id: item.product.type_id,
            seller: item.product.seller,
          }
          : undefined,
      })),
      shipping_methods: (cart.shipping_methods ?? []).map((method: any) => ({
        id: method.id,
        subtotal: method.subtotal,
        tax_total: method.tax_total,
        shipping_option: method.shipping_option
          ? {
            shipping_option_type_id:
              method.shipping_option.shipping_option_type_id,
          }
          : undefined,
      })),
    }))

    const commissionLines = getCommissionLinesStep(commissionContext)

    const upsertedCommissionLines = upsertCommissionLinesStep({
      commission_lines: commissionLines,
    })

    return new WorkflowResponse(upsertedCommissionLines)
  }
)
