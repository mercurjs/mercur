import { AdditionalData } from "@medusajs/framework/types"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  MercurModules,
  ProductAttributeValueDTO,
  UpsertProductAttributeValueDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export type UpsertProductAttributeValuesWorkflowInput = {
  attribute_id: string
  values: UpsertProductAttributeValueDTO[]
} & AdditionalData

const upsertProductAttributeValuesStepId = "pa-upsert-product-attribute-values"

type UpsertStepInput = (UpsertProductAttributeValueDTO & {
  attribute_id: string
})[]

/**
 * Upserts attribute values (create rows without `id`, update rows with `id`).
 * Catalog CRUD — the mirror option is kept in sync for value create/delete by
 * the dedicated value workflows; rename-in-place mirror sync is a known gap.
 */
const upsertProductAttributeValuesStep = createStep(
  upsertProductAttributeValuesStepId,
  async (data: UpsertStepInput, { container }) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const toCreate = data.filter((v) => !v.id)
    const toUpdate = data.filter((v) => !!v.id)

    const created = toCreate.length
      ? await service.createProductAttributeValues(toCreate)
      : []
    const updated = toUpdate.length
      ? await service.updateProductAttributeValues(toUpdate)
      : []

    return new StepResponse([...created, ...updated])
  },
)

export const upsertProductAttributeValuesWorkflowId =
  "upsert-product-attribute-values"

export const upsertProductAttributeValuesWorkflow = createWorkflow(
  upsertProductAttributeValuesWorkflowId,
  function (input: UpsertProductAttributeValuesWorkflowInput) {
    const rows = transform({ input }, ({ input }) =>
      input.values.map((v) => ({ ...v, attribute_id: input.attribute_id })),
    )

    const values = upsertProductAttributeValuesStep(rows)

    return new WorkflowResponse(values as ProductAttributeValueDTO[])
  },
)
