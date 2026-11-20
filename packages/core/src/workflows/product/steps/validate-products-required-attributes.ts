import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeScope } from "@mercurjs/types"

export type ValidateProductsRequiredAttributesStepInput = {
  product_ids: string[]
  category_ids_by_product?: Record<string, string[]>
}

type IdRef = { id?: string | null }

// The remote joiner returns a single object instead of an array when there is
// exactly one linked row.
const toList = <T>(raw: T | T[] | null | undefined): T[] =>
  Array.isArray(raw) ? raw : raw ? [raw] : []

const ids = (raw: IdRef | IdRef[] | null | undefined) =>
  toList(raw)
    .map((ref) => ref?.id)
    .filter((id): id is string => !!id)

/**
 * A required attribute applies to a product when it is linked to one of the
 * product's categories, or linked to no category at all. Products without a
 * category are not checked, matching the panels' missing-attribute hints.
 */
export const assertProductsHaveRequiredAttributes = async (
  container: MedusaContainer,
  input: ValidateProductsRequiredAttributesStepInput,
) => {
  if (!input.product_ids.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "categories.id",
      "product_attribute_values.attribute.id",
    ],
    filters: { id: input.product_ids },
  })

  const categoryIdsByProduct = new Map<string, string[]>(
    products.map((product) => [
      product.id,
      input.category_ids_by_product?.[product.id] ??
        ids(product.categories as IdRef[] | null),
    ]),
  )

  if (![...categoryIdsByProduct.values()].some((c) => c.length)) {
    return
  }

  const { data: requiredAttributes } = await query.graph({
    entity: "product_attribute",
    fields: ["id", "name", "categories.id"],
    filters: {
      is_required: true,
      is_active: true,
      scope: AttributeScope.PRODUCT,
      product_id: null,
    },
  })

  if (!requiredAttributes.length) {
    return
  }

  const missingByProduct: string[] = []

  for (const product of products) {
    const categoryIds = new Set(categoryIdsByProduct.get(product.id) ?? [])
    if (!categoryIds.size) {
      continue
    }

    const attached = new Set(
      toList(
        product.product_attribute_values as
          | { attribute?: IdRef | null }[]
          | null,
      )
        .map((value) => value?.attribute?.id)
        .filter((id): id is string => !!id),
    )

    const missing = requiredAttributes.filter((attribute) => {
      if (attached.has(attribute.id)) {
        return false
      }
      const linked = ids(attribute.categories as IdRef[] | null)
      return !linked.length || linked.some((id) => categoryIds.has(id))
    })

    if (missing.length) {
      missingByProduct.push(
        `${product.title ?? product.id} (${missing
          .map((attribute) => attribute.name)
          .join(", ")})`,
      )
    }
  }

  if (missingByProduct.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Cannot publish product(s) missing required attributes: ${missingByProduct.join(
        "; ",
      )}.`,
    )
  }
}

export const validateProductsRequiredAttributesStepId =
  "validate-products-required-attributes"

export const validateProductsRequiredAttributesStep = createStep(
  validateProductsRequiredAttributesStepId,
  async (input: ValidateProductsRequiredAttributesStepInput, { container }) => {
    await assertProductsHaveRequiredAttributes(container, input)
    return new StepResponse(void 0)
  },
)
