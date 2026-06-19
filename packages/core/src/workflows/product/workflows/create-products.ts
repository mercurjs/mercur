import {
  createHook,
  createWorkflow,
  type ReturnWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  AdditionalData,
  ProductTypes,
} from "@medusajs/framework/types"
import {
  createProductsWorkflow as stockCreateProductsWorkflow,
  createProductVariantsWorkflow,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateProductDTO,
  ProductChangeActionType,
} from "@mercurjs/types"

import { addProductAttributesToProductWorkflow } from "../../product-attribute/workflows/add-product-attributes-to-product"
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

    // Axis attributes become native options that the engine attaches AFTER the
    // product exists, and variants bind to those options by name. So create the
    // products bare (no attributes, no variants), attach attributes, then create
    // the variants. Stock product create requires at least one option, so seed a
    // default one — axis attributes add the real options afterwards.
    const stockProducts = transform({ input }, ({ input }) =>
      input.products.map((p) => {
        const { attributes: _attributes, variants: _variants, ...rest } = p
        return {
          ...rest,
          options: [{ title: "Default option", values: ["Default value"] }],
        }
      }),
    )

    const createdProducts = stockCreateProductsWorkflow.runAsStep({
      input: {
        products: stockProducts as ProductTypes.CreateProductDTO[],
        additional_data: input.additional_data,
      },
    })

    // Attach every product's attributes in one batched engine run.
    const attributeItems = transform(
      { input, createdProducts },
      ({ input, createdProducts }) =>
        input.products
          .map((p, idx) => ({
            product_id: createdProducts[idx]?.id as string,
            add: p.attributes ?? [],
          }))
          .filter((item) => item.product_id && item.add.length > 0),
    )

    when(
      { attributeItems },
      ({ attributeItems }) => attributeItems.length > 0,
    ).then(() =>
      addProductAttributesToProductWorkflow.runAsStep({
        input: attributeItems,
      }),
    )

    // Now that options exist on each product, create the variants — their
    // `options` name-map binds to the freshly attached option values.
    const productVariants = transform(
      { input, createdProducts },
      ({ input, createdProducts }) =>
        input.products.flatMap((p, idx) => {
          const product_id = createdProducts[idx]?.id as string
          return (p.variants ?? []).map((v) => ({
            ...v,
            product_id,
            // Every product carries the seeded default option, so each variant
            // must cover it alongside the axis-attribute option values.
            options: {
              "Default option": "Default value",
              ...((v as { options?: Record<string, string> }).options ?? {}),
            },
          }))
        }),
    )

    when(
      { productVariants },
      ({ productVariants }) => productVariants.length > 0,
    ).then(() =>
      createProductVariantsWorkflow.runAsStep({
        input: {
          product_variants:
            productVariants as ProductTypes.CreateProductVariantDTO[],
          additional_data: input.additional_data,
        },
      }),
    )

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
