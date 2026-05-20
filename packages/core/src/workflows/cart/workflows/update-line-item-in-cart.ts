import {
  CartWorkflowEvents,
  isDefined,
  MathBN,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  createHook,
  parallelize,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  deleteLineItemsWorkflow,
  emitEventStep,
  refreshCartItemsWorkflow,
  releaseLockStep,
  updateLineItemsStepWithSelector,
  useQueryGraphStep,
  validateCartStep,
} from "@medusajs/medusa/core-flows"
import { cartFieldsForPricingContext } from "../utils/fields"
import { overrideWorkflow } from "../../utils/override-workflow"

export const updateLineItemInCartWorkflowId = "update-line-item-in-cart"

type UpdateLineItemInCartWorkflowInput = {
  cart_id: string
  item_id: string
  update: {
    quantity?: number
    unit_price?: number
    metadata?: Record<string, unknown> | null
  }
  additional_data?: Record<string, unknown>
}

const cartFields = cartFieldsForPricingContext.concat(["items.*"])

export const updateLineItemInCartWorkflow = overrideWorkflow(
  {
    name: updateLineItemInCartWorkflowId,
    idempotent: false,
  },
  (input: UpdateLineItemInCartWorkflowInput) => {
    acquireLockStep({
      key: input.cart_id,
      timeout: 2,
      ttl: 10,
    })

    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: cartFields,
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-cart" })

    validateCartStep({ cart })

    const validate = createHook("validate", { input, cart })

    const item = transform({ cart, input }, ({ cart, input }) => {
      const item = (cart.items ?? []).find((i) => i.id === input.item_id)
      if (!item) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Line item with id ${input.item_id} was not found`,
        )
      }
      return item
    })

    const shouldRemoveItem = transform({ input }, ({ input }) => {
      return !!(
        isDefined(input.update.quantity) &&
        MathBN.eq(input.update.quantity!, 0)
      )
    })

    when(
      "should-remove-item",
      { shouldRemoveItem },
      ({ shouldRemoveItem }) => shouldRemoveItem,
    ).then(() => {
      deleteLineItemsWorkflow.runAsStep({
        input: {
          cart_id: input.cart_id,
          ids: [input.item_id],
          additional_data: input.additional_data,
        },
      })
    })

    when(
      "should-update-item",
      { shouldRemoveItem },
      ({ shouldRemoveItem }) => !shouldRemoveItem,
    ).then(() => {
      const lineItemUpdate = transform({ input, item }, ({ input, item }) => {
        const updateData: Record<string, unknown> = {
          ...input.update,
        }

        if (isDefined(input.update.unit_price)) {
          updateData.unit_price = input.update.unit_price
          updateData.is_custom_price = true
        } else {
          updateData.unit_price = item.unit_price
          updateData.is_custom_price = (item as { is_custom_price?: boolean })
            .is_custom_price
        }
        updateData.is_tax_inclusive = item.is_tax_inclusive

        if (!isDefined(updateData.unit_price)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Line item ${item.title} has no unit price`,
          )
        }

        return {
          data: updateData,
          selector: { id: input.item_id },
        }
      })

      updateLineItemsStepWithSelector(lineItemUpdate as never)

      refreshCartItemsWorkflow.runAsStep({
        input: {
          cart_id: input.cart_id,
          additional_data: input.additional_data,
        },
      })
    })

    parallelize(
      releaseLockStep({ key: input.cart_id }),
      emitEventStep({
        eventName: CartWorkflowEvents.UPDATED,
        data: { id: input.cart_id },
      }),
    )

    return new WorkflowResponse(void 0, {
      hooks: [validate],
    })
  },
)
