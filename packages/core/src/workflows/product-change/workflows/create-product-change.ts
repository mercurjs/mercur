import { Modules } from "@medusajs/framework/utils"
import { AdditionalData, LinkDefinition } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateProductChangeDTO,
  MercurModules,
  ProductChangeDTO,
} from "@mercurjs/types"

import { ProductChangeWorkflowEvents } from "../events"
import {
  createProductChangeStep,
  validateNoPendingProductChangeStep,
} from "../steps"

export type CreateProductChangeWorkflowInput = {
  changes: CreateProductChangeDTO[]
} & AdditionalData

export type CreateProductChangeWorkflowHooks = [
  Hook<"validate", { input: CreateProductChangeWorkflowInput }, unknown>,
  Hook<
    "productChangeCreated",
    {
      changes: ProductChangeDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createProductChangeWorkflowId = "create-product-change"

export const createProductChangeWorkflow: ReturnWorkflow<
  CreateProductChangeWorkflowInput,
  ProductChangeDTO[],
  CreateProductChangeWorkflowHooks
> = createWorkflow(
  createProductChangeWorkflowId,
  function (input: CreateProductChangeWorkflowInput) {
    const validate = createHook("validate", { input })

    const productIds = transform({ input }, ({ input }) =>
      Array.from(new Set(input.changes.map((c) => c.product_id))),
    )

    validateNoPendingProductChangeStep({ product_ids: productIds })

    const changesToCreate = transform({ input }, ({ input }) =>
      input.changes.map(({ product_id: _product_id, ...rest }) => rest),
    )

    const changes = createProductChangeStep(changesToCreate)

    const productChangeLinks = transform(
      { input, changes },
      ({ input, changes }) => {
        const links: LinkDefinition[] = []
        input.changes.forEach((c, idx) => {
          links.push({
            [Modules.PRODUCT]: { product_id: c.product_id },
            [MercurModules.PRODUCT_CHANGE]: {
              product_change_id: changes[idx].id,
            },
          })
        })
        return links
      },
    )

    createRemoteLinkStep(productChangeLinks).config({
      name: "pc-create-product-change-links",
    })

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.CREATED,
      data: transform({ changes }, ({ changes }) =>
        changes.map((c) => ({ id: c.id })),
      ),
    })

    const productChangeCreated = createHook("productChangeCreated", {
      changes,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(changes as ProductChangeDTO[], {
      hooks: [validate, productChangeCreated],
    })
  },
)
