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
  removeProductOptionsFromProductStep,
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
  products: (CreateProductDTO & { seller_ids?: string[] })[]
  created_by: string
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

    // Stock create hard-requires ≥1 option, but a product's real axis option is
    // only attached after the row exists. So every product is born with this
    // internal placeholder, which `defaultOptionRemovals` strips once a real
    // option is present (axis products) and which is kept for genuinely
    // axis-less products.
    const stockProducts = transform({ input }, ({ input }) =>
      input.products.map((p) => {
        const {
          attributes: _attributes,
          variants: _variants,
          seller_ids: _seller_ids,
          ...rest
        } = p
        return {
          ...rest,
          options: [{ title: "__default__", values: ["__default__"] }],
        }
      }),
    )

    const hasAxisByIndex = transform(
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

        return input.products.map((p) =>
          (p.attributes ?? []).some((r) =>
            "id" in r
              ? axisIds.has(r.id)
              : (r as { is_variant_axis?: boolean }).is_variant_axis === true,
          ),
        )
      },
    )

    const createdProducts = stockCreateProductsWorkflow.runAsStep({
      input: {
        products: stockProducts as ProductTypes.CreateProductDTO[],
        additional_data: input.additional_data,
      },
    })

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

    const defaultOptionRemovals = transform(
      { hasAxisByIndex, createdProducts },
      ({ hasAxisByIndex, createdProducts }) => {
        const pairs: { product_id: string; product_option_id: string }[] = []
        ;(
          createdProducts as {
            id: string
            options?: { id: string; title: string }[]
          }[]
        ).forEach((p, i) => {
          if (!hasAxisByIndex[i]) {
            return
          }
          const def = (p.options ?? []).find(
            (o) => o.title === "__default__",
          )
          if (def) {
            pairs.push({ product_id: p.id, product_option_id: def.id })
          }
        })
        return pairs
      },
    )

    when(
      { defaultOptionRemovals },
      ({ defaultOptionRemovals }) => defaultOptionRemovals.length > 0,
    ).then(() => removeProductOptionsFromProductStep(defaultOptionRemovals))

    const productVariants = transform(
      { input, createdProducts, hasAxisByIndex },
      ({ input, createdProducts, hasAxisByIndex }) =>
        input.products.flatMap((p, idx) => {
          const product_id = createdProducts[idx]?.id as string
          const formOptions = (v: unknown) =>
            (v as { options?: Record<string, string> }).options ?? {}
          return (p.variants ?? []).map((v) => ({
            manage_inventory: false,
            ...v,
            product_id,
            options: hasAxisByIndex[idx]
              ? formOptions(v)
              : { __default__: "__default__", ...formOptions(v) },
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
          for (const seller_id of p.seller_ids ?? []) {
            links.push({ product_id, seller_id })
          }
        })
        return links
      },
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-create-products-associate-sellers",
    })

    recordProductAuditChangeWorkflow.runAsStep({
      input: transform(
        { createdProducts, input },
        ({ createdProducts, input }) => ({
          actor_id: input.created_by,
          changes: createdProducts.map((product) => ({
            product_id: product.id as string,
            actions: [
              {
                product_id: product.id as string,
                action: ProductChangeActionType.PRODUCT_ADD,
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
