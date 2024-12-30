import { TableFilter } from '@/shared/ui/table-filter'

export type CreatedAtOption =
  | 'today'
  | 'last_24_hours'
  | 'last_48_hours'
  | 'last_72_hours'
  | 'last_month'

const createdAtOptions: { value: CreatedAtOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last_24_hours', label: 'Last 24 hours' },
  { value: 'last_48_hours', label: 'Last 48 hours' },
  { value: 'last_72_hours', label: 'Last 72 hours' },
  { value: 'last_month', label: 'Last month' }
]

type OrderTableFiltersProps = {
  createdAt: CreatedAtOption | null
  onCreatedAtChange: (createdAt: CreatedAtOption | null) => void
}

export const OrderTableFilters = ({
  onCreatedAtChange,
  createdAt
}: OrderTableFiltersProps) => {
  return (
    <div className="flex gap-2">
      <TableFilter
        options={createdAtOptions}
        label="Created at"
        value={createdAt}
        onChange={(value) => onCreatedAtChange(value as CreatedAtOption)}
      />
    </div>
  )
}
