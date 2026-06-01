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
  emitEventStep,
  updateProductsWorkflow as stockUpdateProductsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  MercurModules,
  ProductAttributeInputDTO,
  UpdateProductDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"
import {
  createProductAttributesStep,
  createProductAttributeValuesStep,
} from "../../product-attribute/steps"
import { associateSellersWithProductStep } from "../steps/associate-sellers-with-product"

/** See `create-products.ts` for the rationale on this shape. */
type AttributeRef = ProductAttributeInputDTO

type ProductOptionInput = { title: string; values: string[] }

type AttributeValueLink = {
  product_id: string
  product_attribute_value_id: string
}

export type UpdateProductWorkflowUpdate = Omit<
  UpdateProductDTO,
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
      manage_inventory?: boolean
    }
  >
}

export type UpdateProductsWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductWorkflowUpdate
} & AdditionalData

export const updateProductsWorkflowId = "mercur-update-products"

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

type ResolvedRefs = {
  existing_variant: ResolvedExistingRef[]
  inline_variant: ResolvedInlineRef[]
  existing_product: ResolvedExistingRef[]
  inline_product: ResolvedInlineRef[]
}

/**
 * Same lookups as the create workflow's resolver, scoped to the single
 * update payload (selector targets are loaded later via a separate
 * step).
 */
