import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { validateRuleType } from '@medusajs/medusa/api/admin/promotions/utils/validate-rule-type'

import { getRuleAttributesMap } from '../../utils'

/**
 * @oas [get] /vendor/promotions/rule-attribute-options/{rule_type}
 * operationId: VendorGetPromotionsRuleAttributeOptionsRule
 * summary: List Rule Attribute Options of a Rule Type
 * x-sidebar-summary: List Potential Rule Attributes
 * description: Retrieve a list of potential rule attributes for the promotion and application method types specified in the query parameters.
 * x-authenticated: true
 * parameters:
 *   - name: rule_type
 *     in: path
 *     description: The rule type.
 *     required: true
 *     schema:
 *       type: string
 *       enum:
 *         - rules
 *         - target-rules
 *         - buy-rules
 *   - name: promotion_type
 *     in: query
 *     description: The promotion type to retrieve rules for.
 *     required: false
 *     schema:
 *       type: string
 *       title: promotion_type
 *       description: The promotion type to retrieve rules for.
 *       enum:
 *         - standard
 *         - buyget
 *   - name: application_method_type
 *     in: query
 *     description: The application method type to retrieve rules for.
 *     required: false
 *     schema:
 *       type: string
 *       title: application_method_type
 *       description: The application method type to retrieve rules for.
 *       enum:
 *         - fixed
 *         - percentage
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * tags:
 *   - Vendor Promotions
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           description: The list of attributes.
 *           properties:
 *             attributes:
 *               type: array
 *               description: The list of attributes.
 *               items:
 *                 $ref: "#/components/schemas/VendorRuleAttributeOption"
 *
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { rule_type: ruleType } = req.params

  validateRuleType(ruleType)

  const attributes =
    getRuleAttributesMap({
      promotionType: req.query.promotion_type as string,
      applicationMethodType: req.query.application_method_type as string
    })[ruleType] || []

  res.json({
    attributes
  })
}
