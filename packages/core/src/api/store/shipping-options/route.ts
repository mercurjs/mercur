import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { HttpTypes as MercurHttpTypes } from "@mercurjs/types"

import { listSellerShippingOptionsForCartWorkflow } from "../../../workflows"

export const GET = async (
    req: MedusaRequest<{}, HttpTypes.StoreGetShippingOptionList>,
    res: MedusaResponse<MercurHttpTypes.StoreSellerShippingOptionsResponse>
) => {
    const { cart_id, is_return } = req.filterableFields

    const { result: shipping_options } = await listSellerShippingOptionsForCartWorkflow(req.scope).run({
        input: {
            cart_id,
            is_return: !!is_return,
            fields: req.queryConfig.fields,
        },
    })

    res.json({ shipping_options })
}
