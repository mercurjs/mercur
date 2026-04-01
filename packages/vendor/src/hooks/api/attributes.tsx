import {
  QueryKey,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const ATTRIBUTES_QUERY_KEY = "attributes" as const
export const attributesQueryKeys = queryKeysFactory(ATTRIBUTES_QUERY_KEY)

type Attribute = {
  id: string
  name: string
  handle: string
  ui_component: string
  is_required: boolean
  description?: string
  values?: Array<{
    id: string
    value: string
    metadata?: Record<string, any>
  }>
  possible_values?: Array<{
    id: string
    value: string
    rank: number
  }>
  product_categories?: Array<{
    id: string
    name: string
  }>
  metadata?: Record<string, any>
}

export const useAttributes = (
  query?: {
    offset?: number
    limit?: number
    fields?: string
    id?: string
    name?: string
    handle?: string
    ui_component?: string
  },
  options?: Omit<
    UseQueryOptions<
      {
        attributes: Attribute[]
        count: number
        offset: number
        limit: number
      },
      Error,
      {
        attributes: Attribute[]
        count: number
        offset: number
        limit: number
      },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/attributes", {
        method: "GET",
        query: query as Record<string, string | number>,
      }),
    queryKey: attributesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useAttribute = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      { attribute: Attribute },
      Error,
      { attribute: Attribute },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/attributes/${id}`, {
        method: "GET",
      }),
    queryKey: attributesQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}
