import {
    createWorkflow,
    createHook,
    WorkflowResponse,
    transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductStatus, ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import {
    retrieveProductWithChangeStep,
    validateAcceptProductsStep,
    createProductChangeActionsStep,
    confirmProductChangesStep,
    updateProductsStep,
} from "../steps"

export const acceptProductsWorkflowId = "accept-products"

type AcceptProductsWorkflowInput = {
    product_ids: string[]
    actor_id?: string
}

export const acceptProductsWorkflow = createWorkflow(
    acceptProductsWorkflowId,
    function (input: AcceptProductsWorkflowInput) {
        const productId = transform({ input }, ({ input }) => input.product_ids[0])

        const product = retrieveProductWithChangeStep({
            product_id: productId,
        })

        const products = transform({ product }, ({ product }) => [product])

        validateAcceptProductsStep({ products })

        const actionDataList = transform(
            { products },
            ({ products }) =>
                products.map((product) => ({
                    product_change_id: product.product_change.id,
                    product_id: product.id,
                    action: ProductChangeActionType.STATUS_CHANGE,
                    details: { status: ProductStatus.ACCEPTED },
                }))
        )

        createProductChangeActionsStep(actionDataList)

        const changeDataList = transform(
            { products, input },
            ({ products, input }) =>
                products.map((product) => ({
                    id: product.product_change.id,
                    confirmed_by: input.actor_id,
                }))
        )

        confirmProductChangesStep(changeDataList)

        const updateInput = transform({ input }, ({ input }) => ({
            selector: { id: input.product_ids },
            data: {
                status: ProductStatus.ACCEPTED,
                is_active: true,
            },
        }))

        updateProductsStep(updateInput)

        emitEventStep({
            eventName: ProductWorkflowEvents.ACCEPTED,
            data: transform({ input }, ({ input }) =>
                input.product_ids.map((id) => ({ id }))
            ),
        })

        const productsAccepted = createHook("productsAccepted", {
            product_ids: input.product_ids,
        })

        return new WorkflowResponse(void 0, { hooks: [productsAccepted] })
    }
)
