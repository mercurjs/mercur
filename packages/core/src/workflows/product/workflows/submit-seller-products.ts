import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateProductDTO,
  ProductChangeActionType,
  ProductStatus,
} from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import {
  createProductChangeActionsStep,
  createProductChangesStep,
  createProductsStep,
} from "../steps"
import { validateSellerProductPermissionsStep } from "../steps/validate-seller-product-permissions"

export const submitSellerProductsWorkflowId = "submit-seller-products"

type SubmitSellerProductsWorkflowInput = {
  products: CreateProductDTO[]
  seller_id: string
} & AdditionalData

export const submitSellerProductsWorkflow = createWorkflow(
  submitSellerProductsWorkflowId,
  function (input: SubmitSellerProductsWorkflowInput) {
    const permissionData = transform(input, ({ products, seller_id }) => {
      const category_ids = products
        .flatMap((p) => p.category_ids ?? [])
        .filter(Boolean)
      const brand_ids = products
        .map((p) => p.brand_id)
        .filter((id): id is string => Boolean(id))
      return { seller_id, category_ids, brand_ids }
    })

    validateSellerProductPermissionsStep(permissionData)

    const productData = transform(input, ({ products, seller_id }) =>
      products.map((product) => ({
        ...product,
        is_active: false,
        created_by: "seller",
        created_by_actor: seller_id,
      }))
    )

    // Extension point for developer-supplied validation (uniqueness,
    // identifier checksum, custom dedup, etc.). Fires before any mutation —
    // throwing from a handler aborts the workflow without side effects.
    const validate = createHook("validate", {
      input,
      products: productData,
      seller_id: input.seller_id,
    })

    const createdProducts = createProductsStep(productData)

    // One ProductChange + STATUS_CHANGE action per created product.
    const changeInputs = transform(
      { createdProducts },
      ({ createdProducts }) =>
        (createdProducts).map((p) => ({ product_id: p.id }))
    )

    const changes = createProductChangesStep(changeInputs)

    const actionInputs = transform(
      { changes, createdProducts },
      ({ changes, createdProducts }) =>
        (createdProducts).map((product, idx) => ({
          product_change_id: (changes)[idx].id,
          product_id: product.id,
          action: ProductChangeActionType.STATUS_CHANGE,
          details: { status: ProductStatus.PROPOSED },
        }))
    )

    createProductChangeActionsStep(actionInputs)

    emitEventStep({
      eventName: ProductWorkflowEvents.CREATED,
      data: transform({ createdProducts }, ({ createdProducts }) =>
        (createdProducts).map((p) => ({ id: p.id }))
      ),
    })

    const sellerProductsSubmitted = createHook("sellerProductsSubmitted", {
      products: createdProducts,
      seller_id: input.seller_id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(createdProducts, {
      hooks: [validate, sellerProductsSubmitted] as const,
    })
  }
)
