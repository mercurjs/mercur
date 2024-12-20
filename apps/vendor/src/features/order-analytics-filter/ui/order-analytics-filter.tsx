import { DatePickerWithRange } from '@/shared/ui'
import { DateRange } from 'react-day-picker'

type OrderAnalyticsFilterProps = {
  dateRange?: DateRange
  onDateRangeChange: (dateRange?: DateRange) => void
}

export const OrderAnalyticsFilter = ({
  dateRange,
  onDateRangeChange
}: OrderAnalyticsFilterProps) => {
  return <DatePickerWithRange date={dateRange} setDate={onDateRangeChange} />
}
