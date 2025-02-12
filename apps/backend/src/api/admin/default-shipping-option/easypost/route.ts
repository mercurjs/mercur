import { getEasyPostOptions } from '#/workflows/default-shipping-options/workflows'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

// TODO OAS to be fixed
/**
 * @oas [get] /admin/default-shipping-option/easypost
 * operationId: "GetDefaultShippingOptionEasypost"
 * summary: "List EasyPost Shipping Options"
 * description: "Retrieves a list of available shipping options from EasyPost."
 * x-authenticated: true
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 * tags:
 *   - Default Shipping Option
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The EasyPost shipping option ID
 *                   name:
 *                     type: string
 *                     description: The name of the shipping option
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { result } = await getEasyPostOptions(req.scope).run()
  res.json(result)
}
