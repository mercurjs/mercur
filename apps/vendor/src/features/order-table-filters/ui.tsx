import { TableFilter } from '@/shared/ui/table-filter'
import { useState } from 'react'

export const OrderTableFilters = () => {
  const [status, setStatus] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  return (
    <div className="flex gap-2">
      <TableFilter
        options={[{ value: 'paid', label: 'Paid' }]}
        label="Status"
        value={status}
        onChange={(value) => setStatus(value)}
      />
      <TableFilter
        options={[
          { value: '2024-12-19', label: 'Last 24 hours' },
          { value: '2024-12-18', label: 'Last 48 hours' },
          { value: '2024-12-17', label: 'Last 72 hours' }
        ]}
        label="Created at"
        value={createdAt}
        onChange={(value) => setCreatedAt(value)}
      />
    </div>
  )
}
