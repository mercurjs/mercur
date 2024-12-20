import { subMonths } from 'date-fns'

import { subHours } from 'date-fns'

import { CreatedAtOption } from '@/features/order-table-filters'

import { startOfDay } from 'date-fns'

export const createdAtOptionToDate: Record<CreatedAtOption, string> = {
  today: startOfDay(new Date()).toISOString(),
  last_24_hours: subHours(new Date(), 24).toISOString(),
  last_48_hours: subHours(new Date(), 48).toISOString(),
  last_72_hours: subHours(new Date(), 72).toISOString(),
  last_month: subMonths(new Date(), 1).toISOString()
}
