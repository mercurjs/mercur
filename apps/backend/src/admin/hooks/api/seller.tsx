import {
  QueryKey,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'
import { VendorSeller } from '../../routes/sellers/types'

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
  filters?: any
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

  // Apply search filter if present
  if (filters?.q) {
    const searchTerm = String(filters.q).toLowerCase()
    processedOrders = processedOrders.filter(
      (order) =>
        order.customer?.first_name?.toLowerCase().includes(searchTerm) ||
        order.customer?.last_name?.toLowerCase().includes(searchTerm) ||
        order.customer?.email?.toLowerCase().includes(searchTerm)
    )
  }

  // Filter by region_id
  if (filters?.region_id && Array.isArray(filters.region_id)) {
    processedOrders = processedOrders.filter(
      (order) => order.region_id && filters.region_id.includes(order.region_id)
    )
  }

  // Filter by sales_channel_id
  if (filters?.sales_channel_id && Array.isArray(filters.sales_channel_id)) {
    processedOrders = processedOrders.filter(
      (order) =>
        order.sales_channel_id &&
        filters.sales_channel_id.includes(order.sales_channel_id)
    )
  }

  // Filter by created_at date ranges
  if (filters?.created_at) {
    const dateFilter = filters.created_at as any
    if (dateFilter.$gte) {
      const filterDate = new Date(dateFilter.$gte)
      processedOrders = processedOrders.filter((order) => {
        const orderCreatedAt = new Date(order.created_at || '')
        return orderCreatedAt >= filterDate
      })
    }
    if (dateFilter.$lte) {
      const filterDate = new Date(dateFilter.$lte)
      processedOrders = processedOrders.filter((order) => {
        const orderCreatedAt = new Date(order.created_at || '')
        return orderCreatedAt <= filterDate
      })
    }
  }

  // Filter by updated_at date ranges
  if (filters?.updated_at) {
    const dateFilter = filters.updated_at as any

    if (dateFilter.$gte) {
      const filterDate = new Date(dateFilter.$gte)
      processedOrders = processedOrders.filter((order) => {
        const orderUpdatedAt = new Date(order.updated_at || '')
        return orderUpdatedAt >= filterDate
      })
    }
    if (dateFilter.$lte) {
      const filterDate = new Date(dateFilter.$lte)
      processedOrders = processedOrders.filter((order) => {
        const orderUpdatedAt = new Date(order.updated_at || '')
        return orderUpdatedAt <= filterDate
      })
    }
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

  const offset = Number(filters.offset) || 0
  const limit = Number(filters.limit) || 10

  return {
    data: {
      ...data,
      orders: processedOrders.slice(offset, offset + limit),
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
  filters?: any
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

  // Filter by tag_id
  if (filters?.tag_id && Array.isArray(filters.tag_id)) {
    processedProducts = processedProducts.filter((product) =>
      product.tags?.some((tag: any) => filters.tag_id.includes(tag.id))
    )
  }

  // Filter by type_id
  if (filters?.type_id && Array.isArray(filters.type_id)) {
    processedProducts = processedProducts.filter((product) =>
      filters.type_id.includes(product.type_id)
    )
  }

  // Filter by sales_channel_id
  if (filters?.sales_channel_id && Array.isArray(filters.sales_channel_id)) {
    processedProducts = processedProducts.filter((product) =>
      product.sales_channels?.some((channel: any) =>
        filters.sales_channel_id.includes(channel.id)
      )
    )
  }

  // Filter by status
  if (filters?.status && Array.isArray(filters.status)) {
    processedProducts = processedProducts.filter((product) =>
      filters.status.includes(product.status)
    )
  }

  // Filter by created_at date ranges
  if (filters?.created_at) {
    const dateFilter = filters.created_at as any
    if (dateFilter.$gte) {
      const filterDate = new Date(dateFilter.$gte)
      processedProducts = processedProducts.filter((product) => {
        const productCreatedAt = new Date(product.created_at || '')
        return productCreatedAt >= filterDate
      })
    }
    if (dateFilter.$lte) {
      const filterDate = new Date(dateFilter.$lte)
      processedProducts = processedProducts.filter((product) => {
        const productCreatedAt = new Date(product.created_at || '')
        return productCreatedAt <= filterDate
      })
    }
  }

  // Filter by updated_at date ranges
  if (filters?.updated_at) {
    const dateFilter = filters.updated_at as any
    if (dateFilter.$gte) {
      const filterDate = new Date(dateFilter.$gte)
      processedProducts = processedProducts.filter((product) => {
        const productUpdatedAt = new Date(product.updated_at || '')
        return productUpdatedAt >= filterDate
      })
    }
    if (dateFilter.$lte) {
      const filterDate = new Date(dateFilter.$lte)
      processedProducts = processedProducts.filter((product) => {
        const productUpdatedAt = new Date(product.updated_at || '')
        return productUpdatedAt <= filterDate
      })
    }
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

  // Apply pagination
  const offset = Number(filters?.offset) || 0
  const limit = Number(filters?.limit) || 10

  return {
    data: {
      ...data,
      products: processedProducts.slice(offset, offset + limit),
      count: processedProducts.length
    },
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

  // Filter by created_at date ranges
  if (filters?.created_at) {
    const dateFilter = filters.created_at as any
    if (dateFilter.$gte) {
      const filterDate = new Date(dateFilter.$gte)
      processedCustomerGroups = processedCustomerGroups.filter((group) => {
        const groupCreatedAt = new Date(group.created_at || '')
        return groupCreatedAt >= filterDate
      })
    }
    if (dateFilter.$lte) {
      const filterDate = new Date(dateFilter.$lte)
      processedCustomerGroups = processedCustomerGroups.filter((group) => {
        const groupCreatedAt = new Date(group.created_at || '')
        return groupCreatedAt <= filterDate
      })
    }
  }

  // Filter by updated_at date ranges
  if (filters?.updated_at) {
    const dateFilter = filters.updated_at as any
    if (dateFilter.$gte) {
      const filterDate = new Date(dateFilter.$gte)
      processedCustomerGroups = processedCustomerGroups.filter((group) => {
        const groupUpdatedAt = new Date(group.updated_at || '')
        return groupUpdatedAt >= filterDate
      })
    }
    if (dateFilter.$lte) {
      const filterDate = new Date(dateFilter.$lte)
      processedCustomerGroups = processedCustomerGroups.filter((group) => {
        const groupUpdatedAt = new Date(group.updated_at || '')
        return groupUpdatedAt <= filterDate
      })
    }
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

  const offset = Number(filters?.offset) || 0
  const limit = Number(filters?.limit) || 10

  return {
    data: {
      ...data,
      customer_groups: processedCustomerGroups.slice(offset, offset + limit),
      count: processedCustomerGroups.length
    },
    count: processedCustomerGroups.length,
    isLoading,
    refetch
  }
}

export const useInviteSeller = () => {
  return useMutation({
    mutationFn: ({
      email,
      registration_url = undefined
    }: {
      email: string
      registration_url?: string
    }) =>
      mercurQuery('/admin/sellers/invite', {
        method: 'POST',
        body: { email, registration_url }
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
