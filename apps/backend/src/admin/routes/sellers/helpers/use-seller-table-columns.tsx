import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

import { VendorSeller } from '@mercurjs/http-client'
import { SellerStatusBadge } from '../../../components/seller-status-badge/SellerStatusBagde'

const columnHelper = createColumnHelper<VendorSeller>()

export const useSellersTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.display({
        id: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.email
      }),
      columnHelper.display({
        id: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.name
      }),
      columnHelper.display({
        id: 'status',
        header: 'Account Status',
        cell: ({row}) => <SellerStatusBadge status={row.original.status || 'pending' } />
      }),
      columnHelper.display({
        id: 'created_at',
        header: 'Created',
        cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
      })
    ],
    []
  )
}
