import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { batchVariantImagesWorkflow } from "@medusajs/medusa/core-flows";
import { VendorBatchVariantImagesType } from "../../../../validators";

export const POST = async (
    req: AuthenticatedMedusaRequest<VendorBatchVariantImagesType>,
    res: MedusaResponse
  ) => {
    const variantId = req.params.variant_id

    const { result } = await batchVariantImagesWorkflow(req.scope).run({
      input: {
        variant_id: variantId,
        add: req.validatedBody.add,
        remove: req.validatedBody.remove,
      },
    })

    res.status(200).json({
      added: result.added,
      removed: result.removed,
    })
  }