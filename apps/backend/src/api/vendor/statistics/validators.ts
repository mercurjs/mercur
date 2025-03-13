import { z } from 'zod'

const DAY_MS = 1000 * 60 * 60 * 24
export type VendorGetStatisticsParamsType = z.infer<
  typeof VendorGetStatisticsParams
>
export const VendorGetStatisticsParams = z
  .object({
    time_from: z.coerce.date(),
    time_to: z.coerce.date()
  })
  .refine(({ time_from, time_to }) => {
    return time_from <= time_to
  }, 'Invalid time range!')
  .refine(({ time_from, time_to }) => {
    return (time_to.getTime() - time_from.getTime()) / DAY_MS <= 30
  }, 'Time range too long (max 30 days)!')
