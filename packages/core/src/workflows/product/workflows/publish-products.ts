import {
    createWorkflow,
    createHook,
    WorkflowResponse,
    transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductStatus, ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { validatePublishProductsStep, updateProductsStep } from "../steps"
import {
    createProductChangesStep,
    createProductChangeActionsStep,
    confirmProductChangesStep,
} from "../../product-edit/steps"

export const publishProductsWorkflowId = "publish-products"

type PublishProductsWorkflowInput = {
    product_ids: string[]
    actor_id?: string
    /**
     * Operator note persisted onto the underlying `ProductChange.internal_note`
     * field for each published product. Optional.
     */
    internal_note?: string
}

export const publishProductsWorkflow = createWorkflow(
    publishProductsWorkflowId,
    function (input: PublishProductsWorkflowInput) {
        const { data: products } = useQueryGraphStep({
            entity: "product",
            fields: ["id", "status"],
            filters: { id: input.product_ids },
            options: { throwIfKeyNotFound: true },
        }).config({ name: "get-products" })

        validatePublishProductsStep({ products })

        const changeData = transform(
            { products, input },
            ({ products, input }) =>
                products.map((product) => ({
                    product_id: product.id,
                    created_by: input.actor_id,
                }))
        )

        const changes = createProductChangesStep(changeData)

        const actionDataList = transform(
            { products, changes },
            ({ products, changes }) =>
                products.map((product, index) => ({
                    product_change_id: changes[index].id,
                    product_id: product.id,
                    action: ProductChangeActionType.STATUS_CHANGE,
                    details: { status: ProductStatus.PUBLISHED },
                }))
        )

        createProductChangeActionsStep(actionDataList)

        const changeDataList = transform(
            { changes, input },
            ({ changes, input }) =>
                changes.map((change) => ({
                    id: change.id,
                    confirmed_by: input.actor_id,
                    internal_note: input.internal_note,
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
