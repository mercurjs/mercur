import {
  createHook,
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  createProductsWorkflow as stockCreateProductsWorkflow,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  CreateProductDTO,
  MercurModules,
  ProductAttributeInputDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"
import {
  createProductAttributesStep,
  createProductAttributeValuesStep,
} from "../../product-attribute/steps"
import { associateSellersWithProductStep } from "../steps/associate-sellers-with-product"

/**
 * Two-shape UI-facing attribute reference (matches
 * `packages/types/src/product/mutations.ts::ProductAttributeInputDTO`):
 *
 *   1. **Existing reference** — `{ attribute_id, value_ids?, values? }`.
 *      Resolves to a pre-created `ProductAttribute`. `value_ids` are
 *      `ProductAttributeValue` ids; `values` are value names looked up
 *      against the attribute (only meaningful for text/unit/toggle).
 *
 *   2. **Inline custom** — `{ name, type, values, is_variant_axis? }`.
 *      Materializes a new `ProductAttribute` scoped to the product being
 *      created (`product_id = <createdProductId>`). For variant axes the
 *      wrapper also synthesizes the matching stock `options` entry.
 *
 * For variant-axis entries (existing OR inline) the wrapper feeds stock
 * Medusa a `options[]` array so its variant generator can produce
 * variants exactly as before. Product-attribute-value links are written
 * alongside as a UI-side metadata layer so the edit form remembers which
 * values were picked.
 */
type AttributeRef = ProductAttributeInputDTO

type ProductOptionInput = { title: string; values: string[] }

type AttributeValueLink = {
  product_id: string
  product_attribute_value_id: string
}

/** Per-product input on the create wrapper. */
export type CreateProductWorkflowInput = Omit<
  CreateProductDTO,
  "variant_attributes" | "product_attributes" | "variants"
> & {
  variant_attributes?: AttributeRef[]
  product_attributes?: AttributeRef[]
  seller_ids?: string[]
  options?: ProductOptionInput[]
  variants?: Array<
    Record<string, unknown> & {
      options?: Record<string, string>
      attribute_values?: Record<string, string | string[]> | string[]
    }
  >
}

export type CreateProductsWorkflowInput = {
  products: CreateProductWorkflowInput[]
  /**
   * Marketplace add-on: seller ids to authorize for **every** created
   * product. For per-product seller authorization, set `seller_ids` on
   * the individual product entry instead.
   */
  seller_ids?: string[]
} & AdditionalData

export const createProductsWorkflowId = "mercur-create-products"

const DEFAULT_OPTION_TITLE = "Default option"
const DEFAULT_OPTION_VALUE = "Default option value"

const isExistingRef = (
  r: AttributeRef,
): r is Extract<AttributeRef, { attribute_id: string }> =>
  (r as { attribute_id?: string }).attribute_id !== undefined

const isInlineRef = (
  r: AttributeRef,
): r is Extract<AttributeRef, { name: string }> =>
  (r as { name?: string }).name !== undefined

type ResolvedExistingRef = {
  attribute_id: string
  attribute_name: string
  is_variant_axis: boolean
  value_ids: string[]
  value_names: string[]
}

type ResolvedInlineRef = {
  name: string
  type: AttributeType
  is_variant_axis: boolean
  values: string[]
  is_filterable?: boolean
  is_required?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
}

type ResolvedProductRefs = {
  existing_variant: ResolvedExistingRef[]
  inline_variant: ResolvedInlineRef[]
  existing_product: ResolvedExistingRef[]
  inline_product: ResolvedInlineRef[]
}

/**
 * Resolves every `attribute_id` in the input by looking up the parent
 * attribute (name) and its values, so the transform stage can synthesize
 * stock `options[]` entries with real value names. Also resolves
 * `values` (names) → `value_ids` for refs that didn't pre-resolve ids.
 * Read-only step — no compensation needed.
 */
const resolveAttributeRefsStep = createStep(
  "mercur-resolve-attribute-refs",
  async (
    input: { products: CreateProductWorkflowInput[] },
    { container },
  ) => {
    const attributeIds = new Set<string>()
    for (const p of input.products) {
      for (const r of [
        ...(p.variant_attributes ?? []),
        ...(p.product_attributes ?? []),
      ]) {
        if (isExistingRef(r)) attributeIds.add(r.attribute_id)
      }
    }

    let attrsById = new Map<
      string,
      {
        id: string
        name: string
        is_variant_axis: boolean
        values: { id: string; name: string }[]
      }
    >()
    if (attributeIds.size) {
      const service = container.resolve<ProductAttributeModuleService>(
        MercurModules.PRODUCT_ATTRIBUTE,
      )
      const attrs = await service.listProductAttributes(
        { id: Array.from(attributeIds) },
        {
          relations: ["values"],
          select: ["id", "name", "is_variant_axis"],
        },
      )
      attrsById = new Map(
        attrs.map((a) => [
          a.id,
          {
            id: a.id,
            name: a.name,
            is_variant_axis: !!a.is_variant_axis,
            values: (a.values ?? []).map((v) => ({ id: v.id, name: v.name })),
          },
        ]),
      )
    }

    const resolveExisting = (
      ref: Extract<AttributeRef, { attribute_id: string }>,
    ): ResolvedExistingRef => {
      const attr = attrsById.get(ref.attribute_id)
      if (!attr) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product attribute ${ref.attribute_id} not found`,
        )
      }

      const idToName = new Map(attr.values.map((v) => [v.id, v.name]))
      const nameToId = new Map(attr.values.map((v) => [v.name, v.id]))

      const value_ids: string[] = []
      const value_names: string[] = []

      for (const id of ref.value_ids ?? []) {
        const name = idToName.get(id)
        if (!name) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Product attribute value ${id} not found on attribute ${ref.attribute_id}`,
          )
        }
        value_ids.push(id)
        value_names.push(name)
      }
      for (const name of ref.values ?? []) {
        const id = nameToId.get(name)
        if (!id) {
          // Skip — text/unit values can be free-form and will be upserted
          // later, but for select types we only accept known names.
          continue
        }
        if (!value_ids.includes(id)) {
          value_ids.push(id)
          value_names.push(name)
        }
      }

      return {
        attribute_id: ref.attribute_id,
        attribute_name: attr.name,
        is_variant_axis: attr.is_variant_axis,
        value_ids,
        value_names,
      }
    }

    const perProduct: ResolvedProductRefs[] = input.products.map((p) => {
      const out: ResolvedProductRefs = {
        existing_variant: [],
        inline_variant: [],
        existing_product: [],
        inline_product: [],
      }

      for (const r of p.variant_attributes ?? []) {
        if (isExistingRef(r)) out.existing_variant.push(resolveExisting(r))
        else if (isInlineRef(r))
          out.inline_variant.push({
            name: r.name,
            type: r.type,
            is_variant_axis: true,
            values: r.values ?? [],
            is_filterable: r.is_filterable,
            is_required: r.is_required,
            description: r.description,
            metadata: r.metadata,
          })
      }
      for (const r of p.product_attributes ?? []) {
        if (isExistingRef(r)) out.existing_product.push(resolveExisting(r))
        else if (isInlineRef(r))
          out.inline_product.push({
            name: r.name,
            type: r.type,
            is_variant_axis: r.is_variant_axis ?? false,
            values: r.values ?? [],
            is_filterable: r.is_filterable,
            is_required: r.is_required,
            description: r.description,
            metadata: r.metadata,
          })
      }
      return out
    })

    return new StepResponse(perProduct)
  },
)

