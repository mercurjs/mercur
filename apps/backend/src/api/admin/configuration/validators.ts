import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

import { ConfigurationRuleType } from '../../../modules/configuration/types'

export type AdminGetRulesParamsType = z.infer<typeof AdminGetRulesParams>
export const AdminGetRulesParams = createFindParams({
  offset: 0,
  limit: 50
})

export type AdminCreateRuleType = z.infer<typeof AdminCreateRule>
export const AdminCreateRule = z.object({
  rule_type: z.nativeEnum(ConfigurationRuleType),
  is_enabled: z.boolean()
})

export type AdminUpdateRuleType = z.infer<typeof AdminUpdateRule>
export const AdminUpdateRule = z.object({
  is_enabled: z.boolean()
})
