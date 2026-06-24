import { AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  CreateProductChangeActionDTO,
  ProductChangeActionType,
  ProductChangeDTO,
} from "@mercurjs/types"

import { validateNoPendingProductChangeStep } from "../steps"
import { stageProductChangeWorkflow } from "./stage-product-change"

export type ProductEditVariantAddOperation = {
  type: "add"
  variant: Record<string, unknown>
}

export type ProductEditVariantUpdateOperation = {
  type: "update"
  variant_id: string
  fields: Record<string, unknown>
}

export type ProductEditVariantRemoveOperation = {
  type: "remove"
  variant_id: string
}

export type ProductEditVariantOperation =
  | ProductEditVariantAddOperation
  | ProductEditVariantUpdateOperation
  | ProductEditVariantRemoveOperation

export type ProductEditUpdateVariantsWorkflowInput = {
  product_id: string
  created_by?: string
  operations: ProductEditVariantOperation[]
} & AdditionalData

export const productEditUpdateVariantsWorkflowId =
  "product-edit-update-variants"

const NON_EDITABLE_VARIANT_FIELDS = new Set(["manage_inventory"])

export const productEditUpdateVariantsWorkflow: ReturnWorkflow<
  ProductEditUpdateVariantsWorkflowInput,
  ProductChangeDTO,
  []
> = createWorkflow(
  productEditUpdateVariantsWorkflowId,
  function (input: ProductEditUpdateVariantsWorkflowInput) {
    validateNoPendingProductChangeStep(
      transform({ input }, ({ input }) => ({
        product_ids: [input.product_id],
      })),
    )

    const variantIdsToLoad = transform({ input }, ({ input }) =>
      Array.from(
        new Set(
          (input.operations ?? [])
            .filter(
              (
                op,
              ): op is {
                type: "update"
                variant_id: string
                fields: Record<string, unknown>
              } => op.type === "update",
            )
            .map((op) => op.variant_id),
        ),
      ),
    )

    const { data: currentVariants } = useQueryGraphStep({
      entity: "variant",
      fields: [
        "id",
        "title",
        "sku",
        "ean",
        "upc",
        "isbn",
        "barcode",
        "hs_code",
        "mid_code",
        "manage_inventory",
        "allow_backorder",
        "weight",
        "length",
        "height",
        "width",
        "origin_country",
        "material",
        "variant_rank",
        "metadata",
        "options.value",
        "options.option.title",
      ],
      filters: { id: variantIdsToLoad },
    }).config({ name: "pc-load-variants-for-diff" })

    const actions = transform(
      { input, currentVariants },
      ({ input, currentVariants }) => {
        const acts: Array<
          Omit<CreateProductChangeActionDTO, "product_change_id">
        > = []

        const currentVariantsById = new Map<
          string,
          Record<string, unknown>
        >()
        for (const v of (currentVariants ?? []) as Array<
          Record<string, unknown> & { id: string }
        >) {
          currentVariantsById.set(v.id, v)
        }

        const normalize = (value: unknown): unknown => {
          if (Array.isArray(value)) {
            return value
              .map((item) => {
                if (item && typeof item === "object" && "id" in item) {
                  return (item as { id: string }).id
                }
                if (item && typeof item === "object" && "url" in item) {
                  return (item as { url: string }).url
                }
                return item
              })
              .sort()
          }
          return value ?? null
        }

        const isEqual = (a: unknown, b: unknown): boolean =>
          JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))

        const toOptionsMap = (value: unknown): Record<string, string> => {
          const out: Record<string, string> = {}
          if (Array.isArray(value)) {
            for (const entry of value) {
              const title = (entry as { option?: { title?: string } })?.option
                ?.title
              if (title) {
                out[title] = String(
                  (entry as { value?: unknown })?.value ?? "",
                )
              }
            }
          } else if (value && typeof value === "object") {
            for (const [k, v] of Object.entries(
              value as Record<string, unknown>,
            )) {
              out[k] = String(v ?? "")
            }
          }
          return out
        }

        const optionsEqual = (
          a: Record<string, string>,
          b: Record<string, string>,
        ): boolean => {
          const stable = (m: Record<string, string>) =>
            JSON.stringify(
              Object.keys(m)
                .sort()
                .map((k) => [k, m[k]]),
            )
          return stable(a) === stable(b)
        }

        for (const op of input.operations ?? []) {
          switch (op.type) {
            case "add":
              acts.push({
                product_id: input.product_id,
                action: ProductChangeActionType.VARIANT_ADD,
                details: { variant: op.variant },
              })
              break
            case "update": {
              const current = currentVariantsById.get(op.variant_id) ?? {}
              const changedFields: Record<string, unknown> = {}
              const previousFields: Record<string, unknown> = {}
              for (const [field, proposedValue] of Object.entries(
                op.fields ?? {},
              )) {
                if (NON_EDITABLE_VARIANT_FIELDS.has(field)) continue

                if (field === "options") {
                  if (proposedValue === undefined) continue
                  const currentOptions = toOptionsMap(current.options)
                  if (optionsEqual(currentOptions, toOptionsMap(proposedValue)))
                    continue
                  changedFields.options = proposedValue
                  previousFields.options = currentOptions
                  continue
                }

                if (field === "images") {
                  if (proposedValue !== undefined) {
                    changedFields.images = proposedValue
                  }
                  continue
                }

                if (isEqual(current[field], proposedValue)) continue

                changedFields[field] = proposedValue
                previousFields[field] = current[field] ?? null
              }

              if (!Object.keys(changedFields).length) break

              acts.push({
                product_id: input.product_id,
                action: ProductChangeActionType.VARIANT_UPDATE,
                details: {
                  variant_id: op.variant_id,
                  fields: changedFields,
                  previous_fields: previousFields,
                },
              })
              break
            }
            case "remove":
              acts.push({
                product_id: input.product_id,
                action: ProductChangeActionType.VARIANT_REMOVE,
                details: { variant_id: op.variant_id },
              })
              break
          }
        }

        return acts
      },
    )

    const change = stageProductChangeWorkflow.runAsStep({
      input: transform({ input, actions }, ({ input, actions }) => ({
        product_id: input.product_id,
        created_by: input.created_by,
        actions,
      })),
    })

    return new WorkflowResponse(change)
  },
)
