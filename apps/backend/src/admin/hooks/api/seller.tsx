import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { VendorSeller } from '@mercurjs/http-client'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const sellerQueryKeys = queryKeysFactory('seller')

type SortableFields = 'email' | 'name' | 'created_at'

const sortSellers = (sellers: VendorSeller[], order: string) => {
  const field = order.startsWith('-')
    ? (order.slice(1) as SortableFields)
    : (order as SortableFields)
  const isDesc = order.startsWith('-')

  return [...sellers].sort((a, b) => {
    let aValue: string | number | null | undefined = a[field]
    let bValue: string | number | null | undefined = b[field]

    // Handle null/undefined values
    if (!aValue && aValue !== '') return isDesc ? -1 : 1
    if (!bValue && bValue !== '') return isDesc ? 1 : -1

    // Special handling for dates
    if (field === 'created_at') {
      const aDate = new Date(String(aValue)).getTime()
      const bDate = new Date(String(bValue)).getTime()
      return isDesc ? bDate - aDate : aDate - bDate
    }

    // Handle string comparison
    const aString = String(aValue).toLowerCase()
    const bString = String(bValue).toLowerCase()

    if (aString < bString) return isDesc ? 1 : -1
    if (aString > bString) return isDesc ? -1 : 1
    return 0
  })
}

export const useSellers = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      Record<string, string | number>,
      Error,
      { sellers: VendorSeller[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >,
  filters?: Record<string, string | number>
) => {
  const { data, ...other } = useQuery({
    queryKey: sellerQueryKeys.list(query),
    queryFn: () =>
      mercurQuery('/admin/sellers', {
        method: 'GET',
        query
      }),
    ...options
  })

  if (!data?.sellers) {
    return { ...data, ...other }
  }

  let processedSellers = [...data.sellers]

  // Apply search filter if present
  if (filters?.q) {
    const searchTerm = String(filters.q).toLowerCase()
    processedSellers = processedSellers.filter(
      (seller) =>
        seller.name?.toLowerCase().includes(searchTerm) ||
        seller.email?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply sorting if present
  if (filters?.order) {
    const order = String(filters.order)
    const validOrders = [
      'email',
      '-email',
      'name',
      '-name',
      'created_at',
      '-created_at'
    ] as const

    if (validOrders.includes(order as (typeof validOrders)[number])) {
      processedSellers = sortSellers(processedSellers, order)
    }
  }

  return {
    ...data,
    sellers: processedSellers,
    ...other
  }
}

export const useSeller = (id: string) => {
  return useQuery({
    queryKey: sellerQueryKeys.detail(id),
    queryFn: () =>
      mercurQuery(`/admin/sellers/${id}`, {
        method: 'GET',
        query: {
          fields: 'id,email,name,created_at,status,description,handle,phone'
        }
      })
  })
}

export const useSellerOrders = (id: string) => {
  return useQuery({
    queryKey: ['seller-orders', id],
    queryFn: () => mercurQuery(`/admin/sellers/${id}/orders`, { method: 'GET' })
  })
}

export const useInviteSeller = () => {
  return useMutation({
    mutationFn: (email: string) =>
      mercurQuery('/admin/sellers/invite', {
        method: 'POST',
        body: email
      })
  })
}
