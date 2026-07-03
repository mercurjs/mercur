import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const PRODUCT_ATTRIBUTES_QUERY_KEY = "product_attributes" as const
export const productAttributesQueryKeys = queryKeysFactory(
  PRODUCT_ATTRIBUTES_QUERY_KEY
)

/**
 * Sorts each attribute's `values` by `rank` in place. The catalog endpoint
 * returns values in insertion order, so select / multi-select option lists must
 * be rank-ordered client-side to match the configured value order.
 */
const sortAttributeValuesByRank = (
  attributes?: { values?: { rank?: number }[] | null }[] | null
) => {
  attributes?.forEach((attribute) => {
    if (Array.isArray(attribute.values)) {
      attribute.values.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    }
  })
}

export const useProductAttribute = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.productAttributes.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.vendor.productAttributes.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.vendor.productAttributes.$id.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productAttributesQueryKeys.detail(id, query),
    queryFn: async () => {
      const res = await sdk.vendor.productAttributes.$id.query({
        $id: id,
        ...query,
      })
      sortAttributeValuesByRank(
        res?.product_attribute ? [res.product_attribute] : undefined
      )
      return res
    },
    ...options,
  })

  return { ...data, ...rest }
}

export const useProductAttributes = (
  query?: InferClientInput<typeof sdk.vendor.productAttributes.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.vendor.productAttributes.query>,
      ClientError,
      InferClientOutput<typeof sdk.vendor.productAttributes.query>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: productAttributesQueryKeys.list(query),
    queryFn: async () => {
      const res = await sdk.vendor.productAttributes.query({ ...query })
      sortAttributeValuesByRank(res?.product_attributes)
      return res
    },
    ...options,
  })

  return { ...data, ...rest }
}
