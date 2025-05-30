import { toast } from '@medusajs/ui'

import { useQueryParams } from '../../../hooks/use-query-params'

export const validateEmail = (email: string) => {
  if (!email) {
    toast.error('Please enter an email')
    return false
  }

  if (!email.includes('@')) {
    toast.error('Please enter a valid email')
    return false
  }

  if (!email.includes('.')) {
    toast.error('Please enter a valid email')
    return false
  }

  if (email.length < 3) {
    toast.error('Please enter a valid email')
    return false
  }

  if (email.length > 255) {
    toast.error('Please enter a valid email')
    return false
  }

  if (email.includes(' ')) {
    toast.error('Please enter a valid email')
    return false
  }

  return true
}

export const useSellersTableQuery = ({ prefix, pageSize = 20 }: any) => {
  const queryObject = useQueryParams(
    ['offset', 'q', 'created_at', 'status', 'id', 'order'],
    prefix
  )

  const { offset, created_at, status, q, order } = queryObject

  const searchParams: any = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    status: status?.split(','),
    q,
    fields: 'id,email,name,created_at,status',
    order: order ? order : undefined
  }

  return {
    searchParams,
    raw: queryObject
  }
}
