import {
    createWorkflow,
    createHook,
    WorkflowResponse,
    transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductStatus, ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { validatePublishProductsStep, updateProductsStep } from "../steps"
import {
    retrieveProductWithChangeStep,
    createProductChangeActionsStep,
    confirmProductChangesStep,
} from "../../product-edit/steps"

export const publishProductsWorkflowId = "publish-products"

type PublishProductsWorkflowInput = {
    product_ids: string[]
    actor_id?: string
}

export const publishProductsWorkflow = createWorkflow(
    publishProductsWorkflowId,
    function (input: PublishProductsWorkflowInput) {
        const productId = transform({ input }, ({ input }) => input.product_ids[0])

        const product = retrieveProductWithChangeStep({
            product_id: productId,
        })

        const products = transform({ product }, ({ product }) => [product])

        validatePublishProductsStep({ products })

        const actionDataList = transform(
            { products },
            ({ products }) =>
                products.map((product) => ({
                    product_change_id: product.product_change.id,
                    product_id: product.id,
                    action: ProductChangeActionType.STATUS_CHANGE,
                    details: { status: ProductStatus.PUBLISHED },
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
                status: ProductStatus.PUBLISHED,
            },
        }))

        updateProductsStep(updateInput)

        emitEventStep({
            eventName: ProductWorkflowEvents.PUBLISHED,
            data: transform({ input }, ({ input }) =>
                input.product_ids.map((id) => ({ id }))
            ),
        })

        const productsPublished = createHook("productsPublished", {
            product_ids: input.product_ids,
        })

        return new WorkflowResponse(void 0, { hooks: [productsPublished] })
    }
)