const resolveAttributeRefsStep = createStep(
  "mercur-update-resolve-attribute-refs",
  async (input: { update: UpdateProductWorkflowUpdate }, { container }) => {
    const refsProvided =
      input.update.variant_attributes !== undefined ||
      input.update.product_attributes !== undefined
    const empty: ResolvedRefs = {
      existing_variant: [],
      inline_variant: [],
      existing_product: [],
      inline_product: [],
    }
    if (!refsProvided) return new StepResponse({ refs: empty, refsProvided })

    const attributeIds = new Set<string>()
    for (const r of [
      ...(input.update.variant_attributes ?? []),
      ...(input.update.product_attributes ?? []),
    ]) {
      if (isExistingRef(r)) attributeIds.add(r.attribute_id)
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
        if (!id) continue
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

    const refs: ResolvedRefs = {
      existing_variant: [],
      inline_variant: [],
      existing_product: [],
      inline_product: [],
    }
    for (const r of input.update.variant_attributes ?? []) {
      if (isExistingRef(r)) refs.existing_variant.push(resolveExisting(r))
      else if (isInlineRef(r))
        refs.inline_variant.push({
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
    for (const r of input.update.product_attributes ?? []) {
      if (isExistingRef(r)) refs.existing_product.push(resolveExisting(r))
      else if (isInlineRef(r))
        refs.inline_product.push({
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

    return new StepResponse({ refs, refsProvided: true })
  },
)

/**
 * Flat plan entry describing one inline-custom attribute to create.
 * Mirrors `create-products.ts`'s `InlinePlanEntry`; lives at update
 * time so we can reuse the shared `createProductAttributesStep` /
 * `createProductAttributeValuesStep` instead of a bespoke step.
 */
type InlinePlanEntry = {
  name: string
  type: AttributeType
  is_variant_axis: boolean
  is_filterable: boolean
  is_required: boolean
  description: string | null
  metadata: Record<string, unknown> | null
  product_id: string
  _product_idx: number
  _value_names: string[]
}

type ReplaceLinksRevertState = {
  removed: Array<{ product_id: string; product_attribute_value_id: string }>
}

/**
 * Replaces the `product_attribute_value_link` set for the given products
 * with `input.links`. Existing rows for the target products are dismissed
 * first so a value un-checked in the edit form actually disappears.
 *
 * Only runs when the update payload explicitly carried
 * `variant_attributes` and/or `product_attributes` (signalled by
 * `replace: true`). Without that signal the link set is preserved as-is.
 */
const replaceProductAttributeValueLinksStep = createStep(
  "mercur-replace-product-attribute-value-links",
  async (
    input: {
      replace: boolean
      product_ids: string[]
      links: AttributeValueLink[]
    },
    { container },
  ) => {
    if (!input.replace || !input.product_ids?.length) {
      return new StepResponse(undefined, {
        removed: [],
      } as ReplaceLinksRevertState)
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      create: (defs: unknown) => Promise<unknown>
      dismiss: (defs: unknown) => Promise<unknown>
    }
    // `link.list` is ambiguous when more than one link exists between
    // the two modules (Product ↔ ProductAttribute now has both the
    // value link and the read-only product-scoping link). Read the
    // existing linked values via query.graph (the joiner alias is
    // unambiguous) and then dismiss them explicitly.
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "attribute_values.id"],
      filters: { id: input.product_ids },
    })
    const existing: Array<{
      product_id: string
      product_attribute_value_id: string
    }> = []
    for (const p of products) {
      const vals =
        ((p as { attribute_values?: Array<{ id: string }> }).attribute_values ??
          []) as Array<{ id: string }>
      for (const v of vals) {
        if (v?.id)
          existing.push({
            product_id: p.id as string,
            product_attribute_value_id: v.id,
          })
      }
    }

    if (existing.length) {
      await link.dismiss(
        existing.map((row) => ({
          [Modules.PRODUCT]: { product_id: row.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: row.product_attribute_value_id,
          },
        })),
      )
    }

    if (input.links.length) {
      await link.create(
        input.links.map((l) => ({
          [Modules.PRODUCT]: { product_id: l.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: l.product_attribute_value_id,
          },
        })),
      )
    }

    return new StepResponse(undefined, {
      removed: existing,
    } as ReplaceLinksRevertState)
  },
  async (prev, { container }) => {
    const state = prev as ReplaceLinksRevertState | undefined
    if (!state?.removed?.length) return
    const link = container.resolve(ContainerRegistrationKeys.LINK) as {
      create: (defs: unknown) => Promise<unknown>
    }
    await link.create(
      state.removed.map((row) => ({
        [Modules.PRODUCT]: { product_id: row.product_id },
        [MercurModules.PRODUCT_ATTRIBUTE]: {
          product_attribute_value_id: row.product_attribute_value_id,
        },
      })),
    )
  },
)

/**
 * Marketplace wrapper over stock `updateProductsWorkflow`. Mirrors the
 * create wrapper's translation rules. `variant_attributes` /
 * `product_attributes` are UI metadata — the wrapper REPLACES the
 * `product_attribute_value_link` set for the target products with the
 * provided values (so values un-checked in the edit form go away). Inline
 * custom refs materialize a fresh product-scoped ProductAttribute on
 * each update; the UI is expected to re-send the existing `attribute_id`
 * when an inline-custom attribute round-trips back through GET.
 * Variant `manage_inventory` is pinned to `false` on every variant in
 * the payload (defensive — the marketplace invariant cannot regress
 * through a vendor patch).
 */
export const updateProductsWorkflow: any = createWorkflow(
  updateProductsWorkflowId,
  function (input: UpdateProductsWorkflowInput) {
    const resolvedAttrs = resolveAttributeRefsStep({ update: input.update })

    const stockInput = transform(
      { input, resolvedAttrs },
      ({ input, resolvedAttrs }) => {
        const {
          seller_ids: _s,
          variant_attributes: _va,
          product_attributes: _pa,
          options: rawOptions,
          variants,
          ...update
        } = input.update

        const refs = resolvedAttrs.refs
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
        const options = synthOptions.length ? synthOptions : rawOptions

        const stockVariants = variants?.map((v) => {
          const {
            manage_inventory: _mi,
            attribute_values,
            options: vopts,
            ...rest
          } = v
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
            ...rest,
            manage_inventory: false,
            ...(mapped ? { options: mapped } : {}),
          }
        })

        return {
          selector: input.selector,
          update: {
            ...update,
            ...(options?.length ? { options } : {}),
            ...(stockVariants ? { variants: stockVariants } : {}),
          },
          additional_data: input.additional_data,
        }
      },
    )

    stockUpdateProductsWorkflow.runAsStep({ input: stockInput as any })

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id"],
      filters: input.selector,
    }).config({ name: "mercur-update-products-load" })

    // Deterministic flat plan for inline-custom attributes. Downstream
    // transforms recompute the same plan from `resolvedAttrs.refs` +
    // `products`, so indices match `createdInlineAttrs` /
    // `createdInlineValues`. Empty when no inline refs were sent.
    const inlinePlan = transform(
      { resolvedAttrs, products },
      ({ resolvedAttrs, products }) => {
        if (!resolvedAttrs.refsProvided) return [] as InlinePlanEntry[]
        const refs = resolvedAttrs.refs
        const plan: InlinePlanEntry[] = []
        products.forEach((p, idx) => {
          const product_id = p.id as string
          for (const ref of refs.inline_variant) {
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
          for (const ref of refs.inline_product) {
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
      { input, products },
      ({ input, products }) => {
        if (input.update.seller_ids === undefined) return []
        const links: { product_id: string; seller_id: string }[] = []
        for (const product of products) {
          for (const seller_id of input.update.seller_ids ?? []) {
            links.push({ product_id: product.id as string, seller_id })
          }
        }
        return links
      },
    )

    associateSellersWithProductStep({ links: sellerProductLinks }).config({
      name: "mercur-update-products-associate-sellers",
    })

    const linkReplaceInput = transform(
      { resolvedAttrs, products, inlinePlan, createdInlineValues },
      ({ resolvedAttrs, products, inlinePlan, createdInlineValues }) => {
        if (!resolvedAttrs.refsProvided) {
          return { replace: false, product_ids: [], links: [] }
        }
        const refs = resolvedAttrs.refs
        const links: AttributeValueLink[] = []

        // Existing-attribute refs already carry resolved value ids.
        products.forEach((p) => {
          const product_id = p.id as string
          for (const ref of refs.existing_variant)
            for (const vid of ref.value_ids)
              links.push({ product_id, product_attribute_value_id: vid })
          for (const ref of refs.existing_product)
            for (const vid of ref.value_ids)
              links.push({ product_id, product_attribute_value_id: vid })
        })

        // Inline values come back as a flat array; slice by the plan's
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

        return {
          replace: true,
          product_ids: products.map((p) => p.id as string),
          links,
        }
      },
    )

    ;(replaceProductAttributeValueLinksStep(linkReplaceInput) as any).config({
      name: "mercur-update-products-replace-attribute-value-links",
    })

    const productsUpdated = createHook("productsUpdated", {
      products,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: "product.updated",
      data: transform({ products }, ({ products }) =>
        products.map((p) => ({ id: p.id })),
      ),
    })

    return new WorkflowResponse(products, {
      hooks: [productsUpdated],
    })
  },
)
