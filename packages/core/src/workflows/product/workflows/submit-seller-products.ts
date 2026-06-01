import {
  AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  createHook,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateProductDTO,
  ProductChangeActionType,
  ProductDTO,
} from "@mercurjs/types"

import {
  associateSellersWithProductStep,
  createProductsStep,
} from "../steps"
import {
  confirmProductChangesStep,
  createProductChangeActionsStep,
  createProductChangesStep,
} from "../../product-edit/steps"
import { validateSellerProductPermissionsStep } from "../steps/validate-seller-product-permissions"

export const submitSellerProductsWorkflowId = "mercur-submit-seller-products"

export type SubmitSellerProductsWorkflowInput = {
  products: CreateProductDTO[]
  seller_id: string
} & AdditionalData

export type SubmitSellerProductsWorkflowHooks = [
  Hook<
    "validate",
    {
      input: SubmitSellerProductsWorkflowInput
      products: CreateProductDTO[]
      seller_id: string
    },
    unknown
  >,
  Hook<
    "sellerProductsSubmitted",
    {
      products: ProductDTO[]
      seller_id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const submitSellerProductsWorkflow: ReturnWorkflow<
  SubmitSellerProductsWorkflowInput,
  ProductDTO[],
  SubmitSellerProductsWorkflowHooks
> = createWorkflow(
  submitSellerProductsWorkflowId,
  function (input: SubmitSellerProductsWorkflowInput) {
    const permissionData = transform(input, ({ products, seller_id }) => {
      const category_ids = products
        .flatMap((p) => p.category_ids ?? [])
        .filter(Boolean)
      return { seller_id, category_ids }
    })

    validateSellerProductPermissionsStep(permissionData)

    const productData = transform(input, ({ products, seller_id }) =>
      products.map((product) => ({
        ...product,
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

    const sellerProductLinks = transform(
      { createdProducts, input },
      ({ createdProducts, input }) =>
        createdProducts.map((p) => ({
          product_id: p.id,
          seller_id: input.seller_id,
        }))
    )

    associateSellersWithProductStep({ links: sellerProductLinks })

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
          details: { status: product.status },
        }))
    )

    createProductChangeActionsStep(actionInputs)

    // Submission is the terminal event for this change — there is no admin
    // review of the creation itself (admin review of `proposed` products
    // happens through publish/reject/request-changes, which open their own
    // changes). Confirm immediately so the change becomes audit history and
    // the product isn't left blocked behind a pending change.
    const confirmInputs = transform(
      { changes, input },
      ({ changes, input }) =>
        changes.map((change) => ({
          id: change.id,
          confirmed_by: input.seller_id,
        }))
    )

    confirmProductChangesStep(confirmInputs)

    emitEventStep({
      eventName: "product.created",
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
