import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

import { VendorSeller } from '@mercurjs/http-client'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const sellerQueryKeys = queryKeysFactory('seller')

type SortableFields = 'email' | 'name' | 'created_at'
type SortableOrderFields = 'display_id' | 'created_at' | 'updated_at'
type SortableProductFields = 'title' | 'created_at' | 'updated_at'
type SortableCustomerGroupFields = 'name' | 'created_at' | 'updated_at'

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

const sortOrders = (orders: any[], order: string) => {
  const field = order.startsWith('-')
    ? (order.slice(1) as SortableOrderFields)
    : (order as SortableOrderFields)
  const isDesc = order.startsWith('-')

  return [...orders].sort((a, b) => {
    let aValue: string | number | null | undefined = a[field]
    let bValue: string | number | null | undefined = b[field]

    // Handle null/undefined values
    if (!aValue && aValue !== '') return isDesc ? -1 : 1
    if (!bValue && bValue !== '') return isDesc ? 1 : -1

    // Special handling for dates
    if (field === 'created_at' || field === 'updated_at') {
      const aDate = new Date(String(aValue)).getTime()
      const bDate = new Date(String(bValue)).getTime()
      return isDesc ? bDate - aDate : aDate - bDate
    }

    // Handle display_id as number
    if (field === 'display_id') {
      const aNum = Number(aValue)
      const bNum = Number(bValue)
      return isDesc ? bNum - aNum : aNum - bNum
    }

    // Handle string comparison
    const aString = String(aValue).toLowerCase()
    const bString = String(bValue).toLowerCase()

    if (aString < bString) return isDesc ? 1 : -1
    if (aString > bString) return isDesc ? -1 : 1
    return 0
  })
}

const sortProducts = (products: any[], order: string) => {
  const field = order.startsWith('-')
    ? (order.slice(1) as SortableProductFields)
    : (order as SortableProductFields)
  const isDesc = order.startsWith('-')

  return [...products].sort((a, b) => {
    let aValue: string | number | null | undefined = a[field]
    let bValue: string | number | null | undefined = b[field]

    // Handle null/undefined values
    if (!aValue && aValue !== '') return isDesc ? -1 : 1
    if (!bValue && bValue !== '') return isDesc ? 1 : -1

    // Special handling for dates
    if (field === 'created_at' || field === 'updated_at') {
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

const sortCustomerGroups = (customerGroups: any[], order: string) => {
  const field = order.startsWith('-')
    ? (order.slice(1) as SortableCustomerGroupFields)
    : (order as SortableCustomerGroupFields)
  const isDesc = order.startsWith('-')

  return [...customerGroups].sort((a, b) => {
    let aValue: string | number | null | undefined = a[field]
    let bValue: string | number | null | undefined = b[field]

    // Handle null/undefined values
    if (!aValue && aValue !== '') return isDesc ? -1 : 1
    if (!bValue && bValue !== '') return isDesc ? 1 : -1

    // Special handling for dates
    if (field === 'created_at' || field === 'updated_at') {
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
    queryKey: sellerQueryKeys.list(),
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
          fields:
            'id,email,name,created_at,store_status,description,handle,phone,address_line,city,country_code,postal_code,tax_id'
        }
      })
  })
}

export const useSellerOrders = (
  id: string,
  query?: Record<string, string | number>,
  filters?: Record<string, string | number>
) => {
  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', id, query],
    queryFn: () =>
      mercurQuery(`/admin/sellers/${id}/orders`, {
        method: 'GET',
        query
      })
  })

  if (!data?.orders) {
    return { data, isLoading }
  }

  let processedOrders = [...data.orders]

  if (!filters?.q) {
    return {
      data: { ...data, orders: processedOrders },
      isLoading
    }
  }

  if (filters?.q) {
    const searchTerm = String(filters.q).toLowerCase()
    processedOrders = processedOrders.filter(
      (order) =>
        order.customer?.first_name?.toLowerCase().includes(searchTerm) ||
        order.customer?.last_name?.toLowerCase().includes(searchTerm) ||
        order.customer?.email?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply sorting if present
  if (filters?.order) {
    const order = String(filters.order)
    const validOrders = [
      'display_id',
      '-display_id',
      'created_at',
      '-created_at',
      'updated_at',
      '-updated_at'
    ] as const

    if (validOrders.includes(order as (typeof validOrders)[number])) {
      processedOrders = sortOrders(processedOrders, order)
    }
  }

  // Apply offset pagination if present
  if (filters?.offset !== undefined) {
    const offset = Number(filters.offset) || 0
    const limit = Number(filters.limit) || 10
    processedOrders = processedOrders.slice(offset, offset + limit)
  }

  return {
    data: {
      ...data,
      orders: processedOrders,
      count: processedOrders.length
    },
    isLoading
  }
}

export const useUpdateSeller = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      mercurQuery(`/admin/sellers/${id}`, { method: 'POST', body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.list() })
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.detail(id) })
    }
  })
}

