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

    // Stock create hard-requires ≥1 option, so every product is seeded with a
    // placeholder "Default option". For axis products that placeholder is
    // dropped again below — once the real axis options are attached it is dead
    // weight that would inflate every variant's required option set and break
    // later variant edits (SPEC-014). Non-axis products keep it so their
    // variants (and the product) still have an option to bind to.
    const stockProducts = transform({ input }, ({ input }) =>
      input.products.map((p) => {
        const { attributes: _attributes, variants: _variants, ...rest } = p
        return {
          ...rest,
          options: [{ title: "Default option", values: ["Default value"] }],
        }
      }),
    )

    // Per-product flag: does it carry at least one variant axis? (Inline axes
    // are self-describing; existing refs are resolved via `referencedAttrs`.)
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

    // Drop the seeded "Default option" from axis products now that their real
    // axis options are attached, BEFORE variants are created — so the default
    // never has a variant bound to it and the product's only options are its
    // axes. `createdProducts` carries the freshly-created option (the default is
    // the only option at create time), so its id is read straight off the
    // result without an extra query.
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
            (o) => o.title === "Default option",
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

    // Now that options exist on each product, create the variants — their
    // `options` name-map binds to the freshly attached option values.
    const productVariants = transform(
      { input, createdProducts, hasAxisByIndex },
      ({ input, createdProducts, hasAxisByIndex }) =>
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
            options: hasAxisByIndex[idx]
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
