import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export const fetchAdminEmails = async (
  scope: MedusaContainer
): Promise<string[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: admins } = await query.graph({
    entity: 'user',
    fields: ['email']
  })

  return admins.map((admin) => admin.email)
}
