import { z } from 'zod'

export type StoreDeleteCustomerAccountType = z.infer<
  typeof StoreDeleteCustomerAccount
>

export const StoreDeleteCustomerAccount = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
  .strict()