/**
 * Writes `product_attribute_value_link` rows. Done as a step so the
 * workflow can pass a runtime-derived array of links.
 */
const linkProductAttributeValuesStep = createStep(
  "mercur-link-product-attribute-values",
  async (input: { links: AttributeValueLink[] }, { container }) => {
    if (!input.links?.length) return new StepResponse([], [])
    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      create: (defs: unknown) => Promise<unknown>
      dismiss: (defs: unknown) => Promise<unknown>
    }
    const definitions = input.links.map((l) => ({
      [Modules.PRODUCT]: { product_id: l.product_id },
      [MercurModules.PRODUCT_ATTRIBUTE]: {
        product_attribute_value_id: l.product_attribute_value_id,
      },
    }))
    const created = await link.create(definitions)
    return new StepResponse(created, definitions)
  },
  async (definitions, { container }) => {
    if (!Array.isArray(definitions) || !definitions.length) return
    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      dismiss: (defs: unknown) => Promise<unknown>
    }
    await link.dismiss(definitions)
  },
)

/**
 * Flat plan entry describing one inline-custom attribute to materialize.
 * Carries enough context to (a) feed the existing
 * `createProductAttributesStep` and (b) reconstruct per-product /
 * per-ref mapping for the value-link step downstream.
 */
type InlinePlanEntry = {
  // Inputs for `createProductAttributesStep`:
  name: string
  type: AttributeType
  is_variant_axis: boolean
  is_filterable: boolean
  is_required: boolean
  description: string | null
  metadata: Record<string, unknown> | null
  product_id: string
  // Reconstruction metadata (NOT passed to the create step):
  _product_idx: number
  _value_names: string[]
}

