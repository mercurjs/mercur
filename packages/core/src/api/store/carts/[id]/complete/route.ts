import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This endpoint is not supported. Please use POST /store/carts/:id/checkout instead."
    )
}
