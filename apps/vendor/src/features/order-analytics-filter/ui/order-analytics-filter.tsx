import { DatePickerWithRange } from '@/shared/ui'
import { addDays } from 'date-fns'
import { useState } from 'react'
import { DateRange } from 'react-day-picker'

export const OrderAnalyticsFilter = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20)
  })

  return <DatePickerWithRange date={date} setDate={setDate} />
}
