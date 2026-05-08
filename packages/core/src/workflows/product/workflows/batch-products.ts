import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { ProductStatus, UpdateProductDTO } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { updateProductsStep } from "../steps"
import { deleteProductsWorkflow } from "./delete-products"

export const batchProductsWorkflowId = "batch-products"

type BatchProductsWorkflowInput = {
  update?: (UpdateProductDTO & { id: string })[]
  delete?: string[]
} & AdditionalData

const STATUS_EVENT_MAP: Record<ProductStatus, string | undefined> = {
  [ProductStatus.PROPOSED]: ProductWorkflowEvents.PROPOSED,
  [ProductStatus.PUBLISHED]: ProductWorkflowEvents.PUBLISHED,
  [ProductStatus.REJECTED]: ProductWorkflowEvents.REJECTED,
  [ProductStatus.REQUIRES_ACTION]: ProductWorkflowEvents.CHANGES_REQUESTED,
  [ProductStatus.DRAFT]: undefined,
}

export const batchProductsWorkflow = createWorkflow(
  batchProductsWorkflowId,
  function (input: BatchProductsWorkflowInput) {
    const updateProducts = transform(
      { input },
      ({ input }) => input.update ?? []
    )
    const deleteIds = transform(
      { input },
      ({ input }) => input.delete ?? []
    )

    const updateIds = transform({ updateProducts }, ({ updateProducts }) =>
      updateProducts.map((p) => p.id)
    )

    const { data: prevProducts } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: updateIds },
    }).config({ name: "get-prev-products" })

    const products = updateProductsStep({ products: updateProducts })

    when({ deleteIds }, ({ deleteIds }) => deleteIds.length > 0).then(() => {
      deleteProductsWorkflow.runAsStep({
        input: { ids: deleteIds },
      })
    })

    const productsUpdated = createHook("productsUpdated", {
      products,
      additional_data: input.additional_data,
    })

    const transitions = transform(
      { products, prevProducts },
      ({ products, prevProducts }) => {
        const prevStatusById = new Map<string, string>(
          prevProducts.map((p: { id: string; status: string }) => [
            p.id,
            p.status,
          ])
        )

        const grouped: Record<string, { id: string }[]> = {}
        for (const product of products) {
          const prevStatus = prevStatusById.get(product.id)
          if (!prevStatus || prevStatus === product.status) {
            continue
          }
          const eventName = STATUS_EVENT_MAP[product.status as ProductStatus]
          if (!eventName) {
            continue
          }
          ;(grouped[eventName] ??= []).push({ id: product.id })
        }

        return {
          updated: products.map((p) => ({ id: p.id })),
          proposed: grouped[ProductWorkflowEvents.PROPOSED] ?? [],
          published: grouped[ProductWorkflowEvents.PUBLISHED] ?? [],
          rejected: grouped[ProductWorkflowEvents.REJECTED] ?? [],
          changesRequested:
            grouped[ProductWorkflowEvents.CHANGES_REQUESTED] ?? [],
        }
      }
    )

    emitEventStep({
      eventName: ProductWorkflowEvents.UPDATED,
      data: transform({ transitions }, ({ transitions }) => transitions.updated),
    }).config({ name: "emit-updated" })

    emitEventStep({
      eventName: ProductWorkflowEvents.PROPOSED,
      data: transform({ transitions }, ({ transitions }) => transitions.proposed),
    }).config({ name: "emit-proposed" })

    emitEventStep({
      eventName: ProductWorkflowEvents.PUBLISHED,
      data: transform({ transitions }, ({ transitions }) => transitions.published),
    }).config({ name: "emit-published" })

    emitEventStep({
      eventName: ProductWorkflowEvents.REJECTED,
      data: transform({ transitions }, ({ transitions }) => transitions.rejected),
    }).config({ name: "emit-rejected" })

    emitEventStep({
      eventName: ProductWorkflowEvents.CHANGES_REQUESTED,
      data: transform(
        { transitions },
        ({ transitions }) => transitions.changesRequested
      ),
    }).config({ name: "emit-changes-requested" })

    return new WorkflowResponse(products, { hooks: [productsUpdated] })
  }
)
