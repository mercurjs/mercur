import { toast } from '@medusajs/ui'

import { useQueryParams } from '../../../hooks/use-query-params'
import { currencies } from './currencies'

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

export const useSellerOrdersTableQuery = ({
  prefix = 'so',
  pageSize = 20
}: any) => {
  const queryObject = useQueryParams(
    [
      'offset',
      'q',
      'created_at',
      'updated_at',
      'status',
      'id',
      'order',
      'region_id',
      'sales_channel_id',
      'type_id',
      'tag_id'
    ],
    prefix
  )

  const {
    offset,
    created_at,
    updated_at,
    status,
    q,
    order,
    region_id,
    sales_channel_id,
    type_id,
    tag_id
  } = queryObject

  const searchParams: any = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    status: status?.split(','),
    q,
    fields: 'id,email,name,created_at,status',
    order: order ? order : undefined,
    region_id: region_id ? region_id.split(',') : undefined,
    sales_channel_id: sales_channel_id
      ? sales_channel_id.split(',')
      : undefined,
    type_id: type_id ? type_id.split(',') : undefined,
    tag_id: tag_id ? tag_id.split(',') : undefined
  }

  return {
    searchParams,
    raw: queryObject
  }
}

export const getDecimalDigits = (currency: string) => {
  return currencies[currency.toUpperCase()]?.decimal_digits ?? 0
}

export const getNativeSymbol = (currencyCode: string) => {
  const formatted = new Intl.NumberFormat([], {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol'
  }).format(0)

  return formatted.replace(/\d/g, '').replace(/[.,]/g, '').trim()
}

export const isAmountLessThenRoundingError = (
  amount: number,
  currencyCode: string
) => {
  const decimalDigits = getDecimalDigits(currencyCode)
  return Math.abs(amount) < 1 / 10 ** decimalDigits / 2
}

export const getStylizedAmount = (amount: number, currencyCode: string) => {
  const symbol = getNativeSymbol(currencyCode)
  const decimalDigits = getDecimalDigits(currencyCode)

  const lessThanRoundingPrecission = isAmountLessThenRoundingError(
    amount,
    currencyCode
  )

  const total = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimalDigits,
    maximumFractionDigits: decimalDigits,
    signDisplay: lessThanRoundingPrecission ? 'exceptZero' : 'auto'
  })

  return `${symbol} ${total} ${currencyCode.toUpperCase()}`
}
