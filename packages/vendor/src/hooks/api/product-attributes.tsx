import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const PRODUCT_ATTRIBUTES_QUERY_KEY = "product_attributes" as const
export const productAttributesQueryKeys = queryKeysFactory(
  PRODUCT_ATTRIBUTES_QUERY_KEY
)

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
    queryFn: async () =>
      sdk.vendor.productAttributes.$id.query({ $id: id, ...query }),
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
    queryFn: async () => sdk.vendor.productAttributes.query({ ...query }),
    ...options,
  })

  return { ...data, ...rest }
}
