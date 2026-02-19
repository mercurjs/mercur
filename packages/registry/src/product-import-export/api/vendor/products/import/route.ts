import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { importSellerProductsWorkflow } from "../../../../workflows/import-seller-products"
import { fetchSellerByAuthActorId } from "../helpers/helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<{ file: Express.Multer.File }>,
  res: MedusaResponse<{ summary: { created: number } }>
) => {
  const file = (req as any).file as Express.Multer.File | undefined

  if (!file) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No file uploaded. Please upload a CSV file."
    )
  }

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  if (!seller) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Seller not found for the current user."
    )
  }

  const fileContent = file.buffer.toString("utf-8")

  const { result } = await importSellerProductsWorkflow(req.scope).run({
    input: {
      file_content: fileContent,
      seller_id: seller.id,
    },
  })

  res.status(200).json({
    summary: {
      created: Array.isArray(result) ? result.length : 0,
    },
  })
}
