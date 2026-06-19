import {
  createHook,
  createWorkflow,
  type ReturnWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  AdditionalData,
  ProductTypes,
} from "@medusajs/framework/types"
import {
  createProductsWorkflow as stockCreateProductsWorkflow,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateProductDTO,
  ProductChangeActionType,
} from "@mercurjs/types"

import { recordProductAuditChangeWorkflow } from "../../product-edit/workflows/record-product-audit-change"
import {
  associateSellersWithProductStep,
} from "../steps"
import { ProductWorkflowEvents } from "../events"



export type CreateProductsWorkflowInput = {
  products: CreateProductDTO[]
  seller_ids?: string[]
} & AdditionalData

export const createProductsWorkflowId = "mercur-create-products"


export const createProductsWorkflow: ReturnWorkflow<
  CreateProductsWorkflowInput,
  ProductTypes.ProductDTO[],
  unknown[]
> = createWorkflow(
  createProductsWorkflowId,
  function (input: CreateProductsWorkflowInput) {
    const validate = createHook("validate", {
      input,
      products: input.products,
    })

    const createdProducts = stockCreateProductsWorkflow.runAsStep({
      input: {
        products: input.products,
        additional_data: input.additional_data,
      },
    })

    const sellerProductLinks = transform(
      { input, createdProducts },
      ({ input, createdProducts }) => {
        const links: { product_id: string; seller_id: string }[] = []
        input.products.forEach((p, idx) => {
          const product_id = createdProducts[idx]?.id
          for (const seller_id of input.seller_ids ?? []) {
            links.push({ product_id, seller_id })
          }
        })
        return links
      },
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-create-products-associate-sellers",
    })

    // Audit-trail ProductChange per created product (born CONFIRMED).
    recordProductAuditChangeWorkflow.runAsStep({
      input: transform(
        { createdProducts, input },
        ({ createdProducts, input }) => ({
          actor_id: input.seller_ids?.[0],
          changes: createdProducts.map((product) => ({
            product_id: product.id as string,
            actions: [
              {
                product_id: product.id as string,
                action: ProductChangeActionType.STATUS_CHANGE,
                details: { status: product.status as string },
              },
            ],
          })),
        }),
      ),
    })

    const productsCreated = createHook("productsCreated", {
      products: createdProducts,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: ProductWorkflowEvents.CREATED,
      data: transform({ createdProducts }, ({ createdProducts }) =>
        createdProducts.map((p) => ({ id: p.id })),
      ),
    })

    return new WorkflowResponse(createdProducts, {
      hooks: [validate, productsCreated] as const,
    })
  },
)
