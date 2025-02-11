import { z } from 'zod'

export const CarrierAccount = z.object({
  id: z.string(),
  object: z.string(),
  type: z.string(),
  description: z.string(),
  readable: z.string(),
  logo: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
})

export const GetAccountsResponse = z.array(CarrierAccount)
