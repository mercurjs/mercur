import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules, MedusaError } from '@medusajs/framework/utils'
import { removeCustomerAccountWorkflow } from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import type { AuthenticationInput } from '@medusajs/framework/types'
import type { StoreDeleteCustomerAccountType } from '../validators'

export const DELETE = async (
  req: MedusaRequest<StoreDeleteCustomerAccountType>,
  res: MedusaResponse
) => {
  const { email, password } = req.validatedBody

  // 1. Authenticate customer using authModuleService
  const authService = req.scope.resolve(Modules.AUTH)

  const { success, authIdentity, error } = await authService.authenticate(
    'emailpass',
    {
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: { email, password },
      protocol: req.protocol
    } as AuthenticationInput
  )

  if (!success || !authIdentity) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      error || 'Invalid email or password'
    )
  }

  // 2. Find customer by auth identity
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customers } = await query.graph({
    entity: 'customer',
    fields: ['id', 'email'],
    filters: {
      email: email
    }
  })

  if (!customers || customers.length === 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Customer account not found'
    )
  }

  const customer = customers[0]

  // 3. Delete customer account (removes customer + auth identity association)
  await removeCustomerAccountWorkflow(req.scope).run({
    input: {
      customerId: customer.id
    }
  })

  res.json({
    id: customer.id,
    object: 'customer',
    deleted: true
  })
}
