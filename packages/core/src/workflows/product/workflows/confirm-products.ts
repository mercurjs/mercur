import {
    createWorkflow,
    createHook,
    WorkflowResponse,
    transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import {
    ProductStatus,
    ProductChangeActionType,
    ProductChangeStatus,
} from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { validateConfirmProductsStep, updateProductsStep } from "../steps"
import {
    createProductChangesStep,
    createProductChangeActionsStep,
} from "../../product-edit/steps"

export const confirmProductsWorkflowId = "confirm-products"

type ConfirmProductsWorkflowInput = {
    product_ids: string[]
    actor_id?: string
    /**
     * Operator-only note persisted onto `ProductChange.internal_note`
     * for each confirmed product. Optional.
     */
    internal_note?: string
}

export const confirmProductsWorkflow = createWorkflow(
    confirmProductsWorkflowId,
    function (input: ConfirmProductsWorkflowInput) {
        const { data: products } = useQueryGraphStep({
            entity: "product",
            fields: ["id", "status"],
            filters: { id: input.product_ids },
            options: { throwIfKeyNotFound: true },
        }).config({ name: "get-products" })

        validateConfirmProductsStep({ products })

        const changeData = transform(
            { products, input },
            ({ products, input }) =>
                products.map((product) => ({
                    product_id: product.id,
                    created_by: input.actor_id,
                    status: ProductChangeStatus.CONFIRMED,
                    confirmed_by: input.actor_id,
                    confirmed_at: new Date(),
                    internal_note: input.internal_note,
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
                    applied: true,
                }))
        )

        createProductChangeActionsStep(actionDataList)

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
                input.product_ids.map((id) => ({
                    id,
                    internal_note: input.internal_note,
                }))
            ),
        })

        const productsConfirmed = createHook("productsConfirmed", {
            product_ids: input.product_ids,
            internal_note: input.internal_note,
        })

        return new WorkflowResponse(void 0, { hooks: [productsConfirmed] })
    }
)
