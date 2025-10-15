import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

import { ConfigurationRuleType } from '@mercurjs/framework'

export type AdminGetRulesParamsType = z.infer<typeof AdminGetRulesParams>
export const AdminGetRulesParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema AdminCreateRule
 * type: object
 * properties:
 *   rule_type:
 *     type: string
 *     description: The type of the rule
 *     enum: [global_product_catalog,require_product_approval,product_request_enabled,product_import_enabled]
 *   is_enabled:
 *     type: boolean
 */
export type AdminCreateRuleType = z.infer<typeof AdminCreateRule>
export const AdminCreateRule = z.object({
  rule_type: z.nativeEnum(ConfigurationRuleType),
  is_enabled: z.boolean()
})

/**
 * @schema AdminUpdateRule
 * type: object
 * properties:
 *   is_enabled:
 *     type: boolean
 */
export type AdminUpdateRuleType = z.infer<typeof AdminUpdateRule>
export const AdminUpdateRule = z.object({
  is_enabled: z.boolean()
})