/**
 * Marketplace wrapper over stock `createProductsWorkflow`.
 *
 * On top of stock it:
 *   1. Resolves `variant_attributes` / `product_attributes` (existing
 *      attribute lookups, value name ↔ id resolution).
 *   2. Synthesizes stock `options[]` from variant-axis attributes (both
 *      existing and inline) — UI doesn't have to emit a parallel
 *      `options` field.
 *   3. Renames `variants[].attribute_values` (the Mercur extension —
 *      `{Size: "S"}` name map) to `variants[].options` so stock variant
 *      generation works unchanged.
 *   4. Strips marketplace-only fields before delegating to stock.
 *   5. Pins every variant's `manage_inventory` to `false` (marketplace
 *      invariant — vendor variants never participate in inventory
 *      bookkeeping).
 *   6. Synthesizes a default option + variant for simple products so
 *      stock's variant validator does not throw.
 *   7. After stock returns, materialises inline-custom attributes via
 *      the shared `createProductAttributesStep` + their values via
 *      `createProductAttributeValuesStep` (scoped to the created
 *      product through the `product_id` FK).
 *   8. Writes `product_attribute_value_link` rows for every chosen value
 *      (existing + inline) so the edit form can pre-select them.
 *   9. Writes `product_seller` link rows for the requested seller_ids.
 */