export const useSellerProducts = (
  id: string,
  query?: Record<string, string | number>,
  filters?: Record<string, string | number>
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seller-products', id, query],
    queryFn: () =>
      mercurQuery(`/admin/sellers/${id}/products`, { method: 'GET', query })
  })

  if (!data?.products) {
    return { data, isLoading, refetch }
  }

  let processedProducts = [...data.products]

  // Apply search filter if present
  if (filters?.q) {
    const searchTerm = String(filters.q).toLowerCase()
    processedProducts = processedProducts.filter((product) =>
      product.title?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply sorting if present
  if (filters?.order) {
    const order = String(filters.order)
    const validOrders = [
      'title',
      '-title',
      'created_at',
      '-created_at',
      'updated_at',
      '-updated_at'
    ] as const

    if (validOrders.includes(order as (typeof validOrders)[number])) {
      processedProducts = sortProducts(processedProducts, order)
    }
  }

  // Apply offset pagination if present
  if (filters?.offset !== undefined) {
    const offset = Number(filters.offset) || 0
    const limit = Number(filters.limit) || 10
    processedProducts = processedProducts.slice(offset, offset + limit)
  }

  return {
    data: {
      ...data,
      products: processedProducts
    },
    count: processedProducts.length,
    isLoading,
    refetch
  }
}

export const useSellerCustomerGroups = (
  id: string,
  query?: Record<string, string | number>,
  filters?: Record<string, string | number>
) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seller-customer-groups', id, query],
    queryFn: () =>
      mercurQuery(`/admin/sellers/${id}/customer-groups`, {
        method: 'GET',
        query
      })
  })

  if (!data?.customer_groups) {
    return {
      data,
      isLoading,
      refetch
    }
  }

  let processedCustomerGroups = [
    ...data.customer_groups.filter((group: any) => !!group)
  ]

  // Apply search filter if present
  if (filters?.q) {
    const searchTerm = String(filters.q).toLowerCase()
    processedCustomerGroups = processedCustomerGroups.filter((group) =>
      group.name?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply sorting if present
  if (filters?.order) {
    const order = String(filters.order)
    const validOrders = [
      'name',
      '-name',
      'created_at',
      '-created_at',
      'updated_at',
      '-updated_at'
    ] as const

    if (validOrders.includes(order as (typeof validOrders)[number])) {
      processedCustomerGroups = sortCustomerGroups(
        processedCustomerGroups,
        order
      )
    }
  }

  // Apply offset pagination if present
  if (filters?.offset !== undefined) {
    const offset = Number(filters.offset) || 0
    const limit = Number(filters.limit) || 10
    processedCustomerGroups = processedCustomerGroups.slice(
      offset,
      offset + limit
    )
  }

  return {
    data: {
      ...data,
      customer_groups: processedCustomerGroups,
      count: processedCustomerGroups.length
    },
    count: processedCustomerGroups.length,
    isLoading,
    refetch
  }
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

export const useOrderSet = (id: string) => {
  return useQuery({
    queryKey: ['order-set', id],
    queryFn: () =>
      mercurQuery(`/admin/order-sets?order_id=${id}`, {
        method: 'GET'
      })
  })
}
