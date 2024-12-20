import { CreatedAtOption } from '@/features/order-table-filters/ui'
import { useSearchState } from '@/shared/hooks'
import { subMonths } from 'date-fns'
import { DateRange } from 'react-day-picker'

const DEFAULT_DATE_RANGE = {
  from: subMonths(new Date(), 1),
  to: new Date()
}

export const useOrdersFilters = () => {
  const [createdAt, setCreatedAt] = useSearchState<CreatedAtOption | null>({
    name: 'createdAt'
  })

  const [page, setPage] = useSearchState<number | null>({
    name: 'page',
    deserialize: (value) => {
      if (!value) return null

      const page = parseInt(value)

      return page
    },
    withPageParam: true
  })

  const [dateRange, setDateRange] = useSearchState<DateRange | null>({
    name: 'dateRange',
    serialize: (value) =>
      value?.from && value?.to
        ? `${value.from.toISOString()},${value.to.toISOString()}`
        : '',
    deserialize: (value) => {
      if (!value) return DEFAULT_DATE_RANGE
      const [from, to] = value.split(',')
      return {
        from: new Date(from),
        to: new Date(to)
      }
    }
  })

  return {
    createdAt,
    setCreatedAt,
    page,
    setPage,
    dateRange,
    setDateRange
  }
}
