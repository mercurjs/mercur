import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { HttpTypes } from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  RuleOperator,
  RuleType,
  remoteQueryObjectFromString
} from '@medusajs/framework/utils'
import { operatorsMap } from '@medusajs/medusa/api/admin/promotions/utils/operators-map'
import { getRuleAttributesMap } from '@medusajs/medusa/api/admin/promotions/utils/rule-attributes-map'
import { ruleQueryConfigurations } from '@medusajs/medusa/api/admin/promotions/utils/rule-query-configuration'
import { validateRuleType } from '@medusajs/medusa/api/admin/promotions/utils/validate-rule-type'

/**
 * @oas [get] /vendor/promotions/{id}/{rule_type}
 * operationId: VendorGetPromotionsIdRuleType
 * summary: List Rules of a Promotion
 * description: Retrieve a list of rules in a promotion.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The promotion's ID.
 *     required: true
 *     schema:
 *       type: string
 *   - name: rule_type
 *     in: path
 *     description: The type of rules to retrieve.
 *     required: true
 *     schema:
 *       type: string
 *       enum:
 *         - rules
 *         - target-rules
 *         - buy-rules
 *   - name: fields
 *     in: query
 *     description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *       fields. without prefix it will replace the entire default fields.
 *     required: false
 *     schema:
 *       type: string
 *       title: fields
 *       description: Comma-separated fields that should be included in the returned data. if a field is prefixed with `+` it will be added to the default fields, using `-` will remove it from the default
 *         fields. without prefix it will replace the entire default fields.
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
 *           description: The list of promotion rules.
 *           properties:
 *             rules:
 *               type: array
 *               description: The list of promotion rules.
 *               items:
 *                 $ref: "#/components/schemas/VendorPromotionRule"
 */

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id, rule_type: ruleType } = req.params
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  validateRuleType(ruleType)

  const dasherizedRuleType = ruleType.split('-').join('_')
  const queryObject = remoteQueryObjectFromString({
    entryPoint: 'promotion',
    variables: { id },
    fields: req.queryConfig.fields
  })

  const [promotion] = await remoteQuery(queryObject)
  const ruleAttributes = getRuleAttributesMap({
    promotionType: promotion?.type || req.query.promotion_type,
    applicationMethodType:
      promotion?.application_method?.type || req.query.application_method_type
  })[ruleType]
  const promotionRules: any[] = []

  if (dasherizedRuleType === RuleType.RULES) {
    promotionRules.push(...(promotion?.rules || []))
  } else if (dasherizedRuleType === RuleType.TARGET_RULES) {
    promotionRules.push(...(promotion?.application_method?.target_rules || []))
  } else if (dasherizedRuleType === RuleType.BUY_RULES) {
    promotionRules.push(...(promotion?.application_method?.buy_rules || []))
  }

  const transformedRules: HttpTypes.AdminPromotionRule[] = []
  const disguisedRules = ruleAttributes.filter((attr) => !!attr.disguised)

  for (const disguisedRule of disguisedRules) {
    const getValues = () => {
      const value = promotion?.application_method?.[disguisedRule.id]

      if (disguisedRule.field_type === 'number') {
        return value
      }

      if (value) {
        return [{ label: value, value }]
      }

      return []
    }

    const required = disguisedRule.required ?? true
    const applicationMethod = promotion?.application_method
    const recordValue = applicationMethod?.[disguisedRule.id]

    if (required || recordValue) {
      transformedRules.push({
        ...disguisedRule,
        id: undefined,
        attribute: disguisedRule.id,
        attribute_label: disguisedRule.label,
        operator: RuleOperator.EQ,
        operator_label: operatorsMap[RuleOperator.EQ].label,
        value: undefined,
        values: getValues()
      })
    }

    continue
  }

  for (const promotionRule of [...promotionRules, ...transformedRules]) {
    const currentRuleAttribute = ruleAttributes.find(
      (attr) =>
        attr.value === promotionRule.attribute ||
        attr.value === promotionRule.attribute
    )

    if (!currentRuleAttribute) {
      continue
    }

    const queryConfig = ruleQueryConfigurations[currentRuleAttribute.id]

    if (!queryConfig) {
      continue
    }

    const rows = await remoteQuery(
      remoteQueryObjectFromString({
        entryPoint: queryConfig.entryPoint,
        variables: {
          filters: {
            [queryConfig.valueAttr]: promotionRule.values?.map((v) => v.value)
          }
        },
        fields: [queryConfig.labelAttr, queryConfig.valueAttr]
      })
    )

    const valueLabelMap = new Map<string, string>(
      rows.map((row) => [
        row[queryConfig.valueAttr],
        row[queryConfig.labelAttr]
      ])
    )

    promotionRule.values =
      promotionRule.values?.map((value) => ({
        value: value.value,
        label: valueLabelMap.get(value.value) || value.value
      })) || promotionRule.values

    if (!currentRuleAttribute.hydrate) {
      transformedRules.push({
        ...currentRuleAttribute,
        ...promotionRule,
        attribute_label: currentRuleAttribute.label,
        operator_label:
          operatorsMap[promotionRule.operator]?.label || promotionRule.operator
      })
    }
  }

  res.json({
    rules: transformedRules
  })
}