export const createProductsWorkflow: any = createWorkflow(
  createProductsWorkflowId,
  function (input: CreateProductsWorkflowInput) {
    const validate = createHook("validate", {
      input,
      products: input.products,
    })

    const resolved = resolveAttributeRefsStep({ products: input.products })

    const stockProducts = transform(
      { input, resolved },
      ({ input, resolved }) =>
        input.products.map((p, idx) => {
          const {
            seller_ids: _s,
            variant_attributes: _va,
            product_attributes: _pa,
            options: rawOptions,
            variants,
            ...rest
          } = p

          // Build synthetic options from variant-axis attribute refs.
          const refs = resolved[idx]
          const synthOptions: ProductOptionInput[] = [
            ...refs.existing_variant.map((r) => ({
              title: r.attribute_name,
              values: r.value_names,
            })),
            ...refs.inline_variant.map((r) => ({
              title: r.name,
              values: r.values,
            })),
          ]
          const options = synthOptions.length ? synthOptions : (rawOptions ?? [])

          // Rename variants[].attribute_values → variants[].options if it
          // came in as a name-map. Array-of-ids form is left alone (stock
          // ignores it; the variant-attribute link layer is not in scope).
          const stockVariants = (variants ?? []).map((v) => {
            const { attribute_values, options: vopts, ...vrest } = v
            const mapped =
              vopts ??
              (attribute_values && !Array.isArray(attribute_values)
                ? Object.fromEntries(
                    Object.entries(attribute_values).map(([k, val]) => [
                      k,
                      Array.isArray(val) ? val[0] : val,
                    ]),
                  )
                : undefined)
            return {
              ...vrest,
              manage_inventory: false,
              ...(mapped ? { options: mapped } : {}),
            }
          })

          if (!options.length && !stockVariants.length) {
            return {
              ...rest,
              options: [
                { title: DEFAULT_OPTION_TITLE, values: [DEFAULT_OPTION_VALUE] },
              ],
              variants: [
                {
                  title: "Default variant",
                  manage_inventory: false,
                  options: {
                    [DEFAULT_OPTION_TITLE]: DEFAULT_OPTION_VALUE,
                  },
                },
              ],
            }
          }

          return {
            ...rest,
            ...(options.length ? { options } : {}),
            ...(stockVariants.length ? { variants: stockVariants } : {}),
          }
        }),
    )

    const createdProducts = stockCreateProductsWorkflow.runAsStep({
      input: {
        products: stockProducts as any,
        additional_data: input.additional_data,
      },
    })

    // Deterministic flat plan for inline-custom attributes. Iteration
    // order is: per-product → variant inline refs → product inline refs.
    // Downstream transforms recompute the same plan from `resolved` +
    // `createdProducts`, so the indices line up with
    // `createdInlineAttrs` / `createdInlineValues`.
    const inlinePlan = transform(
      { resolved, createdProducts },
      ({ resolved, createdProducts }) => {
        const plan: InlinePlanEntry[] = []
        resolved.forEach((r, idx) => {
          const product_id = createdProducts[idx]?.id as string | undefined
          if (!product_id) return
          for (const ref of r.inline_variant) {
            plan.push({
              name: ref.name,
              type: ref.type,
              is_variant_axis: true,
              is_filterable: ref.is_filterable ?? false,
              is_required: ref.is_required ?? false,
              description: ref.description ?? null,
              metadata: ref.metadata ?? null,
              product_id,
              _product_idx: idx,
              _value_names: ref.values,
            })
          }
          for (const ref of r.inline_product) {
            plan.push({
              name: ref.name,
              type: ref.type,
              is_variant_axis: ref.is_variant_axis,
              is_filterable: ref.is_filterable ?? false,
              is_required: ref.is_required ?? false,
              description: ref.description ?? null,
              metadata: ref.metadata ?? null,
              product_id,
              _product_idx: idx,
              _value_names: ref.values,
            })
          }
        })
        return plan
      },
    )

    const inlineAttributesToCreate = transform(
      { inlinePlan },
      ({ inlinePlan }) =>
        inlinePlan.map(({ _product_idx, _value_names, ...attr }) => attr),
    )

    // Reuses the shared `createProductAttributesStep` (compensation
    // deletes the created attributes on rollback).
    const createdInlineAttrs = createProductAttributesStep(
      inlineAttributesToCreate,
    )

    const inlineValuesToCreate = transform(
      { inlinePlan, createdInlineAttrs },
      ({ inlinePlan, createdInlineAttrs }) => {
        const out: { name: string; attribute_id: string }[] = []
        inlinePlan.forEach((p, i) => {
          const attribute_id = createdInlineAttrs[i]?.id as string | undefined
          if (!attribute_id) return
          for (const name of p._value_names) out.push({ name, attribute_id })
        })
        return out
      },
    )

    // Reuses the shared `createProductAttributeValuesStep` (compensation
    // deletes the created values on rollback).
    const createdInlineValues = createProductAttributeValuesStep(
      inlineValuesToCreate,
    )

    const sellerProductLinks = transform(
      { input, createdProducts },
      ({ input, createdProducts }) => {
        const links: { product_id: string; seller_id: string }[] = []
        input.products.forEach((p, idx) => {
          const product_id = createdProducts[idx]?.id
          if (!product_id) return
          const sellerIds = p.seller_ids ?? input.seller_ids ?? []
          for (const seller_id of sellerIds) {
            links.push({ product_id, seller_id })
          }
        })
        return links
      },
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-create-products-associate-sellers",
    })

    const attributeValueLinks = transform(
      { createdProducts, resolved, inlinePlan, createdInlineValues },
      ({ createdProducts, resolved, inlinePlan, createdInlineValues }) => {
        const links: AttributeValueLink[] = []

        // Existing-attribute refs already carry resolved value ids.
        createdProducts.forEach((p, idx) => {
          const product_id = p.id as string
          if (!product_id) return
          const r = resolved[idx]
          for (const ref of r.existing_variant)
            for (const vid of ref.value_ids)
              links.push({ product_id, product_attribute_value_id: vid })
          for (const ref of r.existing_product)
            for (const vid of ref.value_ids)
              links.push({ product_id, product_attribute_value_id: vid })
        })

        // Inline values come back as a flat array; slice it by the plan's
        // declared value counts to pair them with the right product.
        let valueCursor = 0
        for (const entry of inlinePlan) {
          const count = entry._value_names.length
          const slice = createdInlineValues.slice(
            valueCursor,
            valueCursor + count,
          )
          valueCursor += count
          for (const v of slice) {
            links.push({
              product_id: entry.product_id,
              product_attribute_value_id: v.id as string,
            })
          }
        }

        return links
      },
    )

    linkProductAttributeValuesStep({ links: attributeValueLinks }).config({
      name: "mercur-create-products-attribute-value-links",
    })

    const productsCreated = createHook("productsCreated", {
      products: createdProducts,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: "product.created",
      data: transform({ createdProducts }, ({ createdProducts }) =>
        createdProducts.map((p) => ({ id: p.id })),
      ),
    })

    return new WorkflowResponse(createdProducts, {
      hooks: [validate, productsCreated] as const,
    })
  },
)
