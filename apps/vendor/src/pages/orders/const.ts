import dayjs from 'dayjs'

import { CreatedAtOption } from '@/features/order-table-filters'

export const createdAtOptionToDate: Record<CreatedAtOption, string> = {
  today: dayjs().startOf('day').toISOString(),
  last_24_hours: dayjs().subtract(24, 'hour').toISOString(),
  last_48_hours: dayjs().subtract(48, 'hour').toISOString(),
  last_72_hours: dayjs().subtract(72, 'hour').toISOString(),
  last_month: dayjs().subtract(1, 'month').toISOString()
}
