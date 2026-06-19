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
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  CreateProductDTO,
  ProductAttributeBatchAdd,
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

    // Variant-axis attributes become native options that the engine attaches
    // AFTER the product exists, and variants bind to those options by name. So
    // create the products bare (no attributes, no variants), attach attributes,
    // then create the variants. Resolve which referenced existing attributes are
    // axes (inline axes are self-describing) so we can decide per-product whether
    // a placeholder option is needed.
    const referencedAttrIds = transform({ input }, ({ input }) =>
      Array.from(
        new Set(
          input.products.flatMap((p) =>
            (p.attributes ?? [])
              .filter(
                (r): r is Extract<ProductAttributeBatchAdd, { id: string }> =>
                  "id" in r && !!r.id,
              )
              .map((r) => r.id),
          ),
        ),
      ),
    )

    const referencedAttrs = useQueryGraphStep({
      entity: "product_attribute",
      fields: ["id", "type", "is_variant_axis"],
      filters: { id: referencedAttrIds },
    }).config({ name: "mercur-create-products-axis-attrs" })

    // Per-product: does it carry at least one variant axis? Stock create allows
    // zero options, so an axis product needs NO placeholder — the axis options
    // attached next become its options. A lingering "Default option" would
    // otherwise inflate every variant's required option set and break later
    // variant edits (SPEC-014). Only non-axis products get the placeholder so
    // their variants (and the product) still have an option to bind to.
    const createPlan = transform(
      { input, referencedAttrs },
      ({ input, referencedAttrs }) => {
        const axisIds = new Set<string>(
          ((referencedAttrs.data ?? []) as {
            id: string
            type: AttributeType
            is_variant_axis: boolean
          }[])
            .filter(
              (a) =>
                a.type === AttributeType.MULTI_SELECT && !!a.is_variant_axis,
            )
            .map((a) => a.id),
        )

        const hasAxis = (attributes?: ProductAttributeBatchAdd[]) =>
          (attributes ?? []).some((r) =>
            "id" in r
              ? axisIds.has(r.id)
              : (r as { is_variant_axis?: boolean }).is_variant_axis === true,
          )

        const hasAxisByIndex = input.products.map((p) => hasAxis(p.attributes))
        const stockProducts = input.products.map((p, i) => {
          const { attributes: _attributes, variants: _variants, ...rest } = p
          return hasAxisByIndex[i]
            ? { ...rest }
            : {
                ...rest,
                options: [
                  { title: "Default option", values: ["Default value"] },
                ],
              }
        })

        return { stockProducts, hasAxisByIndex }
      },
    )

    const createdProducts = stockCreateProductsWorkflow.runAsStep({
      input: {
        products: createPlan.stockProducts as ProductTypes.CreateProductDTO[],
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
      { input, createdProducts, createPlan },
      ({ input, createdProducts, createPlan }) =>
        input.products.flatMap((p, idx) => {
          const product_id = createdProducts[idx]?.id as string
          const formOptions = (v: unknown) =>
            (v as { options?: Record<string, string> }).options ?? {}
          return (p.variants ?? []).map((v) => ({
            ...v,
            product_id,
            // Axis products bind variants purely to their axis options. Non-axis
            // products carry the seeded "Default option", so each variant must
            // cover it.
            options: createPlan.hasAxisByIndex[idx]
              ? formOptions(v)
              : { "Default option": "Default value", ...formOptions(v) },
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
